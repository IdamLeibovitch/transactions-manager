namespace TransactionsManager.Contracts.Api.Auth;

public sealed record LoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAtUtc);
