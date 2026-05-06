using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.Contracts.Events;

public sealed record TransactionProcessedV1(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    Guid TransactionId,
    TransactionStatus Status,
    string Region,
    string TimeZoneId,
    DateTimeOffset SubmittedAtUtc,
    DateTime LocalSubmittedAt,
    string DecisionReason,
    Guid CorrelationId);
