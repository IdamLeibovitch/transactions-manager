using TransactionsManager.Contracts.Events;
using TransactionsManager.Contracts.Regions;
using TransactionsManager.Contracts.Time;
using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.TransactionProcessor.Rules;

public interface ITransactionApprovalService
{
    ApprovalDecision Decide(TransactionSubmittedV1 transaction);
}

public sealed class TransactionApprovalService : ITransactionApprovalService
{
    public ApprovalDecision Decide(TransactionSubmittedV1 transaction)
    {
        if (!RegionTimeZoneIds.ByRegion.TryGetValue(transaction.Region, out string? timeZoneId))
        {
            return new ApprovalDecision(
                TransactionStatus.Rejected,
                string.Empty,
                transaction.SubmittedAtUtc.UtcDateTime,
                "Unsupported region");
        }

        TimeZoneInfo timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        DateTimeOffset localSubmittedAt = TimeZoneInfo.ConvertTime(transaction.SubmittedAtUtc, timeZone);
        TimeOnly localTime = TimeOnly.FromDateTime(localSubmittedAt.DateTime);

        bool isApproved = localTime >= BankingHours.OpensAt && localTime < BankingHours.ClosesAt;

        return new ApprovalDecision(
            isApproved ? TransactionStatus.Approved : TransactionStatus.Rejected,
            timeZoneId,
            localSubmittedAt.DateTime,
            isApproved ? "Within banking hours" : "Outside banking hours");
    }
}
