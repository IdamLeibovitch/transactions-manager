using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using TransactionsManager.GatewayApi.Consumers;
using TransactionsManager.GatewayApi.Data;
using TransactionsManager.GatewayApi.Messaging;
using TransactionsManager.GatewayApi.Services;

var builder = WebApplication.CreateBuilder(args);

const string clientCorsPolicy = "client";

builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddScoped<IEventPublisher, RabbitMqEventPublisher>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddHostedService<TransactionProcessedConsumer>();

builder.Services.AddDbContext<GatewayDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer")));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.Configure<ApiBehaviorOptions>(options =>
    options.SuppressModelStateInvalidFilter = true);
builder.Services.AddCors(options =>
{
    options.AddPolicy(clientCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddHealthChecks();

var app = builder.Build();

using (IServiceScope scope = app.Services.CreateScope())
{
    GatewayDbContext dbContext = scope.ServiceProvider.GetRequiredService<GatewayDbContext>();
    dbContext.Database.Migrate();
}

app.UseCors(clientCorsPolicy);

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
