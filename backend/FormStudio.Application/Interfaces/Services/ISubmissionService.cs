using FormStudio.Application.DTOs;

namespace FormStudio.Application.Interfaces.Services
{
    public interface ISubmissionService
    {
        Task<IEnumerable<FormSubmissionDto>> GetSubmissionsAsync(int formId);
        Task<FormSubmissionDto> SaveSubmissionAsync(int formId, FormSubmissionDto submissionDto);
        Task<bool> DeleteSubmissionAsync(int formId, int submissionId);
    }
}
