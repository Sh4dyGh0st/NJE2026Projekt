using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.DTOs;
using Backend.Repositories;

namespace Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public EventsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET /api/events — public; only published events, ordered by StartDate asc
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var events = await _uow.Events.GetAllAsync();
        var allRegs = await _uow.Registrations.GetAllAsync();

        var published = events
            .Where(e => e.IsPublished)
            .OrderBy(e => e.StartDate)
            .Select(e => ToDto(e, allRegs.Count(r => r.EventId == e.Id)))
            .ToList();
        return Ok(published);
    }

    // GET /api/events/{id} — public; single event or 404
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ev = await _uow.Events.GetByIdAsync(id);
        if (ev == null)
            return NotFound("Az esemény nem található!");

        var allRegs = await _uow.Registrations.GetAllAsync();
        var count = allRegs.Count(r => r.EventId == id);
        return Ok(ToDto(ev, count));
    }

    // POST /api/events — Admin only
    [HttpPost]
    public async Task<IActionResult> Create(EventCreateDto dto)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest("Az esemény neve kötelező!");

        if (dto.EndDate <= dto.StartDate)
            return BadRequest("A befejezés dátumának a kezdés dátuma után kell lennie!");

        var newEvent = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            Room = dto.Room,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MaxParticipants = dto.MaxParticipants,
            IsPublished = true
        };

        await _uow.Events.AddAsync(newEvent);
        await _uow.CompleteAsync();

        return Ok(newEvent);
    }

    // PUT /api/events/{id} — Admin only
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, EventUpdateDto dto)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var ev = await _uow.Events.GetByIdAsync(id);
        if (ev == null)
            return NotFound("Az esemény nem található!");

        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest("Az esemény neve kötelező!");

        if (dto.EndDate <= dto.StartDate)
            return BadRequest("A befejezés dátumának a kezdés dátuma után kell lennie!");

        ev.Title = dto.Title;
        ev.Description = dto.Description;
        ev.Location = dto.Location;
        ev.Room = dto.Room;
        ev.StartDate = dto.StartDate;
        ev.EndDate = dto.EndDate;
        ev.MaxParticipants = dto.MaxParticipants;
        ev.IsPublished = dto.IsPublished;

        await _uow.CompleteAsync();

        return Ok(ev);
    }

    // DELETE /api/events/{id} — Admin only; 409 if registrations exist
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var ev = await _uow.Events.GetByIdAsync(id);
        if (ev == null)
            return NotFound("Az esemény nem található!");

        var allRegs = await _uow.Registrations.GetAllAsync();
        var eventRegs = allRegs.Where(r => r.EventId == id).ToList();
        if (eventRegs.Count > 0)
            return Conflict("Az esemény nem törölhető, mert vannak regisztrált résztvevők!");

        _uow.Events.Delete(ev);
        await _uow.CompleteAsync();

        return NoContent();
    }

    // GET /api/events/{id}/participants — Admin only
    [HttpGet("{id}/participants")]
    public async Task<IActionResult> GetParticipants(int id)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var ev = await _uow.Events.GetByIdAsync(id);
        if (ev == null)
            return NotFound("Az esemény nem található!");

        var allRegs = await _uow.Registrations.GetAllAsync();
        var allUsers = await _uow.Users.GetAllAsync();
        var participants = allRegs
            .Where(r => r.EventId == id)
            .Join(allUsers, r => r.UserId, u => u.Id, (r, u) => new
            {
                fullName = u.FullName,
                email = u.Email,
                registrationDate = r.RegistrationDate,
                isPresent = r.IsPresent
            }).ToList();

        return Ok(participants);
    }

    // --- Helpers ---

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

    private static EventResponseDto ToDto(Event ev, int registrationCount) => new()
    {
        Id = ev.Id,
        Title = ev.Title,
        Description = ev.Description,
        Location = ev.Location,
        Room = ev.Room,
        StartDate = ev.StartDate,
        EndDate = ev.EndDate,
        MaxParticipants = ev.MaxParticipants,
        IsPublished = ev.IsPublished,
        RegistrationCount = registrationCount
    };
}
