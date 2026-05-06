using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.Contracts.Api.Notifications;

public sealed record TransactionStatusChangedMessage(
    Guid TransactionId,
    TransactionStatus Status,
    string? DecisionReason,
    DateTimeOffset? ProcessedAtUtc);
