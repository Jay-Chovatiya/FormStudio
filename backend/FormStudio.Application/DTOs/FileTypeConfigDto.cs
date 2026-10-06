using System.ComponentModel.DataAnnotations;
using FormStudio.Application.Common;

namespace FormStudio.Application.DTOs
{
    public class FileTypeConfigDto
    {
        [RequiredTrimmed(ErrorMessage = "File extension is required.")]
        [RegularExpression(@"^\.[a-zA-Z0-9]+$", ErrorMessage = "File extension must start with a dot followed by alphanumeric characters (e.g. '.pdf', '.png').")]
        public string Extension { get; set; } = string.Empty;

        [RequiredTrimmed(ErrorMessage = "MIME type is required.")]
        [RegularExpression(@"^[a-zA-Z0-9!#$&^_\.\+-]+/[a-zA-Z0-9!#$&^_\.\+-]+$", ErrorMessage = "MIME type must be in a valid format (e.g. 'application/pdf', 'image/png').")]
        public string MimeType { get; set; } = string.Empty;
    }
}
