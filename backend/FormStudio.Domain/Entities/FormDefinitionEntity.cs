using System;
using System.Collections.Generic;

namespace FormStudio.Domain.Entities
{
    public class FormDefinitionEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public string Status { get; set; } = "Draft";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool AllowMultipleSubmissions { get; set; } = true;
        public bool AllowSaveAsDraft { get; set; } = true;
        public string? ConfirmationMessage { get; set; }
        public string? SubmitButtonText { get; set; }
        public string? CancelButtonText { get; set; }
        public string? Theme { get; set; }
        public string? LogoUrl { get; set; }
        public string? HeaderText { get; set; }
        public string? FooterText { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<FormSectionEntity> Sections { get; set; } = new List<FormSectionEntity>();
        public ICollection<FormSubmissionEntity> Submissions { get; set; } = new List<FormSubmissionEntity>();
    }
}
