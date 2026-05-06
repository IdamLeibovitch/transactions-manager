using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransactionsManager.Contracts.Api.Transactions;
using TransactionsManager.Contracts.Events;
using TransactionsManager.Contracts.Regions;
using TransactionsManager.Contracts.Transactions;
using TransactionsManager.GatewayApi.Data;
using TransactionsManager.GatewayApi.Data.Entities;
using TransactionsManager.GatewayApi.Messaging;

namespace TransactionsManager.GatewayApi.Controllers;

[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController(
    GatewayDbContext dbContext,
    IEventPublisher eventPublisher) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateTransactionResponse>> Create(
        CreateTransactionRequest request,
        CancellationToken cancellationToken)
    {
        Dictionary<string, string[]>? validationErrors = Validate(request);

        if (validationErrors is not null)
        {
            return ValidationProblem(new ValidationProblemDetails(validationErrors));
        }

        DateTimeOffset now = DateTimeOffset.UtcNow;
        string region = NormalizeRegion(request.Region);

        var transaction = new TransactionRecord
        {
            Id = Guid.NewGuid(),
            Amount = request.Amount,
            Currency = NormalizeCurrency(request.Currency),
            MerchantName = NormalizeMerchantName(request.MerchantName),
            Region = region,
            SubmittedAtUtc = request.SubmittedAt.ToUniversalTime(),
            Status = TransactionStatus.Pending,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            CorrelationId = Guid.NewGuid()
        };

        dbContext.Transactions.Add(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        var transactionSubmitted = new TransactionSubmittedV1(
            EventId: Guid.NewGuid(),
            OccurredAtUtc: DateTimeOffset.UtcNow,
            TransactionId: transaction.Id,
            Amount: transaction.Amount,
            Currency: transaction.Currency,
            MerchantName: transaction.MerchantName,
            Region: transaction.Region,
            SubmittedAtUtc: transaction.SubmittedAtUtc,
            CorrelationId: transaction.CorrelationId);

        await eventPublisher.PublishTransactionSubmittedAsync(
            transactionSubmitted,
            transactionSubmitted.EventId,
            transactionSubmitted.CorrelationId,
            cancellationToken);

        return Accepted(new CreateTransactionResponse(transaction.Id, transaction.Status));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<TransactionDto>>> List(
        [FromQuery] TransactionStatus? status,
        CancellationToken cancellationToken)
    {
        IQueryable<TransactionRecord> query = dbContext.Transactions
            .AsNoTracking()
            .OrderByDescending(transaction => transaction.CreatedAtUtc);

        if (status is not null)
        {
            query = query.Where(transaction => transaction.Status == status);
        }

        TransactionDto[] transactions = await query
            .Select(transaction => ToDto(transaction))
            .ToArrayAsync(cancellationToken);

        return Ok(transactions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TransactionDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        TransactionDto? transaction = await dbContext.Transactions
            .AsNoTracking()
            .Where(transaction => transaction.Id == id)
            .Select(transaction => ToDto(transaction))
            .SingleOrDefaultAsync(cancellationToken);

        return transaction is null ? NotFound() : Ok(transaction);
    }

    private static TransactionDto ToDto(TransactionRecord transaction)
    {
        return new TransactionDto(
            transaction.Id,
            transaction.Amount,
            transaction.Currency,
            transaction.MerchantName,
            transaction.Region,
            transaction.SubmittedAtUtc,
            transaction.LocalSubmittedAt,
            transaction.Status,
            transaction.DecisionReason,
            transaction.CreatedAtUtc,
            transaction.ProcessedAtUtc);
    }

    private static Dictionary<string, string[]>? Validate(CreateTransactionRequest request)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        if (request.Amount <= 0)
        {
            errors[nameof(request.Amount)] = ["Amount must be greater than zero."];
        }

        string currency = NormalizeCurrency(request.Currency);
        if (currency.Length != 3)
        {
            errors[nameof(request.Currency)] = ["Currency must be a three-letter ISO code."];
        }

        string merchantName = NormalizeMerchantName(request.MerchantName);
        if (merchantName.Length == 0 || merchantName.Length > 120)
        {
            errors[nameof(request.MerchantName)] = ["Merchant name is required and cannot exceed 120 characters."];
        }

        string region = NormalizeRegion(request.Region);
        if (!SupportedRegions.All.Contains(region, StringComparer.OrdinalIgnoreCase))
        {
            errors[nameof(request.Region)] = [$"Region must be one of: {string.Join(", ", SupportedRegions.All)}."];
        }

        return errors.Count == 0 ? null : errors;
    }

    private static string NormalizeRegion(string region)
    {
        return (region ?? string.Empty).Trim().ToUpperInvariant();
    }

    private static string NormalizeCurrency(string currency)
    {
        return (currency ?? string.Empty).Trim().ToUpperInvariant();
    }

    private static string NormalizeMerchantName(string merchantName)
    {
        return (merchantName ?? string.Empty).Trim();
    }
}
