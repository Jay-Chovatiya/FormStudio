using FormStudio.Application.Common;
using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FormStudio.Api.Controllers
{
    [ApiController]
    [Route("api/forms/{formId:int}/[controller]")]
    public class SubmissionsController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;
        private readonly IFileStorageService _fileStorageService;

        public SubmissionsController(
            ISubmissionService submissionService,
            IFileStorageService fileStorageService)
        {
            _submissionService = submissionService ?? throw new ArgumentNullException(nameof(submissionService));
            _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        }

        [HttpGet]
        [Authorize(Roles = "Administrator,SuperAdministrator")]
        public async Task<ActionResult<ApiResponse<IEnumerable<FormSubmissionDto>>>> GetSubmissions(int formId)
        {
            IEnumerable<FormSubmissionDto> submissions = await _submissionService.GetSubmissionsAsync(formId);
            return Ok(ApiResponse<IEnumerable<FormSubmissionDto>>.Ok(submissions, "Submissions retrieved successfully"));
        }

        [HttpPost("~/api/forms/{code}/upload")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<object>>> UploadFile(
            [FromRoute] string code,
            [FromForm] IFormFile file,
            [FromQuery] string fieldName)
        {
            string fileUrl = await _fileStorageService.UploadFieldFileAsync(code, fieldName, file);
            return Ok(ApiResponse<object>.Ok(new { fileUrl }, "File uploaded successfully"));
        }

        [HttpGet("~/api/forms/{code}/files/{fileName}")]
        [Authorize]
        public IActionResult GetFile([FromRoute] string code, [FromRoute] string fileName)
        {
            Stream? stream = _fileStorageService.GetFile(code, fileName);
            if (stream == null)
            {
                throw new KeyNotFoundException($"The requested file '{fileName}' was not found for form '{code}'.");
            }

            return File(stream, "application/octet-stream", fileName);
        }

        [HttpPost("~/api/forms/code/{code}/submissions")]
        [AllowAnonymous]
        [EnableRateLimiting("public-form-submission")]
        public async Task<ActionResult<ApiResponse<FormSubmissionDto>>> SubmitForm(string code, [FromBody] FormSubmissionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            FormSubmissionDto createdSubmission = await _submissionService.SaveSubmissionAsync(code, dto);
            return CreatedAtAction(nameof(GetSubmissions), new { formId = createdSubmission.FormId }, ApiResponse<FormSubmissionDto>.Ok(createdSubmission, "Form submitted successfully", 201));
        }

        [HttpDelete("{submissionId:int}")]
        [Authorize(Roles = "Administrator,SuperAdministrator")]
        public async Task<ActionResult<ApiResponse<object?>>> DeleteSubmission(int formId, int submissionId)
        {
            bool deleted = await _submissionService.DeleteSubmissionAsync(formId, submissionId);
            if (!deleted) return NotFound(new { message = $"Submission with ID {submissionId} was not found." });
            return Ok(ApiResponse<object?>.Ok(null, "Submission deleted successfully"));
        }
    }
}
