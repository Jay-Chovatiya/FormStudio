using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using FormStudio.Application.Common;

namespace FormStudio.Application.DTOs
{
    public class FormFieldDto : IValidatableObject
    {
        public int Id { get; set; }

        [RequiredTrimmed(ErrorMessage = "Field name is required.")]
        [RegularExpression(@"^[a-zA-Z][a-zA-Z0-9_]*$", ErrorMessage = "Field name must start with a letter and contain only letters, numbers, or underscores.")]
        public string Name { get; set; } = string.Empty;

        [RequiredTrimmed(ErrorMessage = "Field type is required.")]
        public string Type { get; set; } = string.Empty;

        [RequiredTrimmed(ErrorMessage = "Field label is required.")]
        public string Label { get; set; } = string.Empty;

        [Trimmed]
        public string? HelperDescription { get; set; }
        public bool Visibility { get; set; } = true;

        [Trimmed]
        public string? Placeholder { get; set; }

        [Trimmed]
        [JsonConverter(typeof(StringJsonConverter))]
        public string? Default { get; set; }

        [Trimmed]
        public string? Icon { get; set; }
        public int DisplayOrder { get; set; }

        [JsonPropertyName("validations")]
        public List<FieldValidationDto>? Validations { get; set; }

        public List<FieldOptionDto>? Options { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Validations == null || string.IsNullOrWhiteSpace(Default)) yield break;

            string trimmedDefault = Default.Trim();
            string fieldDisplayName = !string.IsNullOrWhiteSpace(Label) ? Label.Trim() : Name?.Trim() ?? "Field";

            // minValue validation
            FieldValidationDto? minVal = Validations.FirstOrDefault(v => string.Equals(v.Type, "minValue", StringComparison.OrdinalIgnoreCase));
            if (minVal?.Value != null && double.TryParse(minVal.Value.ToString(), out double minNum))
            {
                if (double.TryParse(trimmedDefault, out double defNum) && defNum < minNum)
                {
                    yield return new ValidationResult($"Default value '{trimmedDefault}' for field '{fieldDisplayName}' cannot be less than minimum value {minNum}.", new[] { nameof(Default) });
                }
            }

            // maxValue validation
            FieldValidationDto? maxVal = Validations.FirstOrDefault(v => string.Equals(v.Type, "maxValue", StringComparison.OrdinalIgnoreCase));
            if (maxVal?.Value != null && double.TryParse(maxVal.Value.ToString(), out double maxNum))
            {
                if (double.TryParse(trimmedDefault, out double defNum) && defNum > maxNum)
                {
                    yield return new ValidationResult($"Default value '{trimmedDefault}' for field '{fieldDisplayName}' cannot be greater than maximum value {maxNum}.", new[] { nameof(Default) });
                }
            }

            // minLength validation
            FieldValidationDto? minLen = Validations.FirstOrDefault(v => string.Equals(v.Type, "minLength", StringComparison.OrdinalIgnoreCase));
            if (minLen?.Value != null && int.TryParse(minLen.Value.ToString(), out int minLenInt))
            {
                if (trimmedDefault.Length < minLenInt)
                {
                    yield return new ValidationResult($"Default value for field '{fieldDisplayName}' must have a minimum length of {minLenInt} characters.", new[] { nameof(Default) });
                }
            }

            // maxLength validation
            FieldValidationDto? maxLen = Validations.FirstOrDefault(v => string.Equals(v.Type, "maxLength", StringComparison.OrdinalIgnoreCase));
            if (maxLen?.Value != null && int.TryParse(maxLen.Value.ToString(), out int maxLenInt))
            {
                if (trimmedDefault.Length > maxLenInt)
                {
                    yield return new ValidationResult($"Default value for field '{fieldDisplayName}' cannot exceed maximum length of {maxLenInt} characters.", new[] { nameof(Default) });
                }
            }
        }
    }
}
