using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text.Json.Serialization;
using TransactionsManager.Contracts.Auth;
using TransactionsManager.NotificationService.Consumers;
using TransactionsManager.NotificationService.Hubs;
using TransactionsManager.NotificationService.Messaging;

var builder = WebApplication.CreateBuilder(args);

const string clientCorsPolicy = "client";

JwtOptions jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration is required.");

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHostedService<TransactionProcessedNotificationConsumer>();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = JwtConfiguration.CreateTokenValidationParameters(jwtOptions);
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                ILogger logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");
                logger.LogWarning(context.Exception, "JWT authentication failed.");

                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                string? accessToken = context.Request.Query["access_token"];
                string? authorizationHeader = context.Request.Headers.Authorization;
                PathString requestPath = context.HttpContext.Request.Path;

                if (requestPath.StartsWithSegments("/ws/transactions"))
                {
                    if (!string.IsNullOrWhiteSpace(accessToken))
                    {
                        context.Token = accessToken;
                    }
                    else if (authorizationHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        context.Token = authorizationHeader["Bearer ".Length..].Trim();
                    }
                }

                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy(clientCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseCors(clientCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    Service = "notification-service",
    Status = "ready"
}));

app.MapHub<TransactionsHub>("/ws/transactions")
    .RequireAuthorization();
app.MapHealthChecks("/health");

app.Run();
