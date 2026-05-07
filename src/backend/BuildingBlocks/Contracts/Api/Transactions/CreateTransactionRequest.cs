using System.ComponentModel.DataAnnotations;
using TransactionsManager.Contracts.Regions;

namespace TransactionsManager.Contracts.Api.Transactions;

public sealed record CreateTransactionRequest(
    decimal Amount,
    string Currency,
    string MerchantName,
    string Region,
    DateTimeOffset SubmittedAt) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Amount <= 0)
        {
            yield return new ValidationResult(
                "Amount must be greater than zero.",
                [nameof(Amount)]);
        }

        string currency = Normalize(Currency).ToUpperInvariant();
        if (currency.Length != 3)
        {
            yield return new ValidationResult(
                "Currency must be a three-letter ISO code.",
                [nameof(Currency)]);
        }

        string merchantName = Normalize(MerchantName);
        if (merchantName.Length == 0 || merchantName.Length > 120)
        {
            yield return new ValidationResult(
                "Merchant name is required and cannot exceed 120 characters.",
                [nameof(MerchantName)]);
        }

        string region = Normalize(Region).ToUpperInvariant();
        if (!SupportedRegions.All.Contains(region, StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Region must be one of: {string.Join(", ", SupportedRegions.All)}.",
                [nameof(Region)]);
        }
    }

    private static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim();
    }
}
