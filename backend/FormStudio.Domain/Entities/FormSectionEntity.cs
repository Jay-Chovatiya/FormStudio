using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormStudio.Domain.Entities
{
    public class FormSectionEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int FormDefinitionId { get; set; }
        public FormDefinitionEntity? FormDefinition { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Theme { get; set; }
        public bool Visibility { get; set; } = true;
        public int DisplayOrder { get; set; }

        public ICollection<FormFieldEntity> Fields { get; set; } = new List<FormFieldEntity>();
    }
}
