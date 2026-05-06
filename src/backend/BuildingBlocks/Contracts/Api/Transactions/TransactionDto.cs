using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.Contracts.Api.Transactions;

public sealed record TransactionDto(
    Guid Id,
    decimal Amount,
    string Currency,
    string MerchantName,
    string Region,
    DateTimeOffset SubmittedAtUtc,
    DateTime? LocalSubmittedAt,
    TransactionStatus Status,
    string? DecisionReason,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ProcessedAtUtc);
