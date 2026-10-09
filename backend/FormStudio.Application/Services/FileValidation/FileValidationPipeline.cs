using FormStudio.Application.Interfaces.Services;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FormStudio.Application.Services.FileValidation
{
    public class FileValidationPipeline : IFileValidationPipeline
    {
        private readonly IEnumerable<IFileValidationRule> _rules;

        public FileValidationPipeline(IEnumerable<IFileValidationRule> rules)
        {
            _rules = rules ?? throw new ArgumentNullException(nameof(rules));
        }

        public async Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity)
        {
            foreach (IFileValidationRule rule in _rules)
            {
                await rule.ValidateAsync(file, fieldEntity);
            }
        }
    }
}
