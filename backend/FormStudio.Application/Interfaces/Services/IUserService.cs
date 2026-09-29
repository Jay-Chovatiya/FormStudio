using FormStudio.Application.DTOs;

namespace FormStudio.Application.Interfaces.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto> CreateUserAsync(UserUpsertDto dto);
        Task<UserDto?> UpdateUserAsync(int id, UserUpsertDto dto);
        Task<bool> ToggleUserStatusAsync(int id);
        Task<bool> DeleteUserAsync(int id);
        Task<bool> IsUsernameUniqueAsync(string username, int? excludeId = null);
        Task<bool> IsEmailUniqueAsync(string email, int? excludeId = null);
    }
}
