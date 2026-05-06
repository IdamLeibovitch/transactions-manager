namespace TransactionsManager.Contracts.Time;

public static class BankingHours
{
    public static readonly TimeOnly OpensAt = new(8, 0);
    public static readonly TimeOnly ClosesAt = new(18, 0);
}
