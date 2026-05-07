using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TransactionsManager.Contracts.Api.Notifications;
using TransactionsManager.Contracts.Events;
using TransactionsManager.Contracts.Messaging;
using TransactionsManager.NotificationService.Hubs;
using TransactionsManager.NotificationService.Messaging;

namespace TransactionsManager.NotificationService.Consumers;

public sealed class TransactionProcessedNotificationConsumer(
    IOptions<RabbitMqOptions> options,
    IHubContext<TransactionsHub> hubContext,
    ILogger<TransactionProcessedNotificationConsumer> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly RabbitMqOptions options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = options.Host,
            Port = options.Port,
            UserName = options.Username,
            Password = options.Password,
            VirtualHost = options.VirtualHost,
            ClientProvidedName = "transactions-manager.notification-service"
        };

        await using IConnection connection = await factory.CreateConnectionAsync(stoppingToken);
        await using IChannel channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await DeclareTopologyAsync(channel, stoppingToken);
        await channel.BasicQosAsync(prefetchSize: 0, prefetchCount: 1, global: false, cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, args) =>
        {
            try
            {
                TransactionProcessedV1? processed = JsonSerializer.Deserialize<TransactionProcessedV1>(
                    args.Body.Span,
                    SerializerOptions);

                if (processed is null)
                {
                    logger.LogWarning("Received empty or invalid TransactionProcessed payload.");
                    await channel.BasicAckAsync(args.DeliveryTag, multiple: false, cancellationToken: stoppingToken);
                    return;
                }

                var message = new TransactionStatusChangedMessage(
                    processed.TransactionId,
                    processed.Status,
                    processed.DecisionReason,
                    processed.OccurredAtUtc);

                await hubContext.Clients.All.SendAsync(
                    "transactionStatusChanged",
                    message,
                    stoppingToken);

                await channel.BasicAckAsync(args.DeliveryTag, multiple: false, cancellationToken: stoppingToken);

                logger.LogInformation(
                    "Sent SignalR status update for transaction {TransactionId}.",
                    processed.TransactionId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to notify clients for TransactionProcessed message.");
                await channel.BasicNackAsync(
                    args.DeliveryTag,
                    multiple: false,
                    requeue: true,
                    cancellationToken: CancellationToken.None);
            }
        };

        await channel.BasicConsumeAsync(
            queue: MessagingTopology.NotificationServiceProcessedQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation(
            "Notification service is consuming {Queue}.",
            MessagingTopology.NotificationServiceProcessedQueue);

        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private static async Task DeclareTopologyAsync(IChannel channel, CancellationToken cancellationToken)
    {
        await channel.ExchangeDeclareAsync(
            exchange: MessagingTopology.TransactionsProcessedExchange,
            type: ExchangeType.Fanout,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueDeclareAsync(
            queue: MessagingTopology.NotificationServiceProcessedQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: MessagingTopology.NotificationServiceProcessedQueue,
            exchange: MessagingTopology.TransactionsProcessedExchange,
            routingKey: string.Empty,
            cancellationToken: cancellationToken);
    }
}
