using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FormStudio.Application.Interfaces.Services
{
    public interface IFileValidationRule
    {
        /// <summary>
        /// Validates the uploaded file against this specific security layer.
        /// Throws an ArgumentException or InvalidOperationException if validation fails.
        /// </summary>
        Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity);
    }
}
