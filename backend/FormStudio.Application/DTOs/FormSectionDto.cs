namespace FormStudio.Application.DTOs
{
    public class FormSectionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Theme { get; set; }
        public bool Visibility { get; set; } = true;
        public int DisplayOrder { get; set; }
        public List<FormFieldDto> Fields { get; set; } = new List<FormFieldDto>();
    }
}
