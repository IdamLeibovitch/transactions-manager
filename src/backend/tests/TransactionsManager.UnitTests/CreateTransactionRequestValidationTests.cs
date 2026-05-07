using System.ComponentModel.DataAnnotations;
using TransactionsManager.Contracts.Api.Transactions;

namespace TransactionsManager.UnitTests;

public sealed class CreateTransactionRequestValidationTests
{
    [Fact]
    public void Validate_WhenRequestIsValid_ReturnsNoErrors()
    {
        var request = new CreateTransactionRequest(
            Amount: 125.50m,
            Currency: "ils",
            MerchantName: "Terminal 42",
            Region: "il",
            SubmittedAt: new DateTimeOffset(2026, 5, 7, 9, 30, 0, TimeSpan.Zero));

        IReadOnlyCollection<ValidationResult> results = Validate(request);

        Assert.Empty(results);
    }

    [Fact]
    public void Validate_WhenRequestHasInvalidFields_ReturnsFieldErrors()
    {
        var request = new CreateTransactionRequest(
            Amount: 0,
            Currency: "US",
            MerchantName: " ",
            Region: "MARS",
            SubmittedAt: new DateTimeOffset(2026, 5, 7, 9, 30, 0, TimeSpan.Zero));

        IReadOnlyCollection<ValidationResult> results = Validate(request);

        Assert.Collection(
            results,
            result => AssertValidationError(result, nameof(CreateTransactionRequest.Amount), "Amount must be greater than zero."),
            result => AssertValidationError(result, nameof(CreateTransactionRequest.Currency), "Currency must be a three-letter ISO code."),
            result => AssertValidationError(result, nameof(CreateTransactionRequest.MerchantName), "Merchant name is required and cannot exceed 120 characters."),
            result => Assert.Contains(nameof(CreateTransactionRequest.Region), result.MemberNames));
    }

    [Fact]
    public void Validate_WhenMerchantNameIsTooLong_ReturnsMerchantNameError()
    {
        var request = new CreateTransactionRequest(
            Amount: 10,
            Currency: "USD",
            MerchantName: new string('A', 121),
            Region: "US_EAST",
            SubmittedAt: new DateTimeOffset(2026, 5, 7, 9, 30, 0, TimeSpan.Zero));

        IReadOnlyCollection<ValidationResult> results = Validate(request);

        ValidationResult result = Assert.Single(results);
        AssertValidationError(result, nameof(CreateTransactionRequest.MerchantName), "Merchant name is required and cannot exceed 120 characters.");
    }

    private static IReadOnlyCollection<ValidationResult> Validate(CreateTransactionRequest request)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(request);

        Validator.TryValidateObject(request, context, results, validateAllProperties: true);

        return results;
    }

    private static void AssertValidationError(
        ValidationResult result,
        string expectedMemberName,
        string expectedMessage)
    {
        Assert.Equal(expectedMessage, result.ErrorMessage);
        Assert.Contains(expectedMemberName, result.MemberNames);
    }
}
