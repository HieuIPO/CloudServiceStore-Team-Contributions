using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPromotionBillingCycleScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BillingCycle",
                table: "Promotions",
                type: "int",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Promotions_BillingCycle_Valid",
                table: "Promotions",
                sql: "[BillingCycle] IS NULL OR [BillingCycle] IN (1, 12)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Promotions_BillingCycle_Valid",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "BillingCycle",
                table: "Promotions");
        }
    }
}
