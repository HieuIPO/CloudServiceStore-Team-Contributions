using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AllowCatalogSlugReuseAfterSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServicePlans_Slug",
                table: "ServicePlans");

            migrationBuilder.DropIndex(
                name: "IX_ServiceCategories_Slug",
                table: "ServiceCategories");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePlans_Slug",
                table: "ServicePlans",
                column: "Slug",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_Slug",
                table: "ServiceCategories",
                column: "Slug",
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServicePlans_Slug",
                table: "ServicePlans");

            migrationBuilder.DropIndex(
                name: "IX_ServiceCategories_Slug",
                table: "ServiceCategories");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePlans_Slug",
                table: "ServicePlans",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_Slug",
                table: "ServiceCategories",
                column: "Slug",
                unique: true);
        }
    }
}
