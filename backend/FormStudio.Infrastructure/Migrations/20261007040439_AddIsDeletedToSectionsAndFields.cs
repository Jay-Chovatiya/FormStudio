using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormStudio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToSectionsAndFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "sections",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "fields",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "sections");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "fields");
        }
    }
}
