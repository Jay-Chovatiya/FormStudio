using Microsoft.AspNetCore.Http;

namespace FormStudio.Application.Interfaces.Services
{
    public interface IFileStorageService
    {
        Task<string> UploadFieldFileAsync(string formCode, string fieldName, IFormFile file);
        Stream? GetFile(string formCode, string fileName);
        bool RemoveFile(string formCode, string fileName);
    }
}
