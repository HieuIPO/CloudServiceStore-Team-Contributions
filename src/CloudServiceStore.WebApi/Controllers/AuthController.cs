using System.Security.Claims;
using CloudServiceStore.Application.Auth;
using CloudServiceStore.Application.Auth.Abstractions;
using CloudServiceStore.Application.Auth.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(IAuthService authService, IWebHostEnvironment environment) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.RegisterAsync(request, GetIpAddress(), cancellationToken);
            SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
            return Ok(new AuthResponse(result.AccessToken, result.AccessTokenExpiresAt, result.User));
        }
        catch (RegistrationValidationException exception)
        {
            return ValidationProblem(new ValidationProblemDetails(exception.Errors.ToDictionary(pair => pair.Key, pair => pair.Value)));
        }
        catch (RegistrationConflictException)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Email already registered");
        }
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]> { ["credentials"] = ["Email and password are required."] }));

        try
        {
            var result = await authService.LoginAsync(request, GetIpAddress(), cancellationToken);
            SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
            return Ok(new AuthResponse(result.AccessToken, result.AccessTokenExpiresAt, result.User));
        }
        catch (AuthenticationFailedException)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Authentication failed");
        }
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Refresh token is missing");

        try
        {
            var result = await authService.RefreshAsync(refreshToken, GetIpAddress(), cancellationToken);
            SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
            return Ok(new AuthResponse(result.AccessToken, result.AccessTokenExpiresAt, result.User));
        }
        catch (RefreshTokenReuseException)
        {
            DeleteRefreshTokenCookie();
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Refresh token reuse detected");
        }
        catch (AuthenticationFailedException)
        {
            DeleteRefreshTokenCookie();
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Refresh token is invalid or expired");
        }
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        if (Request.Cookies.TryGetValue("refresh_token", out var refreshToken) && !string.IsNullOrWhiteSpace(refreshToken))
            await authService.LogoutAsync(refreshToken, GetIpAddress(), cancellationToken);

        DeleteRefreshTokenCookie();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<AuthenticatedUserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthenticatedUserDto>> Me(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId)) return Unauthorized();

        var user = await authService.GetCurrentUserAsync(userId, cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    [Authorize]
    [HttpPut("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId)) return Unauthorized();

        try
        {
            await authService.ChangePasswordAsync(userId, request, GetIpAddress(), cancellationToken);
            DeleteRefreshTokenCookie();
            return NoContent();
        }
        catch (PasswordValidationException exception)
        {
            return ValidationProblem(new ValidationProblemDetails(
                exception.Errors.ToDictionary(pair => pair.Key, pair => pair.Value)));
        }
        catch (CurrentPasswordInvalidException)
        {
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["currentPassword"] = ["Current password is invalid."]
            }));
        }
        catch (AuthenticationFailedException)
        {
            return Unauthorized();
        }
    }

    [Authorize]
    [HttpPut("profile")]
    [ProducesResponseType<AuthenticatedUserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthenticatedUserDto>> UpdateProfile(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId)) return Unauthorized();

        try
        {
            return Ok(await authService.UpdateProfileAsync(userId, request, GetIpAddress(), cancellationToken));
        }
        catch (ProfileValidationException exception)
        {
            return ValidationProblem(new ValidationProblemDetails(
                exception.Errors.ToDictionary(pair => pair.Key, pair => pair.Value)));
        }
        catch (AuthenticationFailedException)
        {
            return Unauthorized();
        }
    }

    private void SetRefreshTokenCookie(string token, DateTimeOffset expiresAt) => Response.Cookies.Append("refresh_token", token, new CookieOptions
    {
        HttpOnly = true,
        Secure = !environment.IsDevelopment(),
        SameSite = SameSiteMode.Strict,
        Expires = expiresAt,
        Path = "/api/v1/auth"
    });

    private void DeleteRefreshTokenCookie() => Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/api/v1/auth" });

    private string? GetIpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
