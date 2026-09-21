using System.Text.Json.Serialization;

namespace FormStudio.Application.DTOs
{
    public class FormFieldDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string? HelperDescription { get; set; }
        public bool Visibility { get; set; } = true;
        public string? Placeholder { get; set; }
        public object? Default { get; set; }
        public string? Icon { get; set; }

        [JsonPropertyName("validation")]
        public List<FieldValidationDto>? Validations { get; set; }

        [JsonPropertyName("validations")]
        public List<FieldValidationDto>? ValidationsPlural
        {
            get => Validations;
            set => Validations = value ?? Validations;
        }

        public List<FieldOptionDto>? Options { get; set; }
    }
}
