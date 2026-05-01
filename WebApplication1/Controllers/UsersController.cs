using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApplication1.DTOs;
using WebApplication1.Repositories;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
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

        // 1. REGISZTRÁCIÓ 
        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto dto)
        {
            // Ellenőrizzük, létezik-e már az email
            var allUsers = await _uow.Users.GetAllAsync();
            if (allUsers.Any(u => u.Email == dto.Email))
                return BadRequest("Ez az e-mail cím már foglalt!");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password), // Biztonságos jelszókezelés
                Institution = dto.Institution,
                Role = "Student", // Alapértelmezett szerepkör
                QrCodeData = Guid.NewGuid().ToString() // Egyedi azonosító a QR kódhoz
            };

            await _uow.Users.AddAsync(user);
            await _uow.CompleteAsync();

            return Ok(new { message = "Sikeres regisztráció!" });
        }

        // 2. BEJELENTKEZÉS (JWT generálással)
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var allUsers = await _uow.Users.GetAllAsync();
            var user = allUsers.FirstOrDefault(u => u.Email == dto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
                return Unauthorized("Hibás e-mail vagy jelszó!");

            var token = GenerateJwtToken(user);
            return Ok(new { Token = token, Role = user.Role, UserId = user.Id });
        }

        // 3. PROFIL LEKÉRÉS (Személyes QR kód megjelenítéséhez)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(int id)
        {
            var user = await _uow.Users.GetByIdAsync(id);
            if (user == null) return NotFound("Felhasználó nem található!");

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Institution = user.Institution,
                QrCodeData = user.QrCodeData,
                Role = user.Role
            });
        }

        // 4. SZEREPKÖR MÓDOSÍTÁS (Csak Adminoknak vagy teszteléshez)
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] string newRole)
        {
            var user = await _uow.Users.GetByIdAsync(id);
            if (user == null) return NotFound();

            user.Role = newRole;
            await _uow.CompleteAsync();
            return Ok(new { message = $"Sikeres szerepkör módosítás: {newRole}" });
        }

        // JWT Generátor segédmetódus
        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}