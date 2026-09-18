using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;

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
            var submissions = await _unitOfWork.Submissions.FindAsync(s => s.FormId == formId);
            var responses = await _unitOfWork.Responses.GetAllAsync();

            var submissionList = submissions.OrderByDescending(s => s.SubmittedAt).ToList();
            foreach (var sub in submissionList)
            {
                sub.Responses = responses.Where(r => r.FormSubmissionId == sub.Id).ToList();
            }

            return submissionList.Select(s => s.ToDto());
        }

        public async Task<FormSubmissionDto> SaveSubmissionAsync(int formId, FormSubmissionDto submissionDto)
        {
            if (submissionDto == null) throw new ArgumentNullException(nameof(submissionDto));

            submissionDto.FormId = formId;
            var entity = submissionDto.ToEntity();
            entity.SubmittedAt = DateTime.UtcNow;

            await _unitOfWork.Submissions.AddAsync(entity);
            await _unitOfWork.CompleteAsync();

            return entity.ToDto();
        }

        public async Task<bool> DeleteSubmissionAsync(int formId, int submissionId)
        {
            var submission = await _unitOfWork.Submissions.GetByIdAsync(submissionId);
            if (submission == null || submission.FormId != formId) return false;

            var responses = await _unitOfWork.Responses.FindAsync(r => r.FormSubmissionId == submissionId);
            foreach (var response in responses)
            {
                _unitOfWork.Responses.Delete(response);
            }

            _unitOfWork.Submissions.Delete(submission);
            await _unitOfWork.CompleteAsync();
            return true;
        }
    }
}
