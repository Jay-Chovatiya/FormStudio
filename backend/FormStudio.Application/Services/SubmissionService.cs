using System.Text.RegularExpressions;
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
        private readonly IFormService _formService;

        private static readonly Regex EmailRegex = new Regex(
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public SubmissionService(IUnitOfWork unitOfWork, IFormService formService)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _formService = formService ?? throw new ArgumentNullException(nameof(formService));
        }

        public async Task<IEnumerable<FormSubmissionDto>> GetSubmissionsAsync(int formId)
        {
            List<FormSubmissionEntity> submissions = await _unitOfWork.Repository<FormSubmissionEntity>().GetListAsync(s => s.FormId == formId);
            List<int> submissionIds = submissions.Select(s => s.Id).ToList();
            List<FormResponseEntity> responses = await _unitOfWork.Repository<FormResponseEntity>().GetListAsync(r => submissionIds.Contains(r.FormSubmissionId));

            List<FormSubmissionEntity> submissionList = submissions.OrderByDescending(s => s.SubmittedAt).ToList();
            foreach (FormSubmissionEntity sub in submissionList)
            {
                sub.Responses = responses.Where(r => r.FormSubmissionId == sub.Id).ToList();
            }

            return submissionList.Select(s => s.ToDto());
        }

        public async Task<FormSubmissionDto> SaveSubmissionAsync(string code, FormSubmissionDto submissionDto)
        {
            if (submissionDto == null) throw new ArgumentNullException(nameof(submissionDto));

            FormDefinitionDto? form = await _formService.GetPublishedFormByCodeAsync(code);
            if (form == null)
            {
                throw new KeyNotFoundException("Invalid form URL or form is not currently active.");
            }

            
            DateTime now = DateTime.Now;
            if (form.StartDate.HasValue && now < form.StartDate.Value)
            {
                throw new InvalidOperationException($"This form will open for submissions on {form.StartDate.Value:yyyy-MM-dd HH:mm}.");
            }

            if (form.EndDate.HasValue && now > form.EndDate.Value)
            {
                throw new InvalidOperationException($"This form closed on {form.EndDate.Value:yyyy-MM-dd HH:mm}.");
            }

            List<FormFieldDto> allFields = form.Sections.SelectMany(s => s.Fields).ToList();
            Dictionary<int, FormResponseDto> responseMap = new Dictionary<int, FormResponseDto>();
            foreach (FormResponseDto resp in submissionDto.Responses)
            {
                responseMap[resp.FieldId] = resp;
            }

            foreach (FormFieldDto field in allFields)
            {
                responseMap.TryGetValue(field.Id, out FormResponseDto? response);
                string responseStr = response?.Value?.ToString()?.Trim() ?? string.Empty;
                bool hasValue = !string.IsNullOrEmpty(responseStr);

                // Required check
                bool isRequired = field.Validations != null && field.Validations.Any(v => string.Equals(v.Type, "required", StringComparison.OrdinalIgnoreCase));
                if (isRequired && !hasValue)
                {
                    throw new ArgumentException($"Field '{field.Label}' is required.");
                }

                if (!hasValue) continue;

                // Validation rules
                if (field.Validations != null)
                {
                    foreach (FieldValidationDto validation in field.Validations)
                    {
                        string valType = validation.Type.ToLowerInvariant();
                        string valConstraint = validation.Value?.ToString() ?? string.Empty;

                        switch (valType)
                        {
                            case "minlength":
                                if (int.TryParse(valConstraint, out int minLen) && responseStr.Length < minLen)
                                {
                                    throw new ArgumentException($"Field '{field.Label}' must be at least {minLen} characters.");
                                }
                                break;

                            case "maxlength":
                                if (int.TryParse(valConstraint, out int maxLen) && responseStr.Length > maxLen)
                                {
                                    throw new ArgumentException($"Field '{field.Label}' cannot exceed {maxLen} characters.");
                                }
                                break;

                            case "minvalue":
                                if (double.TryParse(valConstraint, out double minVal) &&
                                    double.TryParse(responseStr, out double numVal1) && numVal1 < minVal)
                                {
                                    throw new ArgumentException($"Field '{field.Label}' must be at least {minVal}.");
                                }
                                break;

                            case "maxvalue":
                                if (double.TryParse(valConstraint, out double maxVal) &&
                                    double.TryParse(responseStr, out double numVal2) && numVal2 > maxVal)
                                {
                                    throw new ArgumentException($"Field '{field.Label}' cannot exceed {maxVal}.");
                                }
                                break;

                            case "email":
                                if (!EmailRegex.IsMatch(responseStr))
                                {
                                    throw new ArgumentException($"Field '{field.Label}' must be a valid email address.");
                                }
                                break;

                            case "pattern":
                                if (!string.IsNullOrEmpty(valConstraint))
                                {
                                    Regex customRegex = new Regex(valConstraint);
                                    if (!customRegex.IsMatch(responseStr))
                                    {
                                        throw new ArgumentException($"Field '{field.Label}' format is invalid.");
                                    }
                                }
                                break;
                        }
                    }
                }

                // Check option validity for Dropdown, Radio, Checkbox
                if (string.Equals(field.Type, "Dropdown", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(field.Type, "Radio", StringComparison.OrdinalIgnoreCase))
                {
                    HashSet<string> allowedOptions = field.Options != null
                        ? field.Options.Select(o => o.Value).ToHashSet(StringComparer.OrdinalIgnoreCase)
                        : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                    if (allowedOptions.Count > 0 && !allowedOptions.Contains(responseStr))
                    {
                        throw new ArgumentException($"Selected option '{responseStr}' for '{field.Label}' is invalid.");
                    }
                }
            }

            // 4. Save Submission
            submissionDto.FormId = form.Id;
            FormSubmissionEntity entity = submissionDto.ToEntity();
            entity.SubmittedAt = DateTime.Now;

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
