using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using FormStudio.Application.Common;

namespace FormStudio.Application.DTOs
{
    public class FormDefinitionDto : IValidatableObject
    {
        public int Id { get; set; }

        [RequiredTrimmed(ErrorMessage = "Form name is required.")]
        public string Name { get; set; } = string.Empty;

        [RequiredTrimmed(ErrorMessage = "Form code is required.")]
        [RegularExpression(@"^[a-zA-Z][a-zA-Z0-9_]*$", ErrorMessage = "Form code must start with a letter and contain only letters, numbers, or underscores.")]
        public string Code { get; set; } = string.Empty;

        [RequiredTrimmed(ErrorMessage = "Form description is required.")]
        public string Description { get; set; } = string.Empty;

        [Trimmed]
        public string? Category { get; set; }
        public string Status { get; set; } = "Draft";

        [FutureDate(ErrorMessage = "Start date must be a future date.")]
        [JsonConverter(typeof(DateTimeJsonConverter))]
        public DateTime? StartDate { get; set; }

        [FutureDate(ErrorMessage = "End date must be a future date.")]
        [JsonConverter(typeof(DateTimeJsonConverter))]
        public DateTime? EndDate { get; set; }

        public bool? AllowMultipleSubmissions { get; set; }
        public bool? AllowSaveAsDraft { get; set; }

        [Trimmed]
        public string? ConfirmationMessage { get; set; }

        [RequiredTrimmed(ErrorMessage = "Submit button text is required.")]
        public string? SubmitButtonText { get; set; } = "Submit";

        [RequiredTrimmed(ErrorMessage = "Cancel button text is required.")]
        public string? CancelButtonText { get; set; } = "Cancel";

        [Trimmed]
        public string? Theme { get; set; }
        [Trimmed]
        public string? LogoUrl { get; set; }
        [Trimmed]
        public string? HeaderText { get; set; }
        [Trimmed]
        public string? FooterText { get; set; }
        public List<FormSectionDto> Sections { get; set; } = new List<FormSectionDto>();
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (StartDate.HasValue && EndDate.HasValue && EndDate.Value <= StartDate.Value)
            {
                yield return new ValidationResult("End date must be greater than start date.", new[] { nameof(EndDate) });
            }
        }
    }
}
