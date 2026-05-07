using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TransactionsManager.Contracts.Api.Auth;
using TransactionsManager.Contracts.Auth;

namespace TransactionsManager.GatewayApi.Auth;

public interface IAuthService
{
    LoginResponse? Login(LoginRequest request);
}

public sealed class AuthService(
    IOptions<JwtOptions> jwtOptions,
    IOptions<DevelopmentUserOptions> developmentUserOptions) : IAuthService
{
    private readonly JwtOptions jwtOptions = jwtOptions.Value;
    private readonly DevelopmentUserOptions developmentUserOptions = developmentUserOptions.Value;

    public LoginResponse? Login(LoginRequest request)
    {
        if (!IsValidUser(request))
        {
            return null;
        }

        DateTimeOffset expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(jwtOptions.ExpirationMinutes);
        var credentials = new SigningCredentials(
            JwtConfiguration.CreateSigningKey(jwtOptions),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, request.Username),
                new Claim(ClaimTypes.Name, request.Username)
            ],
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        string accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        return new LoginResponse(accessToken, expiresAtUtc);
    }

    private bool IsValidUser(LoginRequest request)
    {
        return string.Equals(
                request.Username,
                developmentUserOptions.Username,
                StringComparison.Ordinal) &&
            string.Equals(
                request.Password,
                developmentUserOptions.Password,
                StringComparison.Ordinal);
    }
}
