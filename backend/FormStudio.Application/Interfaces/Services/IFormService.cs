using FormStudio.Application.DTOs;

namespace FormStudio.Application.Interfaces.Services
{
    public interface IFormService
    {
        Task<IEnumerable<FormDefinitionDto>> GetFormsAsync();
        Task<FormDefinitionDto?> GetFormByIdAsync(int id);
        Task<FormDefinitionDto?> GetFormByCodeAsync(string code);
        Task<FormDefinitionDto> CreateFormAsync(FormDefinitionDto dto);
        Task<FormDefinitionDto?> UpdateFormAsync(int id, FormDefinitionDto dto);
        Task<bool> DeleteFormAsync(int id);
        Task<FormDefinitionDto?> UpdateFormStatusAsync(int id, string status);
        Task<FormDefinitionDto?> PublishFormAsync(int id);
        Task<FormDefinitionDto?> UnpublishFormAsync(int id);
        Task<FormDefinitionDto?> DuplicateFormAsync(int id);
    }
}
