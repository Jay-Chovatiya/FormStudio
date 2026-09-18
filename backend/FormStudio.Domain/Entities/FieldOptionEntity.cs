namespace FormStudio.Domain.Entities
{
    public class FieldOptionEntity
    {
        public int Id { get; set; }
        public int FormFieldId { get; set; }
        public FormFieldEntity? FormField { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }
}
