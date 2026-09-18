using System;
using System.Collections.Generic;

namespace FormStudio.Domain.Entities
{
    public class FormSubmissionEntity
    {
        public int Id { get; set; }
        public int FormDefinitionId { get; set; }
        public FormDefinitionEntity? FormDefinition { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public ICollection<FormResponseEntity> Responses { get; set; } = new List<FormResponseEntity>();
    }
}
