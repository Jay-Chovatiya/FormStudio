using System;
using System.Text;
using System.Threading.Tasks;
using FormStudio.Application.Services.FileValidation;
using FormStudio.Domain.Entities;
using Xunit;

namespace FormStudio.Tests
{
    public class FileContentSanitizationRuleTests
    {
        private readonly FileContentSanitizationRule _rule = new();
        private readonly FormFieldEntity _field = new() { Label = "Uploaded File" };

        [Fact]
        public async Task ValidateAsync_CleanSvgOrCsv_Passes()
        {
            string cleanCsv = "id,name,role\n1,alice,admin\n2,bob,user";
            var file = new MockFormFile("users.csv", cleanCsv, "text/csv");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(ex);
        }

        [Theory]
        [InlineData("<script>alert('xss')</script>")]
        [InlineData("<svg onload=alert(1)>")]
        [InlineData("<a href=\"javascript:alert(1)\">click</a>")]
        [InlineData("<iframe src=\"evil.com\"></iframe>")]
        public async Task ValidateAsync_ActiveScriptInTextFile_ThrowsArgumentException(string payload)
        {
            var file = new MockFormFile("test.csv", payload, "text/csv");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("active script or HTML tags", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_DocxWithVbaProjectMacro_ThrowsArgumentException()
        {
            // Simulate a DOCX binary containing the vbaProject.bin marker
            byte[] docxHeader = [0x50, 0x4B, 0x03, 0x04];
            byte[] macroMarker = Encoding.ASCII.GetBytes("word/vbaProject.bin");
            byte[] payload = new byte[docxHeader.Length + macroMarker.Length + 10];

            Buffer.BlockCopy(docxHeader, 0, payload, 0, docxHeader.Length);
            Buffer.BlockCopy(macroMarker, 0, payload, docxHeader.Length, macroMarker.Length);

            var file = new MockFormFile("invoice.docx", payload, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("embedded VBA macros", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_PdfWithEmbeddedJavaScript_ThrowsArgumentException()
        {
            // Simulate a PDF with a /JavaScript action dictionary
            string fakePdf = "%PDF-1.5\n1 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert('PWNED');) >>\nendobj";
            var file = new MockFormFile("statement.pdf", fakePdf, "application/pdf");

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _rule.ValidateAsync(file, _field));
            Assert.Contains("embedded PDF JavaScript actions", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ValidateAsync_CleanPdf_Passes()
        {
            string cleanPdf = "%PDF-1.5\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Root 1 0 R >>";
            var file = new MockFormFile("clean.pdf", cleanPdf, "application/pdf");

            var ex = await Record.ExceptionAsync(() => _rule.ValidateAsync(file, _field));
            Assert.Null(ex);
        }
    }
}
