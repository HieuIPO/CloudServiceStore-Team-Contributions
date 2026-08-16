using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorEntityFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServicePlanFeatures_ServicePlanId",
                table: "ServicePlanFeatures");

            migrationBuilder.DropColumn(
                name: "SpecificationsJson",
                table: "ServicePlans");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ServicePlanFeatures");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PlanPrices");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "OrderRequestStatusHistories");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "OrderRequests");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "AppUsers");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedAt",
                table: "ServicePlans",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "ServicePlans",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Value",
                table: "ServicePlanFeatures",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "ServicePlanFeatures",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FeatureKey",
                table: "ServicePlanFeatures",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "ServicePlanFeatures",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            // Preserve existing feature labels while moving from the legacy free-form
            // Name field to canonical fields. A deterministic temporary key keeps the
            // new per-plan uniqueness constraint valid for already persisted rows.
            migrationBuilder.Sql("""
                UPDATE [ServicePlanFeatures]
                SET [DisplayName] = [Name],
                    [FeatureKey] = CONCAT(N'LEGACY_', CONVERT(nvarchar(36), [Id]))
                WHERE [FeatureKey] = N'';
                """);

            migrationBuilder.DropColumn(
                name: "Name",
                table: "ServicePlanFeatures");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedAt",
                table: "ServiceCategories",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "ServiceCategories",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServicePlanFeatures_ServicePlanId_FeatureKey",
                table: "ServicePlanFeatures",
                columns: new[] { "ServicePlanId", "FeatureKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServicePlanFeatures_ServicePlanId_FeatureKey",
                table: "ServicePlanFeatures");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "ServicePlans");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ServicePlans");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "ServicePlanFeatures");

            migrationBuilder.DropColumn(
                name: "FeatureKey",
                table: "ServicePlanFeatures");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "ServicePlanFeatures");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ServiceCategories");

            migrationBuilder.AddColumn<string>(
                name: "SpecificationsJson",
                table: "ServicePlans",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Value",
                table: "ServicePlanFeatures",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(160)",
                oldMaxLength: 160);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ServicePlanFeatures",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "ServicePlanFeatures",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Roles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "RefreshTokens",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PlanPrices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "OrderRequestStatusHistories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "OrderRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "AuditLogs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "AppUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_ServicePlanFeatures_ServicePlanId",
                table: "ServicePlanFeatures",
                column: "ServicePlanId");
        }
    }
}
