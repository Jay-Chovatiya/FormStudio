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

        public SubmissionsController(ISubmissionService submissionService)
        {
            _submissionService = submissionService ?? throw new ArgumentNullException(nameof(submissionService));
        }

        [HttpGet]
        [Authorize(Roles = "Administrator,SuperAdministrator")]
        public async Task<ActionResult<IEnumerable<FormSubmissionDto>>> GetSubmissions(int formId)
        {
            IEnumerable<FormSubmissionDto> submissions = await _submissionService.GetSubmissionsAsync(formId);
            return Ok(submissions);
        }

        [HttpPost("~/api/forms/code/{code}/submissions")]
        [AllowAnonymous]
        [EnableRateLimiting("public-form-submission")]
        public async Task<ActionResult<FormSubmissionDto>> SubmitForm(string code, [FromBody] FormSubmissionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                FormSubmissionDto createdSubmission = await _submissionService.SaveSubmissionAsync(code, dto);
                return CreatedAtAction(nameof(GetSubmissions), new { formId = createdSubmission.FormId }, createdSubmission);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{submissionId:int}")]
        [Authorize(Roles = "Administrator,SuperAdministrator")]
        public async Task<IActionResult> DeleteSubmission(int formId, int submissionId)
        {
            bool deleted = await _submissionService.DeleteSubmissionAsync(formId, submissionId);
            if (!deleted) return NotFound(new { message = $"Submission with ID {submissionId} was not found." });
            return NoContent();
        }
    }
}
