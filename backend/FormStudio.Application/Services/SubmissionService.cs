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
        private readonly IFileStorageService _fileStorageService;

        private static readonly Regex EmailRegex = new Regex(
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public SubmissionService(IUnitOfWork unitOfWork, IFormService formService, IFileStorageService fileStorageService)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _formService = formService ?? throw new ArgumentNullException(nameof(formService));
            _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        }

        public async Task<IEnumerable<FormSubmissionDto>> GetSubmissionsAsync(int formId)
        {
            return await _unitOfWork.Repository<FormSubmissionEntity>().GetListAsync(
                s => s.FormId == formId,
                f => new FormSubmissionDto
                {
                    Id = f.Id,
                    FormId = f.FormId,
                    Responses = f.Responses.Select(r => new FormResponseDto
                    {
                        FieldId = r.FieldId,
                        Value = r.ValueJson
                    }).ToList(),
                    SubmittedAt = f.SubmittedAt
                },
                f => f.SubmittedAt,
                false
                );
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

                // Check File field restrictions
                if (string.Equals(field.Type, "File", StringComparison.OrdinalIgnoreCase))
                {
                    if (field.AllowedTypes == null || !field.AllowedTypes.Any())
                    {
                        throw new ArgumentException($"Field '{field.Label}' does not permit file uploads because no allowed types are configured.");
                    }

                    HashSet<string> allowedExtensions = field.AllowedTypes
                        .Where(t => !string.IsNullOrWhiteSpace(t.Extension))
                        .Select(t => (t.Extension.StartsWith(".") ? t.Extension : "." + t.Extension).Trim().ToLowerInvariant())
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);

                    List<string> fileUrls = ParseFileUrls(responseStr);

                    // Validate extension for every file
                    foreach (string fileUrl in fileUrls)
                    {
                        string fileExtension = Path.GetExtension(fileUrl).ToLowerInvariant();
                        if (string.IsNullOrEmpty(fileExtension) || !allowedExtensions.Contains(fileExtension))
                        {
                            throw new ArgumentException($"Uploaded file format '{fileExtension}' for '{field.Label}' is not allowed.");
                        }
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

            string formCode = await _unitOfWork.Repository<FormDefinitionEntity>().GetFirstOrDefaultAsync(f => f.Id == formId, f => f.Code) ?? throw new KeyNotFoundException($"Form with id {formId} not found");

            List<int> fileTypeFieldIds = await _unitOfWork.Repository<FormFieldEntity>()
                .GetListAsync<int>(
                    f => f.Type == "File" && f.FormSection != null && f.FormSection.FormDefinitionId == formId,
                    f => f.Id);
            HashSet<int> fileFieldIdSet = fileTypeFieldIds.ToHashSet();

            List<FormResponseEntity> responses = await _unitOfWork.Repository<FormResponseEntity>().GetListAsync(r => r.FormSubmissionId == submissionId);

            foreach (var resp in responses.Where(r => fileFieldIdSet.Contains(r.FieldId)))
            {
                if (string.IsNullOrWhiteSpace(resp.ValueJson)) continue;

                List<string> fileUrls = ParseFileUrls(resp.ValueJson);

                foreach (string url in fileUrls)
                {
                    string fileName = Path.GetFileName(url);
                    if (!string.IsNullOrWhiteSpace(fileName))
                    {
                        _fileStorageService.RemoveFile(formCode, fileName);
                    }
                }
            }

            _unitOfWork.Repository<FormResponseEntity>().RemoveRange(responses);
            _unitOfWork.Repository<FormSubmissionEntity>().Remove(submission);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        private static List<string> ParseFileUrls(string? jsonOrUrl)
        {
            if (string.IsNullOrWhiteSpace(jsonOrUrl))
            {
                return [];
            }

            string trimmed = jsonOrUrl.Trim();
            if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
            {
                try
                {
                    List<string> urls = [];
                    using var doc = System.Text.Json.JsonDocument.Parse(trimmed);
                    foreach (var element in doc.RootElement.EnumerateArray())
                    {
                        if (element.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            string? url = element.GetString();
                            if (!string.IsNullOrWhiteSpace(url)) urls.Add(url);
                        }
                        else if (element.ValueKind == System.Text.Json.JsonValueKind.Object && element.TryGetProperty("fileUrl", out var urlProp))
                        {
                            string? url = urlProp.GetString();
                            if (!string.IsNullOrWhiteSpace(url)) urls.Add(url);
                        }
                    }
                    return urls;
                }
                catch
                {
                    return [trimmed];
                }
            }

            return [trimmed];
        }
    }
}
