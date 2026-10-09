using FormStudio.Application.Interfaces.Services;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System.Text.RegularExpressions;

namespace FormStudio.Application.Services.FileValidation
{
    /// <summary>
    /// Layer 3: MIME Type & HTTP Content-Type Header Whitelist Validation:
    /// - Ensures Content-Type header is present and well-formed (type/subtype syntax)
    /// - Blocks dangerous or generic executable/script MIME types
    /// - Strictly verifies that Content-Type matches the registered allowed MIME types for the file extension
    /// </summary>
    public class FileMimeTypeValidationRule : IFileValidationRule
    {
        // RFC standard MIME type structure (e.g. application/pdf, image/png, application/vnd.ms-excel)
        private static readonly Regex MimeTypeStructureRegex = new(
            @"^[a-zA-Z0-9]+[a-zA-Z0-9!#$&^_.+-]*/[a-zA-Z0-9!#$&^_.+-]+$",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);
        
        // Explicitly prohibited MIME types representing scripts, executables, or HTML/code payloads
        private static readonly HashSet<string> DangerousMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/x-msdownload",
            "application/x-msdos-program",
            "application/x-executable",
            "application/x-sh",
            "application/x-csh",
            "application/x-php",
            "application/x-httpd-php",
            "application/x-bat",
            "application/x-powershell",
            "text/javascript",
            "application/javascript",
            "application/x-javascript",
            "text/html",
            "application/xhtml+xml",
            "text/x-python",
            "application/x-python-code"
        };

        public Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity)
        {
            string rawContentType = file.ContentType?.Trim().ToLowerInvariant() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(rawContentType))
            {
                throw new ArgumentException("Uploaded file is missing the Content-Type header.");
            }

            if (!MimeTypeStructureRegex.IsMatch(rawContentType))
            {
                throw new ArgumentException($"Invalid Content-Type header format: '{file.ContentType}'.");
            }

            if (DangerousMimeTypes.Contains(rawContentType))
            {
                throw new ArgumentException($"Content-Type '{file.ContentType}' is strictly prohibited for security reasons.");
            }

            // 3. Match MIME type strictly against the configuration of the incoming file extension
            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            FileTypeConfigEntity? matchingConfig = fieldEntity.AllowedTypes?
                .FirstOrDefault(t => t.Extension.Trim().Equals(extension, StringComparison.OrdinalIgnoreCase));

            string? expectedMimeType = matchingConfig?.MimeType?.Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(expectedMimeType) && !string.Equals(expectedMimeType, rawContentType, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' has a Content-Type '{file.ContentType}' that does not match the allowed MIME type for '{extension}'. Expected: {expectedMimeType}");
            }

            return Task.CompletedTask;
        }
    }
}
