namespace TransactionsManager.Contracts.Messaging;

public static class MessagingTopology
{
    public const string TransactionsSubmittedExchange = "transactions.submitted";
    public const string TransactionsProcessedExchange = "transactions.processed";

    public const string TransactionProcessorSubmittedQueue = "transaction-processor.transactions-submitted";
    public const string GatewayProcessedQueue = "gateway-api.transactions-processed";
    public const string NotificationServiceProcessedQueue = "notification-service.transactions-processed";
}
