using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;
using FormStudio.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FormStudio.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto request)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));

            string identifier = request.UsernameOrEmail.Trim();
            UserEntity? user = await _unitOfWork.Repository<UserEntity>()
                .GetFirstOrDefaultAsync(u => u.Username == identifier || u.Email == identifier, u => u);

            if (user == null || !user.IsActive)
            {
                return null;
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return null;
            }

            int expiryHours = int.TryParse(_configuration["JwtSettings:ExpiryHours"], out int hours) ? hours : 24;
            if (request.RememberMe)
            {
                expiryHours = 24 * 7;
            }

            DateTime expiresAt = DateTime.Now.AddHours(expiryHours);
            string token = GenerateJwtToken(user, expiresAt);

            return new AuthResponseDto
            {
                Token = token,
                User = user.ToDto(),
                ExpiresAt = expiresAt
            };
        }

        public async Task<UserDto?> GetCurrentUserAsync(int userId)
        {
            UserEntity? user = await _unitOfWork.Repository<UserEntity>().GetByIdAsync(userId);
            if (user == null || !user.IsActive) return null;
            return user.ToDto();
        }

        private string GenerateJwtToken(UserEntity user, DateTime expiresAt)
        {
            string secretKey = _configuration["JwtSettings:SecretKey"] ?? "FormStudio_SuperSecretKey_2026_SecureAuthenticationKey_AtLeast32Chars!";
            string issuer = _configuration["JwtSettings:Issuer"] ?? "FormStudioBackend";
            string audience = _configuration["JwtSettings:Audience"] ?? "FormStudioFrontend";

            byte[] keyBytes = Encoding.UTF8.GetBytes(secretKey);
            SymmetricSecurityKey securityKey = new SymmetricSecurityKey(keyBytes);
            SigningCredentials credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("fullName", user.FullName)
            };

            JwtSecurityToken token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            return tokenHandler.WriteToken(token);
        }
    }
}
