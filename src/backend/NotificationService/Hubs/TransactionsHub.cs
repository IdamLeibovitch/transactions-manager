using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TransactionsManager.NotificationService.Hubs;

[Authorize]
public sealed class TransactionsHub : Hub;
