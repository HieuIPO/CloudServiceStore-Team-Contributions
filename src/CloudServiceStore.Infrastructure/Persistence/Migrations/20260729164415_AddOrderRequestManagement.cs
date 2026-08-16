using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderRequestManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrderRequestStatusHistories_OrderRequestId",
                table: "OrderRequestStatusHistories");

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "OrderRequestStatusHistories",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PromotionCodeSnapshot",
                table: "OrderRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlanNameSnapshot",
                table: "OrderRequests",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "OrderRequests",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CompanyName",
                table: "OrderRequests",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "OrderRequests",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "VND");

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalAmount",
                table: "OrderRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_OrderRequestStatusHistories_OrderRequestId_CreatedAt",
                table: "OrderRequestStatusHistories",
                columns: new[] { "OrderRequestId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderRequests_Email_CreatedAt",
                table: "OrderRequests",
                columns: new[] { "Email", "CreatedAt" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrderRequests_OriginalAmount_NonNegative",
                table: "OrderRequests",
                sql: "[OriginalAmount] >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrderRequests_QuotedAmount_NonNegative",
                table: "OrderRequests",
                sql: "[QuotedAmount] >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrderRequestStatusHistories_OrderRequestId_CreatedAt",
                table: "OrderRequestStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_OrderRequests_Email_CreatedAt",
                table: "OrderRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrderRequests_OriginalAmount_NonNegative",
                table: "OrderRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrderRequests_QuotedAmount_NonNegative",
                table: "OrderRequests");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "OrderRequests");

            migrationBuilder.DropColumn(
                name: "OriginalAmount",
                table: "OrderRequests");

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "OrderRequestStatusHistories",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PromotionCodeSnapshot",
                table: "OrderRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlanNameSnapshot",
                table: "OrderRequests",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(160)",
                oldMaxLength: 160);

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "OrderRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CompanyName",
                table: "OrderRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(160)",
                oldMaxLength: 160,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderRequestStatusHistories_OrderRequestId",
                table: "OrderRequestStatusHistories",
                column: "OrderRequestId");
        }
    }
}
