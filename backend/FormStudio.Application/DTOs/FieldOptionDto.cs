using FormStudio.Application.Common;

namespace FormStudio.Application.DTOs
{
    public class FieldOptionDto
    {
        public int Id { get; set; }

        [RequiredTrimmed(ErrorMessage = "Option label is required.")]
        public string Label { get; set; } = string.Empty;

        [RequiredTrimmed(ErrorMessage = "Option value is required.")]
        public string Value { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }
    }
}
