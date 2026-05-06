using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using TransactionsManager.Contracts.Messaging;

namespace TransactionsManager.GatewayApi.Messaging;

public interface IEventPublisher
{
    Task PublishTransactionSubmittedAsync<TEvent>(
        TEvent message,
        Guid eventId,
        Guid correlationId,
        CancellationToken cancellationToken)
        where TEvent : notnull;
}

public sealed class RabbitMqEventPublisher(
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqEventPublisher> logger) : IEventPublisher
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly RabbitMqOptions options = options.Value;

    public async Task PublishTransactionSubmittedAsync<TEvent>(
        TEvent message,
        Guid eventId,
        Guid correlationId,
        CancellationToken cancellationToken)
        where TEvent : notnull
    {
        var factory = new ConnectionFactory
        {
            HostName = options.Host,
            Port = options.Port,
            UserName = options.Username,
            Password = options.Password,
            VirtualHost = options.VirtualHost,
            ClientProvidedName = "transactions-manager.gateway-api"
        };

        await using IConnection connection = await factory.CreateConnectionAsync(cancellationToken);
        await using IChannel channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);

        await DeclareTransactionSubmittedTopologyAsync(channel, cancellationToken);

        byte[] body = JsonSerializer.SerializeToUtf8Bytes(message, SerializerOptions);

        var properties = new BasicProperties
        {
            Persistent = true,
            ContentType = "application/json",
            ContentEncoding = Encoding.UTF8.WebName,
            MessageId = eventId.ToString(),
            CorrelationId = correlationId.ToString(),
            Type = EventNames.TransactionSubmittedV1,
            AppId = "gateway-api",
            Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds())
        };

        await channel.BasicPublishAsync(
            exchange: MessagingTopology.TransactionsSubmittedExchange,
            routingKey: string.Empty,
            mandatory: false,
            basicProperties: properties,
            body: body,
            cancellationToken: cancellationToken);

        logger.LogInformation(
            "Published {EventName} with event id {EventId} and correlation id {CorrelationId}.",
            EventNames.TransactionSubmittedV1,
            eventId,
            correlationId);
    }

    private static async Task DeclareTransactionSubmittedTopologyAsync(
        IChannel channel,
        CancellationToken cancellationToken)
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
    }
}
