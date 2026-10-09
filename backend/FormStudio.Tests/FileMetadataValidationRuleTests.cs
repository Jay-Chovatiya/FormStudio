using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using FormStudio.Application.Services.FileValidation;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace FormStudio.Tests
{
    public class MockFormFile : IFormFile
    {
        private readonly byte[] _content;

        public MockFormFile(string fileName, string content = "dummy", string contentType = "application/pdf")
        {
            FileName = fileName;
            ContentType = contentType;
            _content = Encoding.UTF8.GetBytes(content);
        }

        public MockFormFile(string fileName, byte[] bytes, string contentType = "application/pdf")
        {
            FileName = fileName;
            ContentType = contentType;
            _content = bytes;
        }

        public string ContentType { get; set; }
        public string ContentDisposition => "";
        public IHeaderDictionary Headers => new HeaderDictionary();
        public long Length => _content.Length;
        public string Name => "file";
        public string FileName { get; set; }

        public void CopyTo(Stream target) => target.Write(_content, 0, _content.Length);
        public Task CopyToAsync(Stream target, System.Threading.CancellationToken cancellationToken = default)
            => target.WriteAsync(_content, 0, _content.Length, cancellationToken);
        public Stream OpenReadStream() => new MemoryStream(_content);
    }

    public class FileMetadataValidationRuleTests
    {
        private readonly FileMetadataValidationRule _rule = new();
        private readonly FormFieldEntity _field = new()
        {
            Label = "Attachment",
            MaxSizeInBytes = 1024 // 1 KB
        };

        [Fact]
        public async Task ValidateAsync_EmptyFile_ThrowsArgumentException()
        {
            var file = new MockFormFile("test.pdf", "");
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("No file was uploaded or file is empty", ex.Message);
        }

        [Theory]
        [InlineData("../evil.pdf")]
        [InlineData("..\\evil.pdf")]
        [InlineData("sub/folder/file.pdf")]
        [InlineData("sub\\folder\\file.pdf")]
        public async Task ValidateAsync_PathTraversal_ThrowsArgumentException(string maliciousFileName)
        {
            var file = new MockFormFile(maliciousFileName, "content");
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("path traversal", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_NullByte_ThrowsArgumentException()
        {
            var file = new MockFormFile("file\0.pdf", "content");
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("null byte", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_ExceedsMaxSize_ThrowsArgumentException()
        {
            byte[] oversized = new byte[2048]; // 2 KB exceeds 1 KB limit
            var file = new MockFormFile("document.pdf", oversized);
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("exceeds the maximum allowed size", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_ValidFile_PassesValidation()
        {
            var file = new MockFormFile("clean_resume.pdf", "Valid clean file content");
            var exception = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(exception);
        }
    }
}
