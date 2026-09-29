using FormStudio.Application.DTOs;

namespace FormStudio.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto request);
        Task<UserDto?> GetCurrentUserAsync(int userId);
    }
}
