using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;
using FormStudio.Domain.Entities;

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
            var entities = await _unitOfWork.Forms.GetAllAsync();
            return entities.Select(e => e.ToDto());
        }

        public async Task<FormDefinitionDto?> GetFormByIdAsync(int id)
        {
            var entity = await _unitOfWork.Forms.GetWithDetailsByIdAsync(id);
            return entity?.ToDto();
        }

        public async Task<FormDefinitionDto?> GetFormByCodeAsync(string code)
        {
            var entity = await _unitOfWork.Forms.GetWithDetailsByCodeAsync(code);
            return entity?.ToDto();
        }

        public async Task<FormDefinitionDto> CreateFormAsync(FormDefinitionDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var entity = dto.ToEntity();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Forms.AddAsync(entity);
            await _unitOfWork.CompleteAsync();

            var createdEntity = await _unitOfWork.Forms.GetWithDetailsByIdAsync(entity.Id);
            return (createdEntity ?? entity).ToDto();
        }

        public async Task<FormDefinitionDto?> UpdateFormAsync(int id, FormDefinitionDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var existingForm = await _unitOfWork.Forms.GetWithDetailsByIdAsync(id);
            if (existingForm == null) return null;

            dto.Id = id;
            var updatedFormEntity = dto.ToEntity();

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _unitOfWork.Forms.SynchronizeFormHierarchyAsync(existingForm, updatedFormEntity);
                await _unitOfWork.CompleteAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }

            var refreshed = await _unitOfWork.Forms.GetWithDetailsByIdAsync(id);
            return refreshed?.ToDto();
        }

        public async Task<bool> DeleteFormAsync(int id)
        {
            var entity = await _unitOfWork.Forms.GetByIdAsync(id);
            if (entity == null) return false;

            _unitOfWork.Forms.Delete(entity);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<FormDefinitionDto?> PublishFormAsync(int id)
        {
            var form = await _unitOfWork.Forms.GetWithDetailsByIdAsync(id);
            if (form == null) return null;

            form.Status = "Published";
            form.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Forms.Update(form);
            await _unitOfWork.CompleteAsync();

            return form.ToDto();
        }

        public async Task<FormDefinitionDto?> UnpublishFormAsync(int id)
        {
            var form = await _unitOfWork.Forms.GetWithDetailsByIdAsync(id);
            if (form == null) return null;

            form.Status = "Unpublished";
            form.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Forms.Update(form);
            await _unitOfWork.CompleteAsync();

            return form.ToDto();
        }

        public async Task<FormDefinitionDto?> DuplicateFormAsync(int id)
        {
            var sourceForm = await _unitOfWork.Forms.GetWithDetailsByIdAsync(id);
            if (sourceForm == null) return null;

            var randomSuffix = Random.Shared.Next(100, 999);
            var duplicatedForm = new FormDefinitionEntity
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

            await _unitOfWork.Forms.AddAsync(duplicatedForm);
            await _unitOfWork.CompleteAsync();

            var result = await _unitOfWork.Forms.GetWithDetailsByIdAsync(duplicatedForm.Id);
            return (result ?? duplicatedForm).ToDto();
        }
    }
}
