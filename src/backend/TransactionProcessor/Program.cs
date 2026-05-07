using TransactionsManager.TransactionProcessor;
using TransactionsManager.TransactionProcessor.Messaging;
using TransactionsManager.TransactionProcessor.Rules;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddSingleton<ITransactionApprovalService, TransactionApprovalService>();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
