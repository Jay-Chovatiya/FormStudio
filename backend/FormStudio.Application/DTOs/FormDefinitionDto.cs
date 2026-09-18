namespace FormStudio.Application.DTOs
{
    public class FormDefinitionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string Status { get; set; } = "Draft";
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public bool? AllowMultipleSubmissions { get; set; }
        public bool? AllowSaveAsDraft { get; set; }
        public string? ConfirmationMessage { get; set; }
        public string? SubmitButtonText { get; set; }
        public string? CancelButtonText { get; set; }
        public string? Theme { get; set; }
        public string? LogoUrl { get; set; }
        public string? HeaderText { get; set; }
        public string? FooterText { get; set; }
        public List<FormSectionDto> Sections { get; set; } = new List<FormSectionDto>();
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }
    }
}
