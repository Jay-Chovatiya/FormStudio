using FormStudio.Application.Common;
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
        public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetUsers()
        {
            IEnumerable<UserDto> users = await _userService.GetUsersAsync();
            return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(users, "Users retrieved successfully"));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(int id)
        {
            UserDto? user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }
            return Ok(ApiResponse<UserDto>.Ok(user, "User retrieved successfully"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser([FromBody] UserUpsertDto dto)
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
            return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, ApiResponse<UserDto>.Ok(createdUser, "User created successfully", 201));
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(int id, [FromBody] UserUpsertDto dto)
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

            return Ok(ApiResponse<UserDto>.Ok(updatedUser, "User updated successfully"));
        }

        [HttpPatch("{id:int}/toggle-status")]
        public async Task<ActionResult<ApiResponse<object?>>> ToggleUserStatus(int id)
        {
            bool success = await _userService.ToggleUserStatusAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }
            return Ok(ApiResponse<object?>.Ok(null, "User status updated successfully"));
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<ApiResponse<object?>>> DeleteUser(int id)
        {
            bool success = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }
            return Ok(ApiResponse<object?>.Ok(null, "User deleted successfully"));
        }
    }
}
