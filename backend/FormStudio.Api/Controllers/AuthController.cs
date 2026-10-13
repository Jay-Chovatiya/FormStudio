using System.Security.Claims;
using FormStudio.Application.Common;
using FormStudio.Application.DTOs;
using FormStudio.Application.Interfaces.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FormStudio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IAntiforgery _antiforgery;
        private readonly JwtSettings _jwtSettings;

        public AuthController(
            IAuthService authService,
            IAntiforgery antiforgery,
            IOptions<JwtSettings> jwtOptions)
        {
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
            _antiforgery = antiforgery ?? throw new ArgumentNullException(nameof(antiforgery));
            _jwtSettings = jwtOptions?.Value ?? throw new ArgumentNullException(nameof(jwtOptions));
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            AuthResponseDto? response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized(new { message = "Invalid username/email or password, or account is disabled." });
            }

            SetRefreshTokenCookie(response.RefreshToken);
            SetAntiforgeryCookie();

            response.RefreshToken = string.Empty;

            return Ok(response);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            string? userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "Invalid user session." });
            }

            UserDto? user = await _authService.GetCurrentUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User account not found or disabled." });
            }

            return Ok(user);
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken()
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);

            string? refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return Unauthorized(new { message = "Refresh token is missing." });
            }

            AuthResponseDto? response = await _authService.RefreshTokenAsync(refreshToken);
            if (response == null)
            {
                DeleteRefreshTokenCookie();
                return Unauthorized(new { message = "Invalid or expired refresh token." });
            }

            SetRefreshTokenCookie(response.RefreshToken);
            SetAntiforgeryCookie();
            response.RefreshToken = string.Empty;

            return Ok(response);
        }

        [HttpPost("revoke-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RevokeToken()
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);

            string? refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                await _authService.RevokeTokenAsync(refreshToken);
            }

            DeleteRefreshTokenCookie();

            return Ok(new { message = "Token revoked successfully." });
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            CookieOptions cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/api/auth",
                Expires = DateTimeOffset.UtcNow.AddHours(_jwtSettings.RefreshTokenExpiryHours)
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }

        private void DeleteRefreshTokenCookie()
        {
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/api/auth"
            });

            Response.Cookies.Delete("XSRF-TOKEN", new CookieOptions
            {
                HttpOnly = false,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            });
        }

        private void SetAntiforgeryCookie()
        {
            AntiforgeryTokenSet tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            if (!string.IsNullOrEmpty(tokens.RequestToken))
            {
                Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken, new CookieOptions
                {
                    HttpOnly = false,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Path = "/"
                });
            }
        }
    }
}
