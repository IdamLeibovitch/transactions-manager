namespace TransactionsManager.Contracts.Events;

public sealed record TransactionSubmittedV1(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    Guid TransactionId,
    decimal Amount,
    string Currency,
    string MerchantName,
    string Region,
    DateTimeOffset SubmittedAtUtc,
    Guid CorrelationId);
