using FormStudio.Application.Interfaces.Services;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FormStudio.Application.Services.FileValidation
{
    /// <summary>
    /// Layer 1: Validates fundamental file metadata:
    /// - Non-null and non-empty file payload
    /// - Maximum file size check
    /// - Filename sanity (null bytes, path traversal sequences, invalid characters)
    /// </summary>
    public class FileMetadataValidationRule : IFileValidationRule
    {
        public Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("No file was uploaded or file is empty.");
            }

            string rawFileName = file.FileName;
            if (string.IsNullOrWhiteSpace(rawFileName))
            {
                throw new ArgumentException("Uploaded file must have a valid filename.");
            }

            if (rawFileName.Contains('\0'))
            {
                throw new ArgumentException("Filename contains invalid null byte characters.");
            }

            if (rawFileName.Contains("..") || rawFileName.Contains('/') || rawFileName.Contains('\\'))
            {
                throw new ArgumentException("Filename contains invalid path traversal characters.");
            }

            char[] invalidChars = Path.GetInvalidFileNameChars();
            if (rawFileName.IndexOfAny(invalidChars) >= 0)
            {
                throw new ArgumentException("Filename contains invalid system characters.");
            }

            long maxSize = fieldEntity.MaxSizeInBytes > 0 ? fieldEntity.MaxSizeInBytes : 5242880;
            if (file.Length > maxSize)
            {
                double maxMb = Math.Round((double)maxSize / (1024 * 1024), 1);
                throw new ArgumentException($"File '{Path.GetFileName(rawFileName)}' exceeds the maximum allowed size of {maxMb} MB.");
            }

            return Task.CompletedTask;
        }
    }
}
