using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AppUserId",
                table: "OrderRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderRequests_AppUserId_CreatedAt",
                table: "OrderRequests",
                columns: new[] { "AppUserId", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_OrderRequests_AppUsers_AppUserId",
                table: "OrderRequests",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderRequests_AppUsers_AppUserId",
                table: "OrderRequests");

            migrationBuilder.DropIndex(
                name: "IX_OrderRequests_AppUserId_CreatedAt",
                table: "OrderRequests");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "OrderRequests");
        }
    }
}
