using Microsoft.AspNetCore.Mvc;
using TransactionsManager.Contracts.Api.Transactions;
using TransactionsManager.Contracts.Transactions;
using TransactionsManager.GatewayApi.Services;

namespace TransactionsManager.GatewayApi.Controllers;

[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateTransactionResponse>> Create(
        CreateTransactionRequest request,
        CancellationToken cancellationToken)
    {
        CreateTransactionResult result = await transactionService.CreateAsync(request, cancellationToken);

        if (!result.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(result.ValidationErrors!));
        }

        return Accepted(result.Response);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<TransactionDto>>> List(
        [FromQuery] TransactionStatus? status,
        CancellationToken cancellationToken)
    {
        return Ok(await transactionService.ListAsync(status, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TransactionDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        TransactionDto? transaction = await transactionService.GetByIdAsync(id, cancellationToken);

        return transaction is null ? NotFound() : Ok(transaction);
    }
}
