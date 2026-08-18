using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixServicePlanFeatureAndNamespace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ServicePlanFeatures",
                table: "ServicePlanFeatures");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ServicePlanFeatures",
                table: "ServicePlanFeatures",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePlanFeatures_ServicePlanId_FeatureKey",
                table: "ServicePlanFeatures",
                columns: new[] { "ServicePlanId", "FeatureKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ServicePlanFeatures",
                table: "ServicePlanFeatures");

            migrationBuilder.DropIndex(
                name: "IX_ServicePlanFeatures_ServicePlanId_FeatureKey",
                table: "ServicePlanFeatures");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ServicePlanFeatures",
                table: "ServicePlanFeatures",
                columns: new[] { "ServicePlanId", "FeatureKey" });
        }
    }
}
