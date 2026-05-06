var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
    Service = "notification-service",
    Status = "ready"
}));

app.MapHealthChecks("/health");

app.Run();
