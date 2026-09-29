using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormStudio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdministrator")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            IEnumerable<UserDto> users = await _userService.GetUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserDto>> GetUserById(int id)
        {
            UserDto? user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }
            return Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] UserUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                ModelState.AddModelError(nameof(dto.Password), "Password is required when creating a new user.");
                return BadRequest(ModelState);
            }

            bool isUsernameUnique = await _userService.IsUsernameUniqueAsync(dto.Username);
            if (!isUsernameUnique)
            {
                ModelState.AddModelError(nameof(dto.Username), $"Username '{dto.Username}' is already taken.");
                return BadRequest(ModelState);
            }

            bool isEmailUnique = await _userService.IsEmailUniqueAsync(dto.Email);
            if (!isEmailUnique)
            {
                ModelState.AddModelError(nameof(dto.Email), $"Email '{dto.Email}' is already registered.");
                return BadRequest(ModelState);
            }

            UserDto createdUser = await _userService.CreateUserAsync(dto);
            return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, createdUser);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UserUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            bool isUsernameUnique = await _userService.IsUsernameUniqueAsync(dto.Username, id);
            if (!isUsernameUnique)
            {
                ModelState.AddModelError(nameof(dto.Username), $"Username '{dto.Username}' is already taken.");
                return BadRequest(ModelState);
            }

            bool isEmailUnique = await _userService.IsEmailUniqueAsync(dto.Email, id);
            if (!isEmailUnique)
            {
                ModelState.AddModelError(nameof(dto.Email), $"Email '{dto.Email}' is already registered.");
                return BadRequest(ModelState);
            }

            UserDto? updatedUser = await _userService.UpdateUserAsync(id, dto);
            if (updatedUser == null)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            return Ok(updatedUser);
        }

        [HttpPatch("{id:int}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            bool success = await _userService.ToggleUserStatusAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            bool success = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }
            return NoContent();
        }
    }
}
