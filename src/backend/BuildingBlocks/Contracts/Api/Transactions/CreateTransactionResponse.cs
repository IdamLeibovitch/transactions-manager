using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.Contracts.Api.Transactions;

public sealed record CreateTransactionResponse(
    Guid TransactionId,
    TransactionStatus Status);
