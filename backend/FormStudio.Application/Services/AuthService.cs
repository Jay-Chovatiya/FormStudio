using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FormStudio.Application.Common;
using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;
using FormStudio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FormStudio.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly JwtSettings _jwtSettings;

        public AuthService(IUnitOfWork unitOfWork, IOptions<JwtSettings> jwtOptions)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _jwtSettings = jwtOptions?.Value ?? throw new ArgumentNullException(nameof(jwtOptions));
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

            int refreshTokenExpiration = request.RememberMe
                ? _jwtSettings.RefreshTokenExpiryHours * 7
                : _jwtSettings.RefreshTokenExpiryHours;

            DateTime expiresAt = DateTime.Now.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes);
            string token = GenerateJwtToken(user, expiresAt);

            string refreshToken = GenerateRefreshToken();
            string hashRefreshToken = HashRefreshToken(refreshToken);

            RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity{
                UserId = user.Id,
                TokenHash = hashRefreshToken,
                CreatedAt = DateTime.Now,
                ExpiresAt = DateTime.Now.AddHours(refreshTokenExpiration),
            };

            await _unitOfWork.Repository<RefreshTokenEntity>().AddAsync(refreshTokenEntity);
            await _unitOfWork.CompleteAsync();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
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

        public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return null;
            }

            string hashRefreshToken = HashRefreshToken(refreshToken.Trim());

            RefreshTokenEntity? tokenEntity = await _unitOfWork.Repository<RefreshTokenEntity>()
                .Query()
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.TokenHash == hashRefreshToken);

            if (tokenEntity == null)
            {
                return null;
            }

            if (tokenEntity.RevokedAt != null)
            {
                return null;
            }

            if (tokenEntity.ExpiresAt <= DateTime.Now)
            {
                return null;
            }

            if (tokenEntity.User == null || !tokenEntity.User.IsActive)
            {
                return null;
            }

            string newRefreshToken = GenerateRefreshToken();
            string newHashRefreshToken = HashRefreshToken(newRefreshToken);

            int refreshTokenExpiration = _jwtSettings.RefreshTokenExpiryHours;

            RefreshTokenEntity newRefreshTokenEntity = new RefreshTokenEntity
            {
                UserId = tokenEntity.UserId,
                TokenHash = newHashRefreshToken,
                CreatedAt = DateTime.Now,
                ExpiresAt = tokenEntity.ExpiresAt,
            };

            await _unitOfWork.Repository<RefreshTokenEntity>().AddAsync(newRefreshTokenEntity);
            await _unitOfWork.CompleteAsync();

            tokenEntity.RevokedAt = DateTime.Now;
            tokenEntity.ReplacedByTokenId = newRefreshTokenEntity.Id;
            _unitOfWork.Repository<RefreshTokenEntity>().Update(tokenEntity);

            DateTime expiresAt = DateTime.Now.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes);
            string token = GenerateJwtToken(tokenEntity.User, expiresAt);

            await _unitOfWork.CompleteAsync();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = newRefreshToken,
                User = tokenEntity.User.ToDto(),
                ExpiresAt = expiresAt
            };
        }

        public async Task<bool> RevokeTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return false;
            }

            string hashRefreshToken = HashRefreshToken(refreshToken.Trim());

            RefreshTokenEntity? tokenEntity = await _unitOfWork.Repository<RefreshTokenEntity>()
                .Query()
                .FirstOrDefaultAsync(r => r.TokenHash == hashRefreshToken);

            if (tokenEntity == null || tokenEntity.RevokedAt != null)
            {
                return false;
            }

            tokenEntity.RevokedAt = DateTime.Now;
            _unitOfWork.Repository<RefreshTokenEntity>().Update(tokenEntity);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        private string GenerateJwtToken(UserEntity user, DateTime expiresAt)
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);
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
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            return tokenHandler.WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            byte[] randomBytes = RandomNumberGenerator.GetBytes(32);

            return Convert.ToBase64String(randomBytes);
        }

        private static string HashRefreshToken(string refreshToken)
        {
            byte[] tokenBytes = Encoding.UTF8.GetBytes(refreshToken);
            byte[] hashBytes = SHA256.HashData(tokenBytes);

            return Convert.ToHexString(hashBytes);
        }
    }
}
