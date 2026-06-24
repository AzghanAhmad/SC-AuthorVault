using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthorVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBooksJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BooksJson",
                table: "UserWorkspaces",
                type: "longtext",
                nullable: false,
                defaultValue: "[]")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BooksJson",
                table: "UserWorkspaces");
        }
    }
}
