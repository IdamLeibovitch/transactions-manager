using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TransactionsManager.Contracts.Api.Auth;
using TransactionsManager.GatewayApi.Auth;
using TransactionsManager.GatewayApi.Filters;

namespace TransactionsManager.GatewayApi.Controllers;

[ApiController]
[AllowAnonymous]
[ValidateModel]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<LoginResponse> Login(LoginRequest request)
    {
        LoginResponse? response = authService.Login(request);

        return response is null ? Unauthorized() : Ok(response);
    }
}
