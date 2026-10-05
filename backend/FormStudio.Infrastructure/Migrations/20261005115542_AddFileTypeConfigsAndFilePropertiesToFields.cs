using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FormStudio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFileTypeConfigsAndFilePropertiesToFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxFiles",
                table: "fields",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "MaxSizeInBytes",
                table: "fields",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<bool>(
                name: "Multiple",
                table: "fields",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "file_type_configs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FormFieldId = table.Column<int>(type: "integer", nullable: false),
                    Extension = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_file_type_configs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_file_type_configs_fields_FormFieldId",
                        column: x => x.FormFieldId,
                        principalTable: "fields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_file_type_configs_FormFieldId",
                table: "file_type_configs",
                column: "FormFieldId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "file_type_configs");

            migrationBuilder.DropColumn(
                name: "MaxFiles",
                table: "fields");

            migrationBuilder.DropColumn(
                name: "MaxSizeInBytes",
                table: "fields");

            migrationBuilder.DropColumn(
                name: "Multiple",
                table: "fields");
        }
    }
}
