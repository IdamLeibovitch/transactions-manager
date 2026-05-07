using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TransactionsManager.Contracts.Events;
using TransactionsManager.Contracts.Messaging;
using TransactionsManager.TransactionProcessor.Messaging;
using TransactionsManager.TransactionProcessor.Rules;

namespace TransactionsManager.TransactionProcessor;

public class Worker(
    IOptions<RabbitMqOptions> options,
    ITransactionApprovalService approvalService,
    ILogger<Worker> logger) : BackgroundService
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
            ClientProvidedName = "transactions-manager.transaction-processor"
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
                TransactionSubmittedV1? submitted = JsonSerializer.Deserialize<TransactionSubmittedV1>(
                    args.Body.Span,
                    SerializerOptions);

                if (submitted is null)
                {
                    logger.LogWarning("Received empty or invalid TransactionSubmitted payload.");
                    await channel.BasicAckAsync(args.DeliveryTag, multiple: false, cancellationToken: stoppingToken);
                    return;
                }

                ApprovalDecision decision = approvalService.Decide(submitted);

                var processed = new TransactionProcessedV1(
                    EventId: Guid.NewGuid(),
                    OccurredAtUtc: DateTimeOffset.UtcNow,
                    TransactionId: submitted.TransactionId,
                    Status: decision.Status,
                    Region: submitted.Region,
                    TimeZoneId: decision.TimeZoneId,
                    SubmittedAtUtc: submitted.SubmittedAtUtc,
                    LocalSubmittedAt: decision.LocalSubmittedAt,
                    DecisionReason: decision.Reason,
                    CorrelationId: submitted.CorrelationId);

                byte[] body = JsonSerializer.SerializeToUtf8Bytes(processed, SerializerOptions);
                var properties = new BasicProperties
                {
                    Persistent = true,
                    ContentType = "application/json",
                    ContentEncoding = Encoding.UTF8.WebName,
                    MessageId = processed.EventId.ToString(),
                    CorrelationId = processed.CorrelationId.ToString(),
                    Type = EventNames.TransactionProcessedV1,
                    AppId = "transaction-processor",
                    Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds())
                };

                await channel.BasicPublishAsync(
                    exchange: MessagingTopology.TransactionsProcessedExchange,
                    routingKey: string.Empty,
                    mandatory: false,
                    basicProperties: properties,
                    body: body,
                    cancellationToken: stoppingToken);

                await channel.BasicAckAsync(args.DeliveryTag, multiple: false, cancellationToken: stoppingToken);

                logger.LogInformation(
                    "Processed transaction {TransactionId} as {Status}.",
                    processed.TransactionId,
                    processed.Status);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process TransactionSubmitted message.");
                await channel.BasicNackAsync(
                    args.DeliveryTag,
                    multiple: false,
                    requeue: true,
                    cancellationToken: CancellationToken.None);
            }
        };

        await channel.BasicConsumeAsync(
            queue: MessagingTopology.TransactionProcessorSubmittedQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation("Transaction processor is consuming {Queue}.", MessagingTopology.TransactionProcessorSubmittedQueue);

        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }

        logger.LogInformation("Transaction processor is stopping.");
    }

    private static async Task DeclareTopologyAsync(IChannel channel, CancellationToken cancellationToken)
    {
        await channel.ExchangeDeclareAsync(
            exchange: MessagingTopology.TransactionsSubmittedExchange,
            type: ExchangeType.Fanout,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueDeclareAsync(
            queue: MessagingTopology.TransactionProcessorSubmittedQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: MessagingTopology.TransactionProcessorSubmittedQueue,
            exchange: MessagingTopology.TransactionsSubmittedExchange,
            routingKey: string.Empty,
            cancellationToken: cancellationToken);

        await channel.ExchangeDeclareAsync(
            exchange: MessagingTopology.TransactionsProcessedExchange,
            type: ExchangeType.Fanout,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await DeclareProcessedQueueAsync(channel, MessagingTopology.GatewayProcessedQueue, cancellationToken);
        await DeclareProcessedQueueAsync(channel, MessagingTopology.NotificationServiceProcessedQueue, cancellationToken);
    }

    private static async Task DeclareProcessedQueueAsync(
        IChannel channel,
        string queue,
        CancellationToken cancellationToken)
    {
        await channel.QueueDeclareAsync(
            queue: queue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: queue,
            exchange: MessagingTopology.TransactionsProcessedExchange,
            routingKey: string.Empty,
            cancellationToken: cancellationToken);
    }
}
