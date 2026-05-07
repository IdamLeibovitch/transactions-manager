using TransactionsManager.NotificationService.Consumers;
using TransactionsManager.NotificationService.Hubs;
using TransactionsManager.NotificationService.Messaging;

var builder = WebApplication.CreateBuilder(args);

const string clientCorsPolicy = "client";

builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddSignalR();
builder.Services.AddHostedService<TransactionProcessedNotificationConsumer>();
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

app.MapGet("/", () => Results.Ok(new
{
    Service = "notification-service",
    Status = "ready"
}));

app.MapHub<TransactionsHub>("/ws/transactions");
app.MapHealthChecks("/health");

app.Run();
