using Microsoft.EntityFrameworkCore;
using TransactionsManager.GatewayApi.Data.Entities;

namespace TransactionsManager.GatewayApi.Data;

public sealed class GatewayDbContext(DbContextOptions<GatewayDbContext> options) : DbContext(options)
{
    public DbSet<TransactionRecord> Transactions => Set<TransactionRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GatewayDbContext).Assembly);
    }
}
