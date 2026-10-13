using FormStudio.Application.DTOs;

namespace FormStudio.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto request);
        Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeTokenAsync(string refreshToken);
        Task<UserDto?> GetCurrentUserAsync(int userId);
    }
}
