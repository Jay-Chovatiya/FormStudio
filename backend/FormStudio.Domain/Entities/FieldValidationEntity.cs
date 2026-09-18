namespace FormStudio.Domain.Entities
{
    public class FieldValidationEntity
    {
        public int Id { get; set; }
        public int FormFieldId { get; set; }
        public FormFieldEntity? FormField { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? Value { get; set; }
    }
}
