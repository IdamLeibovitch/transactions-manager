using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.TransactionProcessor.Rules;

public sealed record ApprovalDecision(
    TransactionStatus Status,
    string TimeZoneId,
    DateTime LocalSubmittedAt,
    string Reason);
