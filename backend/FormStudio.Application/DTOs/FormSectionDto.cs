using FormStudio.Application.Common;

namespace FormStudio.Application.DTOs
{
    public class FormSectionDto
    {
        public int Id { get; set; }

        [RequiredTrimmed(ErrorMessage = "Section title is required.")]
        public string Title { get; set; } = string.Empty;

        [Trimmed]
        public string? Description { get; set; }

        [Trimmed]
        public string? Theme { get; set; }
        public bool Visibility { get; set; } = true;
        public int DisplayOrder { get; set; }
        public List<FormFieldDto> Fields { get; set; } = new List<FormFieldDto>();
    }
}
