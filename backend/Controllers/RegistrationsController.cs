using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.DTOs;
using Backend.Repositories;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegistrationsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public RegistrationsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

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

    // GET /api/registrations
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _uow.Registrations.GetAllAsync());

    // POST /api/registrations/join
    [HttpPost("join")]
    public async Task<IActionResult> JoinEvent(RegistrationJoinDto dto)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAuth(requestingUser);
        if (authError != null) return authError;

        var targetEvent = await _uow.Events.GetByIdAsync(dto.EventId);
        if (targetEvent == null) return NotFound("Az esemény nem található!");

        var allRegs = await _uow.Registrations.GetAllAsync();

        if (allRegs.Any(r => r.UserId == dto.UserId && r.EventId == dto.EventId))
            return Conflict("Már jelentkeztél erre az eseményre!");

        var eventRegs = allRegs.Where(r => r.EventId == dto.EventId).ToList();
        if (eventRegs.Count >= targetEvent.MaxParticipants)
            return Conflict("Az esemény megtelt!");

        var reg = new Registration
        {
            UserId = dto.UserId,
            EventId = dto.EventId,
            RegistrationDate = DateTime.Now,
            IsPresent = false
        };

        await _uow.Registrations.AddAsync(reg);
        await _uow.CompleteAsync();
        return Ok(new { message = "Sikeres jelentkezés!" });
    }

    // DELETE /api/registrations/{id}  — Admin only (removes any registration)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Remove(int id)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var reg = await _uow.Registrations.GetByIdAsync(id);
        if (reg == null) return NotFound("Regisztráció nem található!");

        _uow.Registrations.Delete(reg);
        await _uow.CompleteAsync();
        return NoContent();
    }

    // DELETE /api/registrations/leave/{eventId}  — Auth; user cancels their own registration
    [HttpDelete("leave/{eventId}")]
    public async Task<IActionResult> LeaveEvent(int eventId)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAuth(requestingUser);
        if (authError != null) return authError;

        var allRegs = await _uow.Registrations.GetAllAsync();
        var reg = allRegs.FirstOrDefault(r => r.UserId == requestingUser!.Id && r.EventId == eventId);

        if (reg == null) return NotFound("Nem vagy regisztrálva erre az eseményre!");

        _uow.Registrations.Delete(reg);
        await _uow.CompleteAsync();
        return Ok(new { message = "Sikeresen leiratkoztál az eseményről." });
    }

    // POST /api/registrations/checkin
    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var allUsers = await _uow.Users.GetAllAsync();
        var user = allUsers.FirstOrDefault(u => u.QrToken == dto.QrData);

        if (user == null) return NotFound("Érvénytelen QR kód!");

        var allRegs = await _uow.Registrations.GetAllAsync();
        var existingReg = allRegs.FirstOrDefault(r => r.UserId == user.Id && r.EventId == dto.EventId);

        if (existingReg != null)
        {
            if (existingReg.IsPresent)
                return Ok(new { message = $"{user.FullName} már be van jelentkezve!", fullName = user.FullName, isPresent = true, alreadyCheckedIn = true });

            existingReg.IsPresent = true;
            await _uow.CompleteAsync();
            return Ok(new { message = $"{user.FullName} jelenléte igazolva!", fullName = user.FullName, isPresent = true });
        }

        return NotFound("A felhasználó nem regisztrált erre az eseményre!");
    }
}
