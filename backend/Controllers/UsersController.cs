using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Repositories;
using Backend.Data;
using Microsoft.Extensions.Configuration;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public UsersController(IUnitOfWork uow, IConfiguration config)
    {
        _uow = uow;
        _config = config;
    }

    // Helper: read requesting user from X-User-Id header
    private async Task<User?> GetRequestingUser()
    {
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdStr))
            return null;
        if (!int.TryParse(userIdStr, out var userId))
            return null;
        return await _uow.Users.GetByIdAsync(userId);
    }

    private IActionResult? RequireAdmin(User? user)
    {
        if (user == null) return Unauthorized("Hitelesítés szükséges.");
        if (user.Role != "Admin") return StatusCode(403, "Nincs jogosultságod.");
        return null;
    }

    private IActionResult? RequireAuth(User? user)
    {
        if (user == null) return Unauthorized("Hitelesítés szükséges.");
        return null;
    }

    // POST /api/users/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(UserRegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            return BadRequest("A jelszónak legalább 8 karakter hosszúnak kell lennie!");

        var allUsers = await _uow.Users.GetAllAsync();
        if (allUsers.Any(u => u.Email == dto.Email))
            return BadRequest("Ez az e-mail cím már foglalt!");

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Institution = dto.Institution,
            Role = "User",
            QrToken = Guid.NewGuid().ToString()
        };

        await _uow.Users.AddAsync(user);
        await _uow.CompleteAsync();

        return Ok(new { message = "Sikeres regisztráció!" });
    }

    // POST /api/users/create-admin — creates an Admin user using a secret code (no existing admin needed)
    [HttpPost("create-admin")]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
    {
        var expectedSecret = _config["AdminSecret"];
        if (string.IsNullOrEmpty(expectedSecret) || dto.AdminSecret != expectedSecret)
            return StatusCode(403, "Érvénytelen admin kód.");

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            return BadRequest("A jelszónak legalább 8 karakter hosszúnak kell lennie!");

        var allUsers = await _uow.Users.GetAllAsync();
        if (allUsers.Any(u => u.Email == dto.Email))
            return BadRequest("Ez az e-mail cím már foglalt!");

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Institution = dto.Institution,
            Role = "Admin",
            QrToken = Guid.NewGuid().ToString()
        };

        await _uow.Users.AddAsync(user);
        await _uow.CompleteAsync();

        return Ok(new { message = "Admin fiók sikeresen létrehozva!", userId = user.Id });
    }

    // POST /api/users/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var allUsers = await _uow.Users.GetAllAsync();
        var user = allUsers.FirstOrDefault(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            return Unauthorized("Hibás e-mail vagy jelszó!");

        return Ok(new { userId = user.Id, role = user.Role });
    }

    // GET /api/users/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(int id)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAuth(requestingUser);
        if (authError != null) return authError;

        var user = await _uow.Users.GetByIdAsync(id);
        if (user == null) return NotFound("Felhasználó nem található!");

        return Ok(new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Institution = user.Institution,
            QrToken = user.QrToken,
            Role = user.Role
        });
    }

    // PATCH /api/users/{id}/role
    [HttpPatch("{id}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] string newRole)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var user = await _uow.Users.GetByIdAsync(id);
        if (user == null) return NotFound("Felhasználó nem található!");

        user.Role = newRole;
        await _uow.CompleteAsync();
        return Ok(new { message = $"Sikeres szerepkör módosítás: {newRole}" });
    }

    // DELETE /api/users/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAuth(requestingUser);
        if (authError != null) return authError;

        // Only self or Admin can delete
        if (requestingUser!.Id != id && requestingUser.Role != "Admin")
            return StatusCode(403, "Nincs jogosultságod.");

        var user = await _uow.Users.GetByIdAsync(id);
        if (user == null) return NotFound("Felhasználó nem található!");

        _uow.Users.Delete(user);
        await _uow.CompleteAsync();
        return NoContent();
    }
}
