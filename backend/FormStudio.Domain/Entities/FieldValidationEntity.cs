using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormStudio.Domain.Entities
{
    public class FieldValidationEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int FormFieldId { get; set; }
        public FormFieldEntity? FormField { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? Value { get; set; }
    }
}
