namespace TransactionsManager.Contracts.Api.Auth;

public sealed record LoginRequest(
    string Username,
    string Password);
