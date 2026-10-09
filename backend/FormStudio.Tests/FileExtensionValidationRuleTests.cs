using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FormStudio.Application.Services.FileValidation;
using FormStudio.Domain.Entities;
using Xunit;

namespace FormStudio.Tests
{
    public class FileExtensionValidationRuleTests
    {
        private readonly FileExtensionValidationRule _rule = new();

        private FormFieldEntity CreateField(params string[] allowedExtensions)
        {
            var allowed = new List<FileTypeConfigEntity>();
            foreach (var ext in allowedExtensions)
            {
                allowed.Add(new FileTypeConfigEntity
                {
                    Extension = ext,
                    MimeType = "application/octet-stream"
                });
            }

            return new FormFieldEntity
            {
                Label = "Upload Document",
                AllowedTypes = allowed
            };
        }

        [Fact]
        public async Task ValidateAsync_ValidExtension_Passes()
        {
            var field = CreateField(".pdf", ".png");
            var file = new MockFormFile("document.pdf", "sample");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_ValidExtension_CaseInsensitive_Passes()
        {
            var field = CreateField(".pdf");
            var file = new MockFormFile("DOCUMENT.PDF", "sample");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_MissingExtension_ThrowsArgumentException()
        {
            var field = CreateField(".pdf");
            var file = new MockFormFile("document_without_ext", "sample");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("has no file extension", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_DisallowedExtension_ThrowsArgumentException()
        {
            var field = CreateField(".pdf");
            var file = new MockFormFile("document.docx", "sample");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("unsupported extension", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Theory]
        [InlineData("invoice.php.pdf")]
        [InlineData("shell.aspx.pdf")]
        [InlineData("payload.exe.pdf")]
        [InlineData("script.bat.png")]
        [InlineData("exploit.ps1.jpg")]
        public async Task ValidateAsync_DoubleExtensionWithExecutable_ThrowsArgumentException(string maliciousName)
        {
            var field = CreateField(".pdf", ".png", ".jpg");
            var file = new MockFormFile(maliciousName, "sample");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("double extension", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_MultipleSafeDots_Passes()
        {
            // E.g. "report.v1.0.final.pdf" has dots but no dangerous extensions
            var field = CreateField(".pdf");
            var file = new MockFormFile("report.v1.0.final.pdf", "sample");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_NoConfiguredAllowedTypes_ThrowsInvalidOperationException()
        {
            var field = new FormFieldEntity
            {
                Label = "Empty Field",
                AllowedTypes = new List<FileTypeConfigEntity>()
            };
            var file = new MockFormFile("test.pdf", "sample");

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("no allowed types are configured", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
    }
}
