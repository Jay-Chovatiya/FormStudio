using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FormStudio.Application.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public FileStorageService(IUnitOfWork unitOfWork, IWebHostEnvironment webHostEnvironment)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _webHostEnvironment = webHostEnvironment ?? throw new ArgumentNullException(nameof(webHostEnvironment));
        }

        public async Task<string> UploadFieldFileAsync(string formCode, string fieldName, IFormFile file)
        {
            if (string.IsNullOrWhiteSpace(formCode))
            {
                throw new ArgumentException("Form code is required.", nameof(formCode));
            }

            if (string.IsNullOrWhiteSpace(fieldName))
            {
                throw new ArgumentException("Field name is required.", nameof(fieldName));
            }

            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("No file was uploaded or file is empty.", nameof(file));
            }

            string trimmedCode = formCode.Trim();
            string trimmedFieldName = fieldName.Trim();

            FormFieldEntity? fieldEntity = await _unitOfWork.Repository<FormFieldEntity>()
                .Query()
                .Include(f => f.AllowedTypes)
                .Where(f => !f.IsDeleted &&
                            f.Type == "File" &&
                            f.Name == trimmedFieldName &&
                            f.FormSection != null &&
                            !f.FormSection.IsDeleted &&
                            f.FormSection.FormDefinition != null &&
                            f.FormSection.FormDefinition.Code == trimmedCode &&
                            f.FormSection.FormDefinition.Status == "Published")
                .FirstOrDefaultAsync();

            if (fieldEntity == null)
            {
                throw new KeyNotFoundException($"Field '{trimmedFieldName}' not found for active form '{trimmedCode}', or form is not active.");
            }

            if (fieldEntity.AllowedTypes == null || !fieldEntity.AllowedTypes.Any())
            {
                throw new InvalidOperationException($"File uploads are not permitted for field '{fieldEntity.Label}' because no allowed types are configured.");
            }

            string originalName = Path.GetFileName(file.FileName);
            string extension = Path.GetExtension(originalName);
            string fileExt = extension.ToLowerInvariant();

            HashSet<string> allowedExtensions = fieldEntity.AllowedTypes
                .Where(t => !string.IsNullOrWhiteSpace(t.Extension))
                .Select(t => t.Extension.Trim().ToLowerInvariant())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (!allowedExtensions.Contains(fileExt))
            {
                throw new ArgumentException($"File '{originalName}' has an unsupported format. Allowed formats: {string.Join(", ", allowedExtensions)}");
            }

            long maxSize = fieldEntity.MaxSizeInBytes > 0 ? fieldEntity.MaxSizeInBytes : 5242880;
            if (file.Length > maxSize)
            {
                double maxMb = Math.Round((double)maxSize / (1024 * 1024), 1);
                throw new ArgumentException($"File '{originalName}' exceeds the maximum allowed size of {maxMb} MB.");
            }

            string contentRoot = _webHostEnvironment.ContentRootPath ?? Directory.GetCurrentDirectory();
            string uploadsRoot = Path.Combine(contentRoot, "App_Data", "Uploads");
            string formDirectory = Path.Combine(uploadsRoot, trimmedCode);

            if (!Directory.Exists(formDirectory))
            {
                Directory.CreateDirectory(formDirectory);
            }

            string nameWithoutExt = Path.GetFileNameWithoutExtension(originalName);
            string storedName = $"{nameWithoutExt}_{Guid.NewGuid():N}{extension}";
            string destinationPath = Path.Combine(formDirectory, storedName);

            using (FileStream stream = new FileStream(destinationPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/api/forms/{trimmedCode}/files/{storedName}";
        }

        public Stream? GetFile(string formCode, string fileName)
        {
            if (string.IsNullOrWhiteSpace(formCode) || string.IsNullOrWhiteSpace(fileName))
            {
                return null;
            }

            string safeFileName = Path.GetFileName(fileName);
            string contentRoot = _webHostEnvironment.ContentRootPath ?? Directory.GetCurrentDirectory();
            string filePath = Path.Combine(contentRoot, "App_Data", "Uploads", formCode.Trim(), safeFileName);

            if (!File.Exists(filePath))
            {
                throw new KeyNotFoundException($"The requested file '{safeFileName}' was not found on the server.");
            }

            return new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        }

        public bool RemoveFile(string formCode, string fileName)
        {
            if (string.IsNullOrWhiteSpace(formCode) || string.IsNullOrWhiteSpace(fileName)) return false;

            string safeFileName = Path.GetFileName(fileName);
            string contentRoot = _webHostEnvironment.ContentRootPath ?? Directory.GetCurrentDirectory();
            string filePath = Path.Combine(contentRoot, "App_Data", "Uploads", formCode.Trim(), safeFileName);

            if (!File.Exists(filePath))
                return false;

            File.Delete(filePath);
            return true;
        }
    }
}
