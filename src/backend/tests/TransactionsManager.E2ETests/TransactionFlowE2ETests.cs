using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using TransactionsManager.Contracts.Api.Notifications;
using TransactionsManager.Contracts.Api.Transactions;
using TransactionsManager.Contracts.Messaging;
using TransactionsManager.Contracts.Transactions;

namespace TransactionsManager.E2ETests;

[CollectionDefinition(nameof(E2ETestCollection), DisableParallelization = true)]
public sealed class E2ETestCollection
{
}

[Collection(nameof(E2ETestCollection))]
public sealed class TransactionFlowE2ETests : IAsyncLifetime
{
    private static readonly string BackendDirectory = Path.GetFullPath("../../../../../", AppContext.BaseDirectory);
    private const string GatewayHealthUrl = "http://localhost:5080/health";
    private const string NotificationHealthUrl = "http://localhost:5081/health";
    private const string NotificationHubUrl = "http://localhost:5081/ws/transactions";
    private const string SqlConnectionString = "Server=localhost,1433;Database=TransactionsManager;User Id=sa;Password=Change_this_password_123!;TrustServerCertificate=True";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient gatewayClient = new()
    {
        BaseAddress = new Uri("http://localhost:5080")
    };

    private readonly HttpClient rabbitManagementClient = new()
    {
        BaseAddress = new Uri("http://localhost:15673")
    };

    private readonly ConcurrentBag<TransactionStatusChangedMessage> signalRUpdates = [];
    private readonly List<ServiceProcess> serviceProcesses = [];
    private HubConnection? hubConnection;

