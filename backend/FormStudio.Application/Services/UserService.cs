using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;
using FormStudio.Domain.Entities;

namespace FormStudio.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        }

        public async Task<IEnumerable<UserDto>> GetUsersAsync()
        {
            IReadOnlyList<UserEntity> users = await _unitOfWork.Repository<UserEntity>().GetAllAsync();
            return users.OrderByDescending(u => u.CreatedAt).Select(u => u.ToDto());
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            UserEntity? user = await _unitOfWork.Repository<UserEntity>().GetByIdAsync(id);
            return user?.ToDto();
        }

        public async Task<UserDto> CreateUserAsync(UserUpsertDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                throw new ArgumentException("Password is required when creating a new user.", nameof(dto.Password));
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            UserEntity entity = new UserEntity
            {
                Username = dto.Username.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                PasswordHash = passwordHash,
                FullName = dto.FullName.Trim(),
                Role = dto.Role,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _unitOfWork.Repository<UserEntity>().AddAsync(entity);
            await _unitOfWork.CompleteAsync();

            return entity.ToDto();
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UserUpsertDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            UserEntity? user = await _unitOfWork.Repository<UserEntity>().GetByIdAsync(id);
            if (user == null) return null;

            user.Username = dto.Username.Trim();
            user.Email = dto.Email.Trim().ToLowerInvariant();
            user.FullName = dto.FullName.Trim();
            user.Role = dto.Role;
            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.Now;

            _unitOfWork.Repository<UserEntity>().Update(user);
            await _unitOfWork.CompleteAsync();

            return user.ToDto();
        }

        public async Task<bool> ToggleUserStatusAsync(int id)
        {
            UserEntity? user = await _unitOfWork.Repository<UserEntity>().GetByIdAsync(id);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.Now;

            _unitOfWork.Repository<UserEntity>().Update(user);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            UserEntity? user = await _unitOfWork.Repository<UserEntity>().GetByIdAsync(id);
            if (user == null) return false;

            _unitOfWork.Repository<UserEntity>().Remove(user);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<bool> IsUsernameUniqueAsync(string username, int? excludeId = null)
        {
            string cleanUsername = username.Trim();
            if (excludeId.HasValue)
            {
                return !await _unitOfWork.Repository<UserEntity>().ExistAsync(u => u.Id != excludeId.Value && u.Username.ToLower() == cleanUsername.ToLower());
            }
            return !await _unitOfWork.Repository<UserEntity>().ExistAsync(u => u.Username.ToLower() == cleanUsername.ToLower());
        }

        public async Task<bool> IsEmailUniqueAsync(string email, int? excludeId = null)
        {
            string cleanEmail = email.Trim().ToLowerInvariant();
            if (excludeId.HasValue)
            {
                return !await _unitOfWork.Repository<UserEntity>().ExistAsync(u => u.Id != excludeId.Value && u.Email.ToLower() == cleanEmail);
            }
            return !await _unitOfWork.Repository<UserEntity>().ExistAsync(u => u.Email.ToLower() == cleanEmail);
        }
    }
}
