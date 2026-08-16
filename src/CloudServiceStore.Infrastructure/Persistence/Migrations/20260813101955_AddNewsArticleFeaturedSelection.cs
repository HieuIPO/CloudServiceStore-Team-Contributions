using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsArticleFeaturedSelection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "NewsArticles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_NewsArticles_IsFeatured",
                table: "NewsArticles",
                column: "IsFeatured",
                unique: true,
                filter: "[IsDeleted] = 0 AND [IsFeatured] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NewsArticles_IsFeatured",
                table: "NewsArticles");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "NewsArticles");
        }
    }
}
