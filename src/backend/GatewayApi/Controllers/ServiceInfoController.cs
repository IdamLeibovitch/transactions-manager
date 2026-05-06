using Microsoft.AspNetCore.Mvc;

namespace TransactionsManager.GatewayApi.Controllers;

[ApiController]
[Route("api/service-info")]
public sealed class ServiceInfoController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Service = "gateway-api",
            Status = "ready"
        });
    }
}
