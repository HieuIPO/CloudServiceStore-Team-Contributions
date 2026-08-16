using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicBannerSelection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShowOnPublicBanner",
                table: "Promotions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_ShowOnPublicBanner_IsActive",
                table: "Promotions",
                columns: new[] { "ShowOnPublicBanner", "IsActive" });

            migrationBuilder.Sql("""
                UPDATE selected
                SET selected.ShowOnPublicBanner = 1
                FROM Promotions AS selected
                WHERE selected.Id = (
                    SELECT TOP (1) candidate.Id
                    FROM Promotions AS candidate
                    WHERE candidate.IsDeleted = 0
                      AND candidate.IsActive = 1
                      AND candidate.StartsAt <= SYSDATETIMEOFFSET()
                      AND candidate.EndsAt > SYSDATETIMEOFFSET()
                    ORDER BY CASE WHEN candidate.DiscountType = 1 THEN candidate.DiscountValue ELSE 0 END DESC,
                             candidate.EndsAt ASC,
                             candidate.Id ASC
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Promotions_ShowOnPublicBanner_IsActive",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "ShowOnPublicBanner",
                table: "Promotions");
        }
    }
}
