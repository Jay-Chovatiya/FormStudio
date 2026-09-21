using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;
using FormStudio.Domain.Entities;

namespace FormStudio.Application.Services
{
    public class SubmissionService : ISubmissionService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SubmissionService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        }

        public async Task<IEnumerable<FormSubmissionDto>> GetSubmissionsAsync(int formId)
        {
            List<FormSubmissionEntity> submissions = await _unitOfWork.Repository<FormSubmissionEntity>().GetListAsync(s => s.FormId == formId);
            IReadOnlyList<FormResponseEntity> responses = await _unitOfWork.Repository<FormResponseEntity>().GetAllAsync();

            List<FormSubmissionEntity> submissionList = submissions.OrderByDescending(s => s.SubmittedAt).ToList();
            foreach (FormSubmissionEntity sub in submissionList)
            {
                sub.Responses = responses.Where(r => r.FormSubmissionId == sub.Id).ToList();
            }

            return submissionList.Select(s => s.ToDto());
        }

        public async Task<FormSubmissionDto> SaveSubmissionAsync(int formId, FormSubmissionDto submissionDto)
        {
            if (submissionDto == null) throw new ArgumentNullException(nameof(submissionDto));

            submissionDto.FormId = formId;
            FormSubmissionEntity entity = submissionDto.ToEntity();
            entity.SubmittedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<FormSubmissionEntity>().AddAsync(entity);
            await _unitOfWork.CompleteAsync();

            return entity.ToDto();
        }

        public async Task<bool> DeleteSubmissionAsync(int formId, int submissionId)
        {
            FormSubmissionEntity? submission = await _unitOfWork.Repository<FormSubmissionEntity>().GetByIdAsync(submissionId);
            if (submission == null || submission.FormId != formId) return false;

            List<FormResponseEntity> responses = await _unitOfWork.Repository<FormResponseEntity>().GetListAsync(r => r.FormSubmissionId == submissionId);
            _unitOfWork.Repository<FormResponseEntity>().RemoveRange(responses);

            _unitOfWork.Repository<FormSubmissionEntity>().Remove(submission);
            await _unitOfWork.CompleteAsync();
            return true;
        }
    }
}
