using TransactionsManager.Contracts.Events;
using TransactionsManager.Contracts.Regions;
using TransactionsManager.Contracts.Transactions;
using TransactionsManager.TransactionProcessor.Rules;

namespace TransactionsManager.UnitTests;

public sealed class TransactionApprovalServiceTests
{
    private readonly TransactionApprovalService approvalService = new();

    [Theory]
    [InlineData("2026-05-07T04:59:59Z", TransactionStatus.Rejected, "Outside banking hours", 7, 59, 59)]
    [InlineData("2026-05-07T05:00:00Z", TransactionStatus.Approved, "Within banking hours", 8, 0, 0)]
    [InlineData("2026-05-07T09:30:00Z", TransactionStatus.Approved, "Within banking hours", 12, 30, 0)]
    [InlineData("2026-05-07T14:59:59Z", TransactionStatus.Approved, "Within banking hours", 17, 59, 59)]
    [InlineData("2026-05-07T15:00:00Z", TransactionStatus.Rejected, "Outside banking hours", 18, 0, 0)]
    public void Decide_ForIsrael_UsesLocalBankingHoursBoundaries(
        string submittedAtUtc,
        TransactionStatus expectedStatus,
        string expectedReason,
        int expectedHour,
        int expectedMinute,
        int expectedSecond)
    {
        TransactionSubmittedV1 transaction = CreateSubmittedTransaction(
            Region: SupportedRegions.Israel,
            SubmittedAtUtc: DateTimeOffset.Parse(submittedAtUtc));

        ApprovalDecision decision = approvalService.Decide(transaction);

        Assert.Equal(expectedStatus, decision.Status);
        Assert.Equal(expectedReason, decision.Reason);
        Assert.Equal("Asia/Jerusalem", decision.TimeZoneId);
        Assert.Equal(new TimeOnly(expectedHour, expectedMinute, expectedSecond), TimeOnly.FromDateTime(decision.LocalSubmittedAt));
    }

    [Fact]
    public void Decide_ForUsEast_AccountsForRegionalTimeZone()
    {
        TransactionSubmittedV1 transaction = CreateSubmittedTransaction(
            Region: SupportedRegions.UsEast,
            SubmittedAtUtc: new DateTimeOffset(2026, 5, 7, 12, 0, 0, TimeSpan.Zero));

        ApprovalDecision decision = approvalService.Decide(transaction);

        Assert.Equal(TransactionStatus.Approved, decision.Status);
        Assert.Equal("America/New_York", decision.TimeZoneId);
        Assert.Equal(new TimeOnly(8, 0), TimeOnly.FromDateTime(decision.LocalSubmittedAt));
    }

    [Theory]
    [InlineData(14, 0, TransactionStatus.Rejected, 7, 0)]
    [InlineData(15, 0, TransactionStatus.Approved, 8, 0)]
    public void Decide_ForUsEast_UsesSelectedRegionTimeForSubmittedInstant(
        int israelHour,
        int israelMinute,
        TransactionStatus expectedStatus,
        int expectedNewYorkHour,
        int expectedNewYorkMinute)
    {
        DateTimeOffset israelSubmittedAt = new(2026, 5, 7, israelHour, israelMinute, 0, TimeSpan.FromHours(3));
        TransactionSubmittedV1 transaction = CreateSubmittedTransaction(
            Region: SupportedRegions.UsEast,
            SubmittedAtUtc: israelSubmittedAt);

        ApprovalDecision decision = approvalService.Decide(transaction);

        Assert.Equal(expectedStatus, decision.Status);
        Assert.Equal("America/New_York", decision.TimeZoneId);
        Assert.Equal(
            new TimeOnly(expectedNewYorkHour, expectedNewYorkMinute),
            TimeOnly.FromDateTime(decision.LocalSubmittedAt));
    }

    [Fact]
    public void Decide_WhenRegionIsUnsupported_RejectsTransaction()
    {
        TransactionSubmittedV1 transaction = CreateSubmittedTransaction(
            Region: "MARS",
            SubmittedAtUtc: new DateTimeOffset(2026, 5, 7, 12, 0, 0, TimeSpan.Zero));

        ApprovalDecision decision = approvalService.Decide(transaction);

        Assert.Equal(TransactionStatus.Rejected, decision.Status);
        Assert.Equal(string.Empty, decision.TimeZoneId);
        Assert.Equal(transaction.SubmittedAtUtc.UtcDateTime, decision.LocalSubmittedAt);
        Assert.Equal("Unsupported region", decision.Reason);
    }

    private static TransactionSubmittedV1 CreateSubmittedTransaction(
        string Region,
        DateTimeOffset SubmittedAtUtc)
    {
        return new TransactionSubmittedV1(
            EventId: Guid.NewGuid(),
            OccurredAtUtc: DateTimeOffset.UtcNow,
            TransactionId: Guid.NewGuid(),
            Amount: 42,
            Currency: "ILS",
            MerchantName: "Terminal 42",
            Region: Region,
            SubmittedAtUtc: SubmittedAtUtc,
            CorrelationId: Guid.NewGuid());
    }
}
