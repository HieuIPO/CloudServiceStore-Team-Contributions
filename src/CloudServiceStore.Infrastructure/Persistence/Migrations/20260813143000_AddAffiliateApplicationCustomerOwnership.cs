using System;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudServiceStore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(CloudServiceStoreDbContext))]
    [Migration("20260813143000_AddAffiliateApplicationCustomerOwnership")]
    public partial class AddAffiliateApplicationCustomerOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AppUserId",
                table: "AffiliateApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateApplications_AppUserId_CreatedAt",
                table: "AffiliateApplications",
                columns: new[] { "AppUserId", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_AffiliateApplications_AppUsers_AppUserId",
                table: "AffiliateApplications",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AffiliateApplications_AppUsers_AppUserId",
                table: "AffiliateApplications");

            migrationBuilder.DropIndex(
                name: "IX_AffiliateApplications_AppUserId_CreatedAt",
                table: "AffiliateApplications");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "AffiliateApplications");
        }

        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "10.0.10")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);
#pragma warning restore 612, 618
        }
    }
}
