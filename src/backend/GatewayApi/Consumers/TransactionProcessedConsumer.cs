using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TransactionsManager.Contracts.Events;
using TransactionsManager.Contracts.Messaging;
using TransactionsManager.GatewayApi.Data;
using TransactionsManager.GatewayApi.Messaging;

namespace TransactionsManager.GatewayApi.Consumers;

public sealed class TransactionProcessedConsumer(
    IOptions<RabbitMqOptions> options,
    IServiceScopeFactory scopeFactory,
    ILogger<TransactionProcessedConsumer> logger) : BackgroundService
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
            ClientProvidedName = "transactions-manager.gateway-api.processed-consumer"
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

                await UpdateTransactionAsync(processed, stoppingToken);
                await channel.BasicAckAsync(args.DeliveryTag, multiple: false, cancellationToken: stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to consume TransactionProcessed message.");
                await channel.BasicNackAsync(
                    args.DeliveryTag,
                    multiple: false,
                    requeue: true,
                    cancellationToken: CancellationToken.None);
            }
        };

        await channel.BasicConsumeAsync(
            queue: MessagingTopology.GatewayProcessedQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation("Gateway is consuming {Queue}.", MessagingTopology.GatewayProcessedQueue);

        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task UpdateTransactionAsync(TransactionProcessedV1 processed, CancellationToken cancellationToken)
    {
        using IServiceScope scope = scopeFactory.CreateScope();
        GatewayDbContext dbContext = scope.ServiceProvider.GetRequiredService<GatewayDbContext>();

        int updatedCount = await dbContext.Transactions
            .Where(transaction => transaction.Id == processed.TransactionId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(transaction => transaction.Status, processed.Status)
                .SetProperty(transaction => transaction.TimeZoneId, processed.TimeZoneId)
                .SetProperty(transaction => transaction.LocalSubmittedAt, processed.LocalSubmittedAt)
                .SetProperty(transaction => transaction.DecisionReason, processed.DecisionReason)
                .SetProperty(transaction => transaction.ProcessedAtUtc, processed.OccurredAtUtc)
                .SetProperty(transaction => transaction.UpdatedAtUtc, DateTimeOffset.UtcNow),
                cancellationToken);

        if (updatedCount == 0)
        {
            logger.LogWarning(
                "TransactionProcessed event referenced unknown transaction {TransactionId}.",
                processed.TransactionId);
            return;
        }

        logger.LogInformation(
            "Updated transaction {TransactionId} status to {Status}.",
            processed.TransactionId,
            processed.Status);
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
            queue: MessagingTopology.GatewayProcessedQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: MessagingTopology.GatewayProcessedQueue,
            exchange: MessagingTopology.TransactionsProcessedExchange,
            routingKey: string.Empty,
            cancellationToken: cancellationToken);
    }
}
