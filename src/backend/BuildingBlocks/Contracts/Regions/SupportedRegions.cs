namespace TransactionsManager.Contracts.Regions;

public static class SupportedRegions
{
    public const string Israel = "IL";
    public const string UsEast = "US_EAST";
    public const string UnitedKingdom = "UK";
    public const string EuCentral = "EU_CENTRAL";

    public static readonly IReadOnlyCollection<string> All =
    [
        Israel,
        UsEast,
        UnitedKingdom,
        EuCentral
    ];
}
