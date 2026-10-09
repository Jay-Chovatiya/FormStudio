using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FormStudio.Application.Services.FileValidation;
using FormStudio.Domain.Entities;
using Xunit;

namespace FormStudio.Tests
{
    public class FileMimeTypeValidationRuleTests
    {
        private readonly FileMimeTypeValidationRule _rule = new();

        private FormFieldEntity CreateField(string extension, string mimeType)
        {
            return new FormFieldEntity
            {
                Label = "Resume File",
                AllowedTypes = new List<FileTypeConfigEntity>
                {
                    new FileTypeConfigEntity
                    {
                        Extension = extension,
                        MimeType = mimeType
                    }
                }
            };
        }

        [Fact]
        public async Task ValidateAsync_ValidMimeType_Passes()
        {
            var field = CreateField(".pdf", "application/pdf");
            var file = new MockFormFile("document.pdf", "sample", "application/pdf");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_ValidMimeType_CaseInsensitive_Passes()
        {
            var field = CreateField(".pdf", "application/pdf");
            var file = new MockFormFile("document.pdf", "sample", "APPLICATION/PDF");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_MissingContentType_ThrowsArgumentException()
        {
            var field = CreateField(".pdf", "application/pdf");
            var file = new MockFormFile("document.pdf", "sample", "");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("missing the Content-Type header", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Theory]
        [InlineData("invalid-format")]
        [InlineData("notamime")]
        [InlineData("application/")]
        [InlineData("/pdf")]
        public async Task ValidateAsync_MalformedContentType_ThrowsArgumentException(string badFormat)
        {
            var field = CreateField(".pdf", "application/pdf");
            var file = new MockFormFile("document.pdf", "sample", badFormat);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("Invalid Content-Type header format", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Theory]
        [InlineData("application/x-msdownload")]
        [InlineData("application/x-executable")]
        [InlineData("application/x-php")]
        [InlineData("text/javascript")]
        [InlineData("text/html")]
        public async Task ValidateAsync_DangerousMimeType_ThrowsArgumentException(string dangerousMime)
        {
            var field = CreateField(".pdf", "application/pdf");
            var file = new MockFormFile("document.pdf", "sample", dangerousMime);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("strictly prohibited", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_MismatchedMimeType_ThrowsArgumentException()
        {
            // Allowed is application/pdf, but client sends image/png
            var field = CreateField(".pdf", "application/pdf");
            var file = new MockFormFile("document.pdf", "sample", "image/png");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("does not match the allowed MIME type", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_MimeTypeBelongsToAnotherAllowedExtension_ThrowsArgumentException()
        {
            // Both .pdf (application/pdf) and .png (image/png) are allowed on the field
            var field = new FormFieldEntity
            {
                Label = "Uploads",
                AllowedTypes = new List<FileTypeConfigEntity>
                {
                    new FileTypeConfigEntity { Extension = ".pdf", MimeType = "application/pdf" },
                    new FileTypeConfigEntity { Extension = ".png", MimeType = "image/png" }
                }
            };

            // User uploads a .pdf, but sends image/png Content-Type (which is in AllowedTypes, but wrong for .pdf!)
            var file = new MockFormFile("document.pdf", "sample", "image/png");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, field));
            Assert.Contains("does not match the allowed MIME type for '.pdf'", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
    }
}
