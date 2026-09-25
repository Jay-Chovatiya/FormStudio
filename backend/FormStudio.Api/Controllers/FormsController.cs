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

        public FormsController(IFormService formService)
        {
            _formService = formService ?? throw new ArgumentNullException(nameof(formService));
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

        [HttpGet("check-code")]
        public async Task<ActionResult<object>> CheckCodeUnique([FromQuery] string code, [FromQuery] int? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "Code query parameter is required." });
            }

            bool isUnique = await _formService.IsFormCodeUniqueAsync(code.Trim(), excludeId);
            return Ok(new { code = code.Trim(), isUnique });
        }

        [HttpPost]
        public async Task<ActionResult<FormDefinitionDto>> CreateForm([FromBody] FormDefinitionDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Form data is required." });

            ValidateStructureUniqueness(dto);

            if (!string.IsNullOrWhiteSpace(dto.Code) && !await _formService.IsFormCodeUniqueAsync(dto.Code, null))
            {
                ModelState.AddModelError(nameof(dto.Code), $"Form code '{dto.Code.Trim()}' is already in use.");
            }

            if (!ModelState.IsValid) return BadRequest(ModelState);

            FormDefinitionDto createdForm = await _formService.CreateFormAsync(dto);
            return CreatedAtAction(nameof(GetFormById), new { id = createdForm.Id }, createdForm);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<FormDefinitionDto>> UpdateForm(int id, [FromBody] FormDefinitionDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Form data is required." });

            ValidateStructureUniqueness(dto);

            if (!string.IsNullOrWhiteSpace(dto.Code) && !await _formService.IsFormCodeUniqueAsync(dto.Code, id))
            {
                ModelState.AddModelError(nameof(dto.Code), $"Form code '{dto.Code.Trim()}' is already in use.");
            }

            if (!ModelState.IsValid) return BadRequest(ModelState);

            FormDefinitionDto? updatedForm = await _formService.UpdateFormAsync(id, dto);
            if (updatedForm == null) return NotFound(new { message = $"Form with ID {id} was not found." });
            return Ok(updatedForm);
        }

        private void ValidateStructureUniqueness(FormDefinitionDto dto)
        {
            if (dto?.Sections == null) return;

            IEnumerable<string> duplicateTitles = dto.Sections
                .Where(s => !string.IsNullOrWhiteSpace(s.Title))
                .GroupBy(s => s.Title.Trim(), StringComparer.OrdinalIgnoreCase)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key);

            foreach (string title in duplicateTitles)
            {
                ModelState.AddModelError("Sections", $"Section title '{title}' must be unique within the form.");
            }

            List<FormFieldDto> allFields = dto.Sections
                .Where(s => s.Fields != null)
                .SelectMany(s => s.Fields)
                .ToList();

            IEnumerable<string> duplicateFieldNames = allFields
                .Where(f => !string.IsNullOrWhiteSpace(f.Name))
                .GroupBy(f => f.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key);

            foreach (string name in duplicateFieldNames)
            {
                ModelState.AddModelError("Fields", $"Field name '{name}' must be unique across the form.");
            }

            foreach (FormFieldDto field in allFields.Where(f => f.Options != null && f.Options.Any()))
            {
                IEnumerable<string> duplicateOptionValues = field.Options!
                    .Where(o => !string.IsNullOrWhiteSpace(o.Value))
                    .GroupBy(o => o.Value.Trim(), StringComparer.OrdinalIgnoreCase)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key);

                foreach (string optVal in duplicateOptionValues)
                {
                    string fieldKey = !string.IsNullOrWhiteSpace(field.Name) ? field.Name.Trim() : "Field";
                    ModelState.AddModelError($"Fields.{fieldKey}.Options", $"Option value '{optVal}' must be unique within field '{fieldKey}'.");
                }
            }
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
