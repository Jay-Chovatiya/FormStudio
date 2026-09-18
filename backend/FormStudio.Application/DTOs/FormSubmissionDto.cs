namespace FormStudio.Application.DTOs
{
    public class FormSubmissionDto
    {
        public int Id { get; set; }
        public int FormId { get; set; }
        public List<FormResponseDto> Responses { get; set; } = new List<FormResponseDto>();
        public string? SubmittedAt { get; set; }
    }
}
