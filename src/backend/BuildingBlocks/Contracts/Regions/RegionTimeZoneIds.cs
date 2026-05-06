namespace TransactionsManager.Contracts.Regions;

public static class RegionTimeZoneIds
{
    public static readonly IReadOnlyDictionary<string, string> ByRegion =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [SupportedRegions.Israel] = "Asia/Jerusalem",
            [SupportedRegions.UsEast] = "America/New_York",
            [SupportedRegions.UnitedKingdom] = "Europe/London",
            [SupportedRegions.EuCentral] = "Europe/Berlin"
        };
}
