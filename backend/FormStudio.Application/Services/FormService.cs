using System.Linq.Expressions;
using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;
using FormStudio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormStudio.Application.Services
{
    public class FormService : IFormService
    {
        private readonly IUnitOfWork _unitOfWork;

        public FormService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        }

        public async Task<IEnumerable<FormDefinitionDto>> GetFormsAsync()
        {
            return await GetFormListWithDetailsAsync(f => true);
        }

        public async Task<FormDefinitionDto?> GetFormByIdAsync(int id)
        {
            return await GetFormWithDetailsAsync(f => f.Id == id);
        }

        public async Task<FormDefinitionDto?> GetFormByCodeAsync(string code)
        {
            return await GetFormWithDetailsAsync(f => f.Code == code);
        }

        public async Task<FormDefinitionDto> CreateFormAsync(FormDefinitionDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            FormDefinitionEntity entity = dto.ToEntity();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<FormDefinitionEntity>().AddAsync(entity);
            await _unitOfWork.CompleteAsync();

            return entity.ToDto();
        }

        public async Task<FormDefinitionDto?> UpdateFormAsync(int id, FormDefinitionDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            FormDefinitionEntity? existingForm = await GetFormEntityWithDetailsAsync(f => f.Id == id);
            if (existingForm == null) return null;

            dto.Id = id;
            FormDefinitionEntity updatedFormEntity = dto.ToEntity();

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                SynchronizeFormHierarchy(existingForm, updatedFormEntity);
                await _unitOfWork.CompleteAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }

            return await GetFormWithDetailsAsync(f => f.Id == id);
        }

        public async Task<bool> DeleteFormAsync(int id)
        {
            FormDefinitionEntity? entity = await _unitOfWork.Repository<FormDefinitionEntity>().GetByIdAsync(id);
            if (entity == null) return false;

            _unitOfWork.Repository<FormDefinitionEntity>().Remove(entity);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        private static readonly HashSet<string> AllowedFormStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Draft", "Published", "Unpublished", "Archived"
        };

        public async Task<FormDefinitionDto?> UpdateFormStatusAsync(int id, string status)
        {
            if (string.IsNullOrWhiteSpace(status) || !AllowedFormStatuses.Contains(status))
            {
                throw new ArgumentException($"Invalid status '{status}'. Allowed statuses are: Draft, Published, Unpublished, Archived.");
            }

            FormDefinitionEntity? form = await _unitOfWork.Repository<FormDefinitionEntity>().GetByIdAsync(id);
            if (form == null) return null;

            form.Status = status;
            form.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<FormDefinitionEntity>().Update(form);
            await _unitOfWork.CompleteAsync();

            return await GetFormWithDetailsAsync(f => f.Id == id);
        }

        public async Task<FormDefinitionDto?> PublishFormAsync(int id)
        {
            return await UpdateFormStatusAsync(id, "Published");
        }

        public async Task<FormDefinitionDto?> UnpublishFormAsync(int id)
        {
            return await UpdateFormStatusAsync(id, "Unpublished");
        }

        public async Task<FormDefinitionDto?> DuplicateFormAsync(int id)
        {
            FormDefinitionEntity? sourceForm = await GetFormEntityWithDetailsAsync(f => f.Id == id);
            if (sourceForm == null) return null;

            int randomSuffix = Random.Shared.Next(100, 999);
            FormDefinitionEntity duplicatedForm = new FormDefinitionEntity
            {
                Name = $"{sourceForm.Name} (Copy)",
                Code = $"{sourceForm.Code}-copy-{randomSuffix}",
                Description = sourceForm.Description,
                Category = sourceForm.Category,
                Status = "Draft",
                StartDate = sourceForm.StartDate,
                EndDate = sourceForm.EndDate,
                AllowMultipleSubmissions = sourceForm.AllowMultipleSubmissions,
                AllowSaveAsDraft = sourceForm.AllowSaveAsDraft,
                ConfirmationMessage = sourceForm.ConfirmationMessage,
                SubmitButtonText = sourceForm.SubmitButtonText,
                CancelButtonText = sourceForm.CancelButtonText,
                Theme = sourceForm.Theme,
                LogoUrl = sourceForm.LogoUrl,
                HeaderText = sourceForm.HeaderText,
                FooterText = sourceForm.FooterText,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Sections = sourceForm.Sections.Select(s => new FormSectionEntity
                {
                    Title = s.Title,
                    Description = s.Description,
                    Theme = s.Theme,
                    Visibility = s.Visibility,
                    DisplayOrder = s.DisplayOrder,
                    Fields = s.Fields.Select(f => new FormFieldEntity
                    {
                        Name = f.Name,
                        Type = f.Type,
                        Label = f.Label,
                        HelperDescription = f.HelperDescription,
                        Visibility = f.Visibility,
                        Placeholder = f.Placeholder,
                        DefaultValue = f.DefaultValue,
                        Icon = f.Icon,
                        DisplayOrder = f.DisplayOrder,
                        Options = f.Options.Select(o => new FieldOptionEntity
                        {
                            Label = o.Label,
                            Value = o.Value,
                            DisplayOrder = o.DisplayOrder
                        }).ToList(),
                        Validations = f.Validations.Select(v => new FieldValidationEntity
                        {
                            Type = v.Type,
                            Value = v.Value
                        }).ToList()
                    }).ToList()
                }).ToList()
            };

            await _unitOfWork.Repository<FormDefinitionEntity>().AddAsync(duplicatedForm);
            await _unitOfWork.CompleteAsync();

            return duplicatedForm.ToDto();
        }

        private Task<FormDefinitionDto?> GetFormWithDetailsAsync(Expression<Func<FormDefinitionEntity, bool>> predicate)
        {
            return _unitOfWork.Repository<FormDefinitionEntity>().GetFirstOrDefaultAsync(
                predicate,
                form => new FormDefinitionDto
                {
                    Id = form.Id,
                    Name = form.Name,
                    Code = form.Code,
                    Description = form.Description ?? string.Empty,
                    Category = form.Category,
                    Status = form.Status,
                    StartDate = form.StartDate.HasValue ? form.StartDate.Value.ToString("yyyy-MM-dd") : null,
                    EndDate = form.EndDate.HasValue ? form.EndDate.Value.ToString("yyyy-MM-dd") : null,
                    AllowMultipleSubmissions = form.AllowMultipleSubmissions,
                    AllowSaveAsDraft = form.AllowSaveAsDraft,
                    ConfirmationMessage = form.ConfirmationMessage,
                    SubmitButtonText = form.SubmitButtonText,
                    CancelButtonText = form.CancelButtonText,
                    Theme = form.Theme,
                    LogoUrl = form.LogoUrl,
                    HeaderText = form.HeaderText,
                    FooterText = form.FooterText,
                    CreatedAt = form.CreatedAt.ToString("o"),
                    UpdatedAt = form.UpdatedAt.ToString("o"),
                    Sections = form.Sections.OrderBy(section => section.DisplayOrder).Select(section => new FormSectionDto
                    {
                        Id = section.Id,
                        Title = section.Title,
                        Description = section.Description,
                        Theme = section.Theme,
                        Visibility = section.Visibility,
                        Fields = section.Fields.OrderBy(field => field.DisplayOrder).Select(field => new FormFieldDto
                        {
                            Id = field.Id,
                            Name = field.Name,
                            Type = field.Type,
                            Label = field.Label,
                            HelperDescription = field.HelperDescription,
                            Visibility = field.Visibility,
                            Placeholder = field.Placeholder,
                            Default = field.DefaultValue,
                            Icon = field.Icon,
                            Options = field.Options.OrderBy(option => option.DisplayOrder).Select(option => new FieldOptionDto
                            {
                                Id = option.Id,
                                Label = option.Label,
                                Value = option.Value
                            }).ToList(),
                            Validations = field.Validations.Select(validation => new FieldValidationDto
                            {
                                Type = validation.Type,
                                Value = validation.Value
                            }).ToList()
                        }).ToList()
                    }).ToList()
                }
            );
        }

        private Task<List<FormDefinitionDto>> GetFormListWithDetailsAsync(Expression<Func<FormDefinitionEntity, bool>> predicate)
        {
            return _unitOfWork.Repository<FormDefinitionEntity>().GetListAsync(
                predicate,
                form => new FormDefinitionDto
                {
                    Id = form.Id,
                    Name = form.Name,
                    Code = form.Code,
                    Description = form.Description ?? string.Empty,
                    Category = form.Category,
                    Status = form.Status,
                    StartDate = form.StartDate.HasValue ? form.StartDate.Value.ToString("yyyy-MM-dd") : null,
                    EndDate = form.EndDate.HasValue ? form.EndDate.Value.ToString("yyyy-MM-dd") : null,
                    AllowMultipleSubmissions = form.AllowMultipleSubmissions,
                    AllowSaveAsDraft = form.AllowSaveAsDraft,
                    ConfirmationMessage = form.ConfirmationMessage,
                    SubmitButtonText = form.SubmitButtonText,
                    CancelButtonText = form.CancelButtonText,
                    Theme = form.Theme,
                    LogoUrl = form.LogoUrl,
                    HeaderText = form.HeaderText,
                    FooterText = form.FooterText,
                    CreatedAt = form.CreatedAt.ToString("o"),
                    UpdatedAt = form.UpdatedAt.ToString("o"),
                    Sections = form.Sections.OrderBy(section => section.DisplayOrder).Select(section => new FormSectionDto
                    {
                        Id = section.Id,
                        Title = section.Title,
                        Description = section.Description,
                        Theme = section.Theme,
                        Visibility = section.Visibility,
                        Fields = section.Fields.OrderBy(field => field.DisplayOrder).Select(field => new FormFieldDto
                        {
                            Id = field.Id,
                            Name = field.Name,
                            Type = field.Type,
                            Label = field.Label,
                            HelperDescription = field.HelperDescription,
                            Visibility = field.Visibility,
                            Placeholder = field.Placeholder,
                            Default = field.DefaultValue,
                            Icon = field.Icon,
                            Options = field.Options.OrderBy(option => option.DisplayOrder).Select(option => new FieldOptionDto
                            {
                                Id = option.Id,
                                Label = option.Label,
                                Value = option.Value
                            }).ToList(),
                            Validations = field.Validations.Select(validation => new FieldValidationDto
                            {
                                Type = validation.Type,
                                Value = validation.Value
                            }).ToList()
                        }).ToList()
                    }).ToList()
                }
            );
        }

        private Task<FormDefinitionEntity?> GetFormEntityWithDetailsAsync(Expression<Func<FormDefinitionEntity, bool>> predicate)
        {
            return _unitOfWork.Repository<FormDefinitionEntity>()
                .Query()
                .Include(f => f.Sections)
                    .ThenInclude(s => s.Fields)
                        .ThenInclude(field => field.Options)
                .Include(f => f.Sections)
                    .ThenInclude(s => s.Fields)
                        .ThenInclude(field => field.Validations)
                .FirstOrDefaultAsync(predicate);
        }

        private void SynchronizeFormHierarchy(FormDefinitionEntity existingForm, FormDefinitionEntity updatedForm)
        {
            existingForm.Name = updatedForm.Name;
            existingForm.Code = updatedForm.Code;
            existingForm.Description = updatedForm.Description;
            existingForm.Category = updatedForm.Category;
            existingForm.Status = updatedForm.Status;
            existingForm.StartDate = updatedForm.StartDate;
            existingForm.EndDate = updatedForm.EndDate;
            existingForm.AllowMultipleSubmissions = updatedForm.AllowMultipleSubmissions;
            existingForm.AllowSaveAsDraft = updatedForm.AllowSaveAsDraft;
            existingForm.ConfirmationMessage = updatedForm.ConfirmationMessage;
            existingForm.SubmitButtonText = updatedForm.SubmitButtonText;
            existingForm.CancelButtonText = updatedForm.CancelButtonText;
            existingForm.Theme = updatedForm.Theme;
            existingForm.LogoUrl = updatedForm.LogoUrl;
            existingForm.HeaderText = updatedForm.HeaderText;
            existingForm.FooterText = updatedForm.FooterText;
            existingForm.UpdatedAt = DateTime.UtcNow;

            HashSet<int> existingSectionIds = existingForm.Sections.Select(s => s.Id).ToHashSet();
            HashSet<int> updatedSectionIds = updatedForm.Sections.Where(s => existingSectionIds.Contains(s.Id)).Select(s => s.Id).ToHashSet();
            List<FormSectionEntity> removedSections = existingForm.Sections.Where(s => !updatedSectionIds.Contains(s.Id)).ToList();

            if (removedSections.Any())
            {
                _unitOfWork.Repository<FormSectionEntity>().RemoveRange(removedSections);
            }

            foreach (FormSectionEntity updatedSec in updatedForm.Sections)
            {
                FormSectionEntity? existingSec = existingForm.Sections.FirstOrDefault(s => s.Id > 0 && s.Id == updatedSec.Id);
                if (existingSec != null)
                {
                    existingSec.Title = updatedSec.Title;
                    existingSec.Description = updatedSec.Description;
                    existingSec.Theme = updatedSec.Theme;
                    existingSec.Visibility = updatedSec.Visibility;
                    existingSec.DisplayOrder = updatedSec.DisplayOrder;

                    SynchronizeFields(existingSec, updatedSec.Fields?.ToList() ?? new List<FormFieldEntity>());
                }
                else
                {
                    existingForm.Sections.Add(updatedSec);
                }
            }
        }

        private void SynchronizeFields(FormSectionEntity existingSec, List<FormFieldEntity> updatedFields)
        {
            HashSet<int> existingFieldIds = existingSec.Fields.Select(f => f.Id).ToHashSet();
            HashSet<int> updatedFieldIds = updatedFields.Where(f => existingFieldIds.Contains(f.Id)).Select(f => f.Id).ToHashSet();
            List<FormFieldEntity> removedFields = existingSec.Fields.Where(f => !updatedFieldIds.Contains(f.Id)).ToList();

            if (removedFields.Any())
            {
                _unitOfWork.Repository<FormFieldEntity>().RemoveRange(removedFields);
            }

            foreach (FormFieldEntity updatedField in updatedFields)
            {
                FormFieldEntity? existingField = existingSec.Fields.FirstOrDefault(f => f.Id > 0 && f.Id == updatedField.Id);
                if (existingField != null)
                {
                    existingField.Name = updatedField.Name;
                    existingField.Type = updatedField.Type;
                    existingField.Label = updatedField.Label;
                    existingField.HelperDescription = updatedField.HelperDescription;
                    existingField.Visibility = updatedField.Visibility;
                    existingField.Placeholder = updatedField.Placeholder;
                    existingField.DefaultValue = updatedField.DefaultValue;
                    existingField.Icon = updatedField.Icon;
                    existingField.DisplayOrder = updatedField.DisplayOrder;

                    SynchronizeOptions(existingField, updatedField.Options?.ToList() ?? new List<FieldOptionEntity>());
                    SynchronizeValidations(existingField, updatedField.Validations?.ToList() ?? new List<FieldValidationEntity>());
                }
                else
                {
                    existingSec.Fields.Add(updatedField);
                }
            }
        }

        private void SynchronizeOptions(FormFieldEntity existingField, List<FieldOptionEntity> updatedOptions)
        {
            HashSet<int> existingOptionIds = existingField.Options.Select(o => o.Id).ToHashSet();
            HashSet<int> updatedOptionIds = updatedOptions.Where(o => existingOptionIds.Contains(o.Id)).Select(o => o.Id).ToHashSet();
            List<FieldOptionEntity> removedOptions = existingField.Options.Where(o => !updatedOptionIds.Contains(o.Id)).ToList();

            if (removedOptions.Any())
            {
                _unitOfWork.Repository<FieldOptionEntity>().RemoveRange(removedOptions);
            }

            foreach (FieldOptionEntity updatedOpt in updatedOptions)
            {
                FieldOptionEntity? existingOpt = existingField.Options.FirstOrDefault(o => o.Id > 0 && o.Id == updatedOpt.Id);
                if (existingOpt != null)
                {
                    existingOpt.Label = updatedOpt.Label;
                    existingOpt.Value = updatedOpt.Value;
                    existingOpt.DisplayOrder = updatedOpt.DisplayOrder;
                }
                else
                {
                    existingField.Options.Add(updatedOpt);
                }
            }
        }

        private void SynchronizeValidations(FormFieldEntity existingField, List<FieldValidationEntity> updatedValidations)
        {
            HashSet<string> updatedValidationTypes = updatedValidations.Select(v => v.Type).ToHashSet();
            List<FieldValidationEntity> removedValidations = existingField.Validations.Where(v => !updatedValidationTypes.Contains(v.Type)).ToList();

            if (removedValidations.Any())
            {
                _unitOfWork.Repository<FieldValidationEntity>().RemoveRange(removedValidations);
            }

            foreach (FieldValidationEntity updatedVal in updatedValidations)
            {
                FieldValidationEntity? existingVal = existingField.Validations.FirstOrDefault(v => v.Type == updatedVal.Type);
                if (existingVal != null)
                {
                    existingVal.Value = updatedVal.Value;
                }
                else
                {
                    existingField.Validations.Add(updatedVal);
                }
            }
        }
    }
}