using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormStudio.Domain.Entities
{
    public class FormFieldEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int FormSectionId { get; set; }
        public FormSectionEntity? FormSection { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string? HelperDescription { get; set; }
        public bool Visibility { get; set; } = true;
        public string? Placeholder { get; set; }
        public string? DefaultValue { get; set; }
        public string? Icon { get; set; }
        public int DisplayOrder { get; set; }

        public ICollection<FieldOptionEntity> Options { get; set; } = new List<FieldOptionEntity>();
        public ICollection<FieldValidationEntity> Validations { get; set; } = new List<FieldValidationEntity>();
    }
}
