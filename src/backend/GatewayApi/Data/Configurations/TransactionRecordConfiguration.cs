using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransactionsManager.Contracts.Transactions;
using TransactionsManager.GatewayApi.Data.Entities;

namespace TransactionsManager.GatewayApi.Data.Configurations;

public sealed class TransactionRecordConfiguration : IEntityTypeConfiguration<TransactionRecord>
{
    public void Configure(EntityTypeBuilder<TransactionRecord> builder)
    {
        builder.ToTable("Transactions");

        builder.HasKey(transaction => transaction.Id);

        builder.Property(transaction => transaction.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(transaction => transaction.Currency)
            .HasMaxLength(3)
            .IsRequired();

        builder.Property(transaction => transaction.MerchantName)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(transaction => transaction.Region)
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(transaction => transaction.TimeZoneId)
            .HasMaxLength(80);

        builder.Property(transaction => transaction.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(TransactionStatus.Pending)
            .IsRequired();

        builder.Property(transaction => transaction.DecisionReason)
            .HasMaxLength(200);

        builder.HasIndex(transaction => transaction.Status);
        builder.HasIndex(transaction => transaction.CreatedAtUtc);
        builder.HasIndex(transaction => transaction.Region);
    }
}
