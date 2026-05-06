namespace TransactionsManager.Contracts.Api.Transactions;

public sealed record CreateTransactionRequest(
    decimal Amount,
    string Currency,
    string MerchantName,
    string Region,
    DateTimeOffset SubmittedAt);
