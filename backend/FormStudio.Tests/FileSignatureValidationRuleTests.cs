using System;
using System.IO;
using System.Threading.Tasks;
using FormStudio.Application.Services.FileValidation;
using FormStudio.Domain.Entities;
using Xunit;

namespace FormStudio.Tests
{
    public class FileSignatureValidationRuleTests
    {
        private readonly FileSignatureValidationRule _rule = new();
        private readonly FormFieldEntity _field = new() { Label = "Document" };

        [Fact]
        public async Task ValidateAsync_ValidPdfSignature_Passes()
        {
            // PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46)
            byte[] pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35];
            var file = new MockFormFile("test.pdf", pdfBytes);

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_ValidPngSignature_Passes()
        {
            // PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
            byte[] pngBytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00];
            var file = new MockFormFile("image.png", pngBytes);

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_ValidJpegSignature_Passes()
        {
            // JPEG Magic Bytes: FF D8 FF
            byte[] jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
            var file = new MockFormFile("photo.jpg", jpegBytes);

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_ValidDocxZipSignature_Passes()
        {
            // DOCX / ZIP Magic Bytes: PK\x03\x04 (50 4B 03 04)
            byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04, 0x14, 0x00];
            var file = new MockFormFile("doc.docx", docxBytes);

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_RenamedExeWithMzHeader_ThrowsArgumentException()
        {
            // An executable file (MZ header: 0x4D, 0x5A) renamed to .pdf
            byte[] exeBytes = [0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00];
            var file = new MockFormFile("malware.pdf", exeBytes);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("contains executable binary content (MZ header)", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_TextFileRenamedToPdf_ThrowsArgumentException()
        {
            // Plain text content ("Hello world") named .pdf
            byte[] textBytes = System.Text.Encoding.UTF8.GetBytes("Hello, this is just a plain text file.");
            var file = new MockFormFile("fake.pdf", textBytes);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("does not match the expected binary signature for '.pdf'", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_TooSmallFileForHeader_ThrowsArgumentException()
        {
            byte[] singleByte = [0x01];
            var file = new MockFormFile("tiny.pdf", singleByte);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("too small to contain a valid file signature", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_ValidCsvFile_Passes()
        {
            byte[] csvBytes = System.Text.Encoding.UTF8.GetBytes("Id,Name,Score\n1,Alice,100\n2,Bob,95");
            var file = new MockFormFile("data.csv", csvBytes, "text/csv");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(ex);
        }

        [Fact]
        public async Task ValidateAsync_BinaryFileDisguisedAsCsv_ThrowsArgumentException()
        {
            // Binary bytes with null byte (0x00) disguised with .csv extension
            byte[] binaryBytes = [0x01, 0x00, 0x02, 0x03, 0x04, 0x05];
            var file = new MockFormFile("malicious.csv", binaryBytes, "text/csv");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("contains binary null bytes", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_ExecutableDisguisedAsCsv_ThrowsArgumentException()
        {
            // Windows PE executable (MZ header) disguised with .csv extension
            byte[] exeBytes = [0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00];
            var file = new MockFormFile("payload.csv", exeBytes, "text/csv");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("contains executable binary content (MZ header)", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
    }
}