    public async Task InitializeAsync()
    {
        EnsurePortIsAvailable(5080);
        EnsurePortIsAvailable(5081);

        rabbitManagementClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes("guest:guest")));

        await EnsureSqlServerIsAvailableAsync();
        await EnsureRabbitMqIsAvailableAsync();
        await PurgeRabbitMqQueuesAsync();

        serviceProcesses.Add(ServiceProcess.Start(
            name: "gateway-api",
            arguments: "run --project GatewayApi/TransactionsManager.GatewayApi.csproj",
            backendDirectory: BackendDirectory,
            aspNetCoreUrls: "http://localhost:5080"));

        serviceProcesses.Add(ServiceProcess.Start(
            name: "transaction-processor",
            arguments: "run --project TransactionProcessor/TransactionsManager.TransactionProcessor.csproj",
            backendDirectory: BackendDirectory,
            aspNetCoreUrls: null));

        serviceProcesses.Add(ServiceProcess.Start(
            name: "notification-service",
            arguments: "run --project NotificationService/TransactionsManager.NotificationService.csproj",
            backendDirectory: BackendDirectory,
            aspNetCoreUrls: "http://localhost:5081"));

        await WaitForHttpOkAsync(GatewayHealthUrl);
        await WaitForHttpOkAsync(NotificationHealthUrl);
        await WaitForRabbitMqQueueAsync(MessagingTopology.TransactionProcessorSubmittedQueue);
        await WaitForRabbitMqQueueAsync(MessagingTopology.GatewayProcessedQueue);
        await WaitForRabbitMqQueueAsync(MessagingTopology.NotificationServiceProcessedQueue);
        await DeleteE2ETransactionsAsync();
        await PurgeRabbitMqQueuesAsync();

        hubConnection = new HubConnectionBuilder()
            .WithUrl(NotificationHubUrl)
            .WithAutomaticReconnect()
            .AddJsonProtocol(options =>
                options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
            .Build();

        hubConnection.On<TransactionStatusChangedMessage>("transactionStatusChanged", signalRUpdates.Add);
        await hubConnection.StartAsync();
    }

    public async Task DisposeAsync()
    {
        if (hubConnection is not null)
        {
            await hubConnection.DisposeAsync();
        }

        foreach (ServiceProcess serviceProcess in serviceProcesses)
        {
            serviceProcess.Dispose();
        }

        await DeleteE2ETransactionsAsync();
        await PurgeRabbitMqQueuesAsync();

        gatewayClient.Dispose();
        rabbitManagementClient.Dispose();
    }

    [Fact]
    public async Task SubmitTransactions_ProcessesApprovalStatus_PersistsAndNotifiesClients()
    {
        CreateTransactionResponse approvedResponse = await SubmitTransactionAsync(
            merchantName: "E2E Approved Merchant",
            region: "IL",
            submittedAt: new DateTimeOffset(2026, 5, 7, 9, 30, 0, TimeSpan.Zero));

        CreateTransactionResponse rejectedResponse = await SubmitTransactionAsync(
            merchantName: "E2E Rejected Merchant",
            region: "IL",
            submittedAt: new DateTimeOffset(2026, 5, 7, 2, 0, 0, TimeSpan.Zero));

        Assert.Equal(TransactionStatus.Pending, approvedResponse.Status);
        Assert.Equal(TransactionStatus.Pending, rejectedResponse.Status);

        TransactionDto approvedTransaction = await WaitForTransactionStatusAsync(
            approvedResponse.TransactionId,
            TransactionStatus.Approved);

        TransactionDto rejectedTransaction = await WaitForTransactionStatusAsync(
            rejectedResponse.TransactionId,
            TransactionStatus.Rejected);

        Assert.Equal("Within banking hours", approvedTransaction.DecisionReason);
        Assert.Equal(new TimeOnly(12, 30), TimeOnly.FromDateTime(AssertNotNull(approvedTransaction.LocalSubmittedAt)));
        Assert.Equal("Outside banking hours", rejectedTransaction.DecisionReason);
        Assert.Equal(new TimeOnly(5, 0), TimeOnly.FromDateTime(AssertNotNull(rejectedTransaction.LocalSubmittedAt)));

        TransactionDto[] approvedTransactions = await gatewayClient.GetFromJsonAsync<TransactionDto[]>(
            "/api/transactions?status=Approved",
            JsonOptions) ?? [];

        Assert.Contains(approvedTransactions, transaction => transaction.Id == approvedResponse.TransactionId);
        Assert.DoesNotContain(approvedTransactions, transaction => transaction.Id == rejectedResponse.TransactionId);

        await WaitForSignalRUpdateAsync(approvedResponse.TransactionId, TransactionStatus.Approved);
        await WaitForSignalRUpdateAsync(rejectedResponse.TransactionId, TransactionStatus.Rejected);

        DbTransaction approvedRow = await ReadTransactionFromDatabaseAsync(approvedResponse.TransactionId);
        DbTransaction rejectedRow = await ReadTransactionFromDatabaseAsync(rejectedResponse.TransactionId);

        Assert.Equal(TransactionStatus.Approved, approvedRow.Status);
        Assert.Equal("Asia/Jerusalem", approvedRow.TimeZoneId);
        Assert.Equal("Within banking hours", approvedRow.DecisionReason);
        Assert.Equal(new TimeOnly(12, 30), TimeOnly.FromDateTime(AssertNotNull(approvedRow.LocalSubmittedAt)));

        Assert.Equal(TransactionStatus.Rejected, rejectedRow.Status);
        Assert.Equal("Asia/Jerusalem", rejectedRow.TimeZoneId);
        Assert.Equal("Outside banking hours", rejectedRow.DecisionReason);
        Assert.Equal(new TimeOnly(5, 0), TimeOnly.FromDateTime(AssertNotNull(rejectedRow.LocalSubmittedAt)));

        await WaitForRabbitMqQueuesToDrainAsync();
    }

    private async Task<CreateTransactionResponse> SubmitTransactionAsync(
        string merchantName,
        string region,
        DateTimeOffset submittedAt)
    {
        var request = new CreateTransactionRequest(
            Amount: 99.90m,
            Currency: "ILS",
            MerchantName: merchantName,
            Region: region,
            SubmittedAt: submittedAt);

        using HttpResponseMessage response = await gatewayClient.PostAsJsonAsync(
            "/api/transactions",
            request,
            JsonOptions);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<CreateTransactionResponse>(JsonOptions)
            ?? throw new InvalidOperationException("Gateway returned an empty create transaction response.");
    }

    private async Task<TransactionDto> WaitForTransactionStatusAsync(Guid transactionId, TransactionStatus expectedStatus)
    {
        return await EventuallyAsync(async () =>
        {
            TransactionDto? transaction = await gatewayClient.GetFromJsonAsync<TransactionDto>(
                $"/api/transactions/{transactionId}",
                JsonOptions);

            return transaction?.Status == expectedStatus ? transaction : null;
        }, $"transaction {transactionId} to become {expectedStatus}");
    }

    private async Task WaitForSignalRUpdateAsync(Guid transactionId, TransactionStatus expectedStatus)
    {
        await EventuallyAsync(() =>
        {
            TransactionStatusChangedMessage? message = signalRUpdates.FirstOrDefault(update =>
                update.TransactionId == transactionId &&
                update.Status == expectedStatus &&
                update.ProcessedAtUtc is not null);

            return Task.FromResult(message);
        }, $"SignalR update for transaction {transactionId} with status {expectedStatus}");
    }

    private async Task<DbTransaction> ReadTransactionFromDatabaseAsync(Guid transactionId)
    {
        await using var connection = new SqlConnection(SqlConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Status, TimeZoneId, LocalSubmittedAt, DecisionReason
            FROM dbo.Transactions
            WHERE Id = @Id
            """;
        command.Parameters.AddWithValue("@Id", transactionId);

        await using SqlDataReader reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            throw new InvalidOperationException($"Transaction {transactionId} was not found in SQL Server.");
        }

        return new DbTransaction(
            Status: Enum.Parse<TransactionStatus>(reader.GetString(0)),
            TimeZoneId: reader.IsDBNull(1) ? null : reader.GetString(1),
            LocalSubmittedAt: reader.IsDBNull(2) ? null : reader.GetDateTime(2),
            DecisionReason: reader.IsDBNull(3) ? null : reader.GetString(3));
    }

    private static DateTime AssertNotNull(DateTime? value)
    {
        Assert.True(value.HasValue);
        return value.Value;
    }

    private async Task DeleteE2ETransactionsAsync()
    {
        await using var connection = new SqlConnection(SqlConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM dbo.Transactions WHERE MerchantName LIKE 'E2E %'";

        try
        {
            await command.ExecuteNonQueryAsync();
        }
        catch (SqlException exception) when (exception.Number == 208)
        {
            // The gateway creates the table through migrations during startup.
        }
    }

    private async Task PurgeRabbitMqQueuesAsync()
    {
        string[] queueNames =
        [
            MessagingTopology.TransactionProcessorSubmittedQueue,
            MessagingTopology.GatewayProcessedQueue,
            MessagingTopology.NotificationServiceProcessedQueue
        ];

        foreach (string queueName in queueNames)
        {
            using HttpResponseMessage response = await rabbitManagementClient.DeleteAsync(
                $"/api/queues/%2F/{Uri.EscapeDataString(queueName)}/contents");

            if (response.StatusCode is not HttpStatusCode.NotFound)
            {
                response.EnsureSuccessStatusCode();
            }
        }
    }

    private async Task WaitForRabbitMqQueuesToDrainAsync()
    {
        string[] queueNames =
        [
            MessagingTopology.TransactionProcessorSubmittedQueue,
            MessagingTopology.GatewayProcessedQueue,
            MessagingTopology.NotificationServiceProcessedQueue
        ];

        foreach (string queueName in queueNames)
        {
            await EventuallyTrueAsync(async () =>
            {
                using JsonDocument queue = await ReadRabbitMqQueueAsync(queueName);
                int readyMessages = queue.RootElement.GetProperty("messages_ready").GetInt32();
                int unacknowledgedMessages = queue.RootElement.GetProperty("messages_unacknowledged").GetInt32();

                return readyMessages == 0 && unacknowledgedMessages == 0;
            }, $"RabbitMQ queue {queueName} to drain");
        }
    }

    private async Task WaitForRabbitMqQueueAsync(string queueName)
    {
        await EventuallyTrueAsync(async () =>
        {
            try
            {
                using JsonDocument queue = await ReadRabbitMqQueueAsync(queueName);
                return queue.RootElement.GetProperty("name").GetString() == queueName;
            }
            catch (HttpRequestException)
            {
                return false;
            }
        }, $"RabbitMQ queue {queueName} to be declared");
    }

    private async Task<JsonDocument> ReadRabbitMqQueueAsync(string queueName)
    {
        using HttpResponseMessage response = await rabbitManagementClient.GetAsync(
            $"/api/queues/%2F/{Uri.EscapeDataString(queueName)}");

        response.EnsureSuccessStatusCode();

        await using Stream stream = await response.Content.ReadAsStreamAsync();
        return await JsonDocument.ParseAsync(stream);
    }

    private static async Task EnsureSqlServerIsAvailableAsync()
    {
        await EventuallyTrueAsync(async () =>
        {
            try
            {
                await using var connection = new SqlConnection(SqlConnectionString);
                await connection.OpenAsync();
                return true;
            }
            catch (SqlException)
            {
                return false;
            }
        }, "SQL Server to accept connections");
    }

    private async Task EnsureRabbitMqIsAvailableAsync()
    {
        await EventuallyTrueAsync(async () =>
        {
            try
            {
                using HttpResponseMessage response = await rabbitManagementClient.GetAsync("/api/overview");
                return response.IsSuccessStatusCode;
            }
            catch (HttpRequestException)
            {
                return false;
            }
        }, "RabbitMQ management API to respond");
    }

    private static async Task WaitForHttpOkAsync(string url)
    {
        using var client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(2)
        };

        await EventuallyTrueAsync(async () =>
        {
            try
            {
                using HttpResponseMessage response = await client.GetAsync(url);
                return response.IsSuccessStatusCode;
            }
            catch (HttpRequestException)
            {
                return false;
            }
            catch (TaskCanceledException)
            {
                return false;
            }
        }, $"{url} to become healthy", timeoutSeconds: 90);
    }

    private static async Task EventuallyTrueAsync(
        Func<Task<bool>> conditionIsMet,
        string condition,
        int timeoutSeconds = 45)
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow.AddSeconds(timeoutSeconds);

        while (DateTimeOffset.UtcNow < deadline)
        {
            if (await conditionIsMet())
            {
                return;
            }

            await Task.Delay(TimeSpan.FromMilliseconds(250));
        }

        throw new TimeoutException($"Timed out waiting for {condition}.");
    }

    private static async Task<T> EventuallyAsync<T>(
        Func<Task<T?>> action,
        string condition,
        int timeoutSeconds = 45)
        where T : struct
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow.AddSeconds(timeoutSeconds);

        while (DateTimeOffset.UtcNow < deadline)
        {
            T? result = await action();
            if (result.HasValue)
            {
                return result.Value;
            }

            await Task.Delay(TimeSpan.FromMilliseconds(250));
        }

        throw new TimeoutException($"Timed out waiting for {condition}.");
    }

    private static async Task<T> EventuallyAsync<T>(
        Func<Task<T?>> action,
        string condition,
        int timeoutSeconds = 45)
        where T : class
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow.AddSeconds(timeoutSeconds);

        while (DateTimeOffset.UtcNow < deadline)
        {
            T? result = await action();
            if (result is not null)
            {
                return result;
            }

            await Task.Delay(TimeSpan.FromMilliseconds(250));
        }

        throw new TimeoutException($"Timed out waiting for {condition}.");
    }

    private static void EnsurePortIsAvailable(int port)
    {
        try
        {
            using var listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();
        }
        catch (SocketException exception)
        {
            throw new InvalidOperationException(
                $"Port {port} is already in use. Stop the local backend services before running the E2E tests.",
                exception);
        }
    }

    private sealed record DbTransaction(
        TransactionStatus Status,
        string? TimeZoneId,
        DateTime? LocalSubmittedAt,
        string? DecisionReason);

    private sealed class ServiceProcess : IDisposable
    {
        private readonly Process process;
        private readonly StringBuilder output = new();

        private ServiceProcess(Process process)
        {
            this.process = process;
        }

        public static ServiceProcess Start(
            string name,
            string arguments,
            string backendDirectory,
            string? aspNetCoreUrls)
        {
            var startInfo = new ProcessStartInfo("dotnet", arguments)
            {
                WorkingDirectory = Path.GetFullPath(backendDirectory),
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            startInfo.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
            startInfo.Environment["DOTNET_ENVIRONMENT"] = "Development";
            startInfo.Environment["ConnectionStrings__SqlServer"] = SqlConnectionString;
            startInfo.Environment["RabbitMq__Host"] = "localhost";
            startInfo.Environment["RabbitMq__Port"] = "5673";
            startInfo.Environment["RabbitMq__Username"] = "guest";
            startInfo.Environment["RabbitMq__Password"] = "guest";

            if (aspNetCoreUrls is not null)
            {
                startInfo.Environment["ASPNETCORE_URLS"] = aspNetCoreUrls;
            }

            var process = new Process
            {
                StartInfo = startInfo,
                EnableRaisingEvents = true
            };

            var serviceProcess = new ServiceProcess(process);

            process.OutputDataReceived += (_, args) => serviceProcess.AppendOutput(name, args.Data);
            process.ErrorDataReceived += (_, args) => serviceProcess.AppendOutput(name, args.Data);

            if (!process.Start())
            {
                throw new InvalidOperationException($"Failed to start {name}.");
            }

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            return serviceProcess;
        }

        public void Dispose()
        {
            if (process.HasExited)
            {
                process.Dispose();
                return;
            }

            try
            {
                process.Kill(entireProcessTree: true);
                process.WaitForExit(5000);
            }
            finally
            {
                process.Dispose();
            }
        }

        private void AppendOutput(string serviceName, string? line)
        {
            if (line is null)
            {
                return;
            }

            lock (output)
            {
                output.Append('[');
                output.Append(serviceName);
                output.Append("] ");
                output.AppendLine(line);
            }
        }
    }
}
