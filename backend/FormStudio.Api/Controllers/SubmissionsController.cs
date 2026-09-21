using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormStudio.Api.Controllers
{
    [ApiController]
    [Route("api/forms/{formId:int}/[controller]")]
    public class SubmissionsController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public SubmissionsController(ISubmissionService submissionService)
        {
            _submissionService = submissionService ?? throw new ArgumentNullException(nameof(submissionService));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FormSubmissionDto>>> GetSubmissions(int formId)
        {
            IEnumerable<FormSubmissionDto> submissions = await _submissionService.GetSubmissionsAsync(formId);
            return Ok(submissions);
        }

        [HttpPost]
        public async Task<ActionResult<FormSubmissionDto>> SubmitForm(int formId, [FromBody] FormSubmissionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            FormSubmissionDto createdSubmission = await _submissionService.SaveSubmissionAsync(formId, dto);
            return CreatedAtAction(nameof(GetSubmissions), new { formId }, createdSubmission);
        }

        [HttpDelete("{submissionId:int}")]
        public async Task<IActionResult> DeleteSubmission(int formId, int submissionId)
        {
            bool deleted = await _submissionService.DeleteSubmissionAsync(formId, submissionId);
            if (!deleted) return NotFound(new { message = $"Submission with ID {submissionId} was not found." });
            return NoContent();
        }
    }
}
