using FormStudio.Application.Interfaces.Services;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FormStudio.Application.Services.FileValidation
{
    /// <summary>
    /// Layer 2: Extension & Anti-Double-Extension Whitelist Validation:
    /// - Rejects extensionless files or files with hidden extensions
    /// - Strict whitelisting against the field's AllowedTypes (.pdf, .png, etc.)
    /// - Blocks dangerous executable/script extensions anywhere in the filename tokens
    /// - Blocks double-extension attacks (e.g. invoice.php.pdf or report.exe.png)
    /// </summary>
    public class FileExtensionValidationRule : IFileValidationRule
    {
        // High-risk executable/script extensions that should never be permitted
        private static readonly HashSet<string> DangerousExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".exe", ".dll", ".bat", ".cmd", ".sh", ".bash", ".ps1", ".vbs", ".js",
            ".php", ".php3", ".php4", ".php5", ".phtml", ".asp", ".aspx", ".ashx",
            ".jsp", ".jspx", ".cgi", ".pl", ".py", ".rb", ".jar", ".war", ".ear",
            ".msi", ".scr", ".pif", ".com", ".hta", ".cpl", ".reg", ".cer"
        };

        public Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity)
        {
            string fileName = Path.GetFileName(file.FileName).Trim();
            string extension = Path.GetExtension(fileName).ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(extension))
            {
                throw new ArgumentException($"File '{fileName}' has no file extension.");
            }

            HashSet<string> allowedExtensions = fieldEntity.AllowedTypes != null
                ? fieldEntity.AllowedTypes
                    .Where(t => !string.IsNullOrWhiteSpace(t.Extension))
                    .Select(t => t.Extension.Trim().ToLowerInvariant())
                    .ToHashSet(StringComparer.OrdinalIgnoreCase)
                : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (allowedExtensions.Count == 0)
            {
                throw new InvalidOperationException($"File uploads are not permitted for field '{fieldEntity.Label}' because no allowed types are configured.");
            }

            if (!allowedExtensions.Contains(extension))
            {
                throw new ArgumentException($"File '{fileName}' has an unsupported extension '{extension}'. Allowed extensions: {string.Join(", ", allowedExtensions)}");
            }

            string[] tokens = fileName.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (tokens.Length > 2)
            {
                for (int i = 1; i < tokens.Length - 1; i++)
                {
                    string candidateExt = "." + tokens[i].Trim().ToLowerInvariant();
                    if (DangerousExtensions.Contains(candidateExt))
                    {
                        throw new ArgumentException($"File '{fileName}' is rejected due to suspicious double extension containing executable type '{candidateExt}'.");
                    }
                }
            }

            if (DangerousExtensions.Contains(extension))
            {
                throw new ArgumentException($"File extension '{extension}' is strictly prohibited for security reasons.");
            }

            return Task.CompletedTask;
        }
    }
}
