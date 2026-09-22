using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormStudio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FormsController : ControllerBase
    {
        private readonly IFormService _formService;
        private readonly ILogger<FormsController> _logger;

        public FormsController(IFormService formService, ILogger<FormsController> logger)
        {
            _formService = formService ?? throw new ArgumentNullException(nameof(formService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FormDefinitionDto>>> GetForms()
        {
            IEnumerable<FormDefinitionDto> forms = await _formService.GetFormsAsync();
            return Ok(forms);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<FormDefinitionDto>> GetFormById(int id)
        {
            FormDefinitionDto? form = await _formService.GetFormByIdAsync(id);
            if (form == null) return NotFound(new { message = $"Form with ID {id} was not found." });
            return Ok(form);
        }

        [HttpGet("code/{code}")]
        public async Task<ActionResult<FormDefinitionDto>> GetFormByCode(string code)
        {
            FormDefinitionDto? form = await _formService.GetFormByCodeAsync(code);
            if (form == null) return NotFound(new { message = $"Form with code '{code}' was not found." });
            return Ok(form);
        }

        [HttpPost]
        public async Task<ActionResult<FormDefinitionDto>> CreateForm([FromBody] FormDefinitionDto dto)
        {
            _logger.LogInformation("RECEIVED POST /api/forms PAYLOAD: {Payload}", System.Text.Json.JsonSerializer.Serialize(dto));
            if (!ModelState.IsValid) return BadRequest(ModelState);
            FormDefinitionDto createdForm = await _formService.CreateFormAsync(dto);
            _logger.LogInformation("CREATED FORM RESULT: {Result}", System.Text.Json.JsonSerializer.Serialize(createdForm));
            return CreatedAtAction(nameof(GetFormById), new { id = createdForm.Id }, createdForm);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<FormDefinitionDto>> UpdateForm(int id, [FromBody] FormDefinitionDto dto)
        {
            _logger.LogInformation("RECEIVED PUT /api/forms/{Id} PAYLOAD: {Payload}", id, System.Text.Json.JsonSerializer.Serialize(dto));
            if (!ModelState.IsValid) return BadRequest(ModelState);
            FormDefinitionDto? updatedForm = await _formService.UpdateFormAsync(id, dto);
            if (updatedForm == null) return NotFound(new { message = $"Form with ID {id} was not found." });
            _logger.LogInformation("UPDATED FORM RESULT: {Result}", System.Text.Json.JsonSerializer.Serialize(updatedForm));
            return Ok(updatedForm);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteForm(int id)
        {
            bool deleted = await _formService.DeleteFormAsync(id);
            if (!deleted) return NotFound(new { message = $"Form with ID {id} was not found." });
            return NoContent();
        }

        [HttpPatch("{id:int}/status/{status}")]
        public async Task<ActionResult<FormDefinitionDto>> UpdateFormStatus(int id, string status)
        {
            if (string.IsNullOrWhiteSpace(status)) return BadRequest(new { message = "Status parameter is required." });
            FormDefinitionDto? updatedForm = await _formService.UpdateFormStatusAsync(id, status);
            if (updatedForm == null) return NotFound(new { message = $"Form with ID {id} was not found." });
            return Ok(updatedForm);
        }

        [HttpPost("{id:int}/publish")]
        public async Task<ActionResult<FormDefinitionDto>> PublishForm(int id)
        {
            FormDefinitionDto? publishedForm = await _formService.PublishFormAsync(id);
            if (publishedForm == null) return NotFound(new { message = $"Form with ID {id} was not found." });
            return Ok(publishedForm);
        }

        [HttpPost("{id:int}/unpublish")]
        public async Task<ActionResult<FormDefinitionDto>> UnpublishForm(int id)
        {
            FormDefinitionDto? unpublishedForm = await _formService.UnpublishFormAsync(id);
            if (unpublishedForm == null) return NotFound(new { message = $"Form with ID {id} was not found." });
            return Ok(unpublishedForm);
        }

        [HttpPost("{id:int}/duplicate")]
        public async Task<ActionResult<FormDefinitionDto>> DuplicateForm(int id)
        {
            FormDefinitionDto? duplicatedForm = await _formService.DuplicateFormAsync(id);
            if (duplicatedForm == null) return NotFound(new { message = $"Form with ID {id} was not found." });
            return Ok(duplicatedForm);
        }
    }
}
