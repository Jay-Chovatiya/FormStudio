namespace FormStudio.Domain.Entities
{
    public class FormResponseEntity
    {
        public int Id { get; set; }
        public int FormSubmissionId { get; set; }
        public FormSubmissionEntity? FormSubmission { get; set; }
        public int FieldId { get; set; }
        public string? ValueJson { get; set; }
    }
}
