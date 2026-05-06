using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.GatewayApi.Data.Entities;

public sealed class TransactionRecord
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string MerchantName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string? TimeZoneId { get; set; }
    public DateTimeOffset SubmittedAtUtc { get; set; }
    public DateTime? LocalSubmittedAt { get; set; }
    public TransactionStatus Status { get; set; }
    public string? DecisionReason { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? ProcessedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public Guid CorrelationId { get; set; }
}
