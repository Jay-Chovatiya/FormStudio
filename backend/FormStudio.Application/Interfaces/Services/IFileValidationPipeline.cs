using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FormStudio.Application.Interfaces.Services
{
    public interface IFileValidationPipeline
    {
        Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity);
    }
}
