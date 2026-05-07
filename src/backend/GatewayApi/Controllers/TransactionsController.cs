using Microsoft.AspNetCore.Mvc;
using TransactionsManager.Contracts.Api.Transactions;
using TransactionsManager.Contracts.Transactions;
using TransactionsManager.GatewayApi.Filters;
using TransactionsManager.GatewayApi.Services;

namespace TransactionsManager.GatewayApi.Controllers;

[ApiController]
[ValidateModel]
[Route("api/transactions")]
public sealed class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateTransactionResponse>> Create(
        CreateTransactionRequest request,
        CancellationToken cancellationToken)
    {
        return Accepted(await transactionService.CreateAsync(request, cancellationToken));
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
