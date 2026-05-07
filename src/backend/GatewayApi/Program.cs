using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using TransactionsManager.GatewayApi.Data;
using TransactionsManager.GatewayApi.Messaging;
using TransactionsManager.GatewayApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddScoped<IEventPublisher, RabbitMqEventPublisher>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

builder.Services.AddDbContext<GatewayDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer")));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHealthChecks();

var app = builder.Build();

using (IServiceScope scope = app.Services.CreateScope())
{
    GatewayDbContext dbContext = scope.ServiceProvider.GetRequiredService<GatewayDbContext>();
    dbContext.Database.Migrate();
}

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
