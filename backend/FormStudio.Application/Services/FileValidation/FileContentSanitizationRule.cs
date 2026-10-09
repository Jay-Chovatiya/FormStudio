using FormStudio.Application.Interfaces.Services;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System.Text;
using System.Text.RegularExpressions;

namespace FormStudio.Application.Services.FileValidation
{
    /// <summary>
    /// Inspects file content for embedded script payloads, macro patterns, and active XSS vectors in documents and text/SVG formats.
    /// </summary>
    public class FileContentSanitizationRule : IFileValidationRule
    {
        private static readonly HashSet<string> WebTextExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".svg", ".xml", ".html", ".htm", ".txt", ".csv", ".json"
        };

        private static readonly Regex XssPatternRegex = new(
            @"<\s*script[^>]*>|javascript\s*:|vbscript\s*:|on(load|error|click|mouseover|submit|focus|blur)\s*=|<\s*iframe[^>]*>|<\s*object[^>]*>|<\s*embed[^>]*>",
            RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private static readonly byte[] OpenOfficeVbaProjectMarker = Encoding.ASCII.GetBytes("vbaProject.bin");
        private static readonly byte[] PdfJavaScriptMarker = Encoding.ASCII.GetBytes("/JavaScript");
        private static readonly byte[] PdfJsMarker = Encoding.ASCII.GetBytes("/JS");

        public async Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity)
        {
            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            const int maxBufferInspectionBytes = 32 * 1024;
            int bytesToRead = (int)Math.Min(file.Length, maxBufferInspectionBytes);
            byte[] buffer = new byte[bytesToRead];
            int bytesRead;

            using (Stream stream = file.OpenReadStream())
            {
                if (stream.CanSeek)
                {
                    stream.Position = 0;
                }

                bytesRead = await stream.ReadAsync(buffer.AsMemory(0, bytesToRead));

                if (stream.CanSeek)
                {
                    stream.Position = 0;
                }
            }

            if (WebTextExtensions.Contains(extension))
            {
                string textSnippet = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                if (XssPatternRegex.IsMatch(textSnippet))
                {
                    throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' is rejected because it contains active script or HTML tags.");
                }
            }

            if (extension is ".docx" or ".xlsx" or ".pptx")
            {
                if (ContainsByteSequence(buffer, bytesRead, OpenOfficeVbaProjectMarker))
                {
                    throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' is rejected because it contains embedded VBA macros.");
                }
            }

            if (extension == ".pdf")
            {
                if (ContainsByteSequence(buffer, bytesRead, PdfJavaScriptMarker) || ContainsByteSequence(buffer, bytesRead, PdfJsMarker))
                {
                    throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' is rejected because it contains embedded PDF JavaScript actions.");
                }
            }
        }

        private static bool ContainsByteSequence(byte[] buffer, int length, byte[] sequence)
        {
            if (length < sequence.Length) return false;

            for (int i = 0; i <= length - sequence.Length; i++)
            {
                bool match = true;
                for (int j = 0; j < sequence.Length; j++)
                {
                    if (buffer[i + j] != sequence[j])
                    {
                        match = false;
                        break;
                    }
                }

                if (match) return true;
            }

            return false;
        }
    }
}
