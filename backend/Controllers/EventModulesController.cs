using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.DTOs;
using Backend.Repositories;

namespace Backend.Controllers;

[ApiController]
[Route("api/events/{eventId}/modules")]
public class EventModulesController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public EventModulesController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET /api/events/{eventId}/modules — public
    // Returns all modules for the event ordered by SortOrder
    // Returns 404 if event does not exist
    [HttpGet]
    public async Task<IActionResult> GetAll(int eventId)
    {
        var ev = await _uow.Events.GetByIdAsync(eventId);
        if (ev == null)
            return NotFound("Az esemény nem található!");

        var allModules = await _uow.EventModules.GetAllAsync();
        var modules = allModules
            .Where(m => m.EventId == eventId)
            .OrderBy(m => m.SortOrder)
            .ToList();

        return Ok(modules);
    }

    // POST /api/events/{eventId}/modules — Admin only
    // Creates a module linked to eventId
    // Returns created module
    [HttpPost]
    public async Task<IActionResult> Create(int eventId, EventModuleCreateDto dto)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var ev = await _uow.Events.GetByIdAsync(eventId);
        if (ev == null)
            return NotFound("Az esemény nem található!");

        var module = new EventModule
        {
            EventId = eventId,
            ModuleType = dto.ModuleType,
            Title = dto.Title,
            Content = dto.Content,
            SortOrder = dto.SortOrder
        };

        await _uow.EventModules.AddAsync(module);
        await _uow.CompleteAsync();

        return Ok(module);
    }

    // PUT /api/events/{eventId}/modules/{moduleId} — Admin only
    // Updates module fields; returns updated module; 404 if not found
    [HttpPut("{moduleId}")]
    public async Task<IActionResult> Update(int eventId, int moduleId, EventModuleUpdateDto dto)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var module = await _uow.EventModules.GetByIdAsync(moduleId);
        if (module == null || module.EventId != eventId)
            return NotFound("A modul nem található!");

        module.ModuleType = dto.ModuleType;
        module.Title = dto.Title;
        module.Content = dto.Content;
        module.SortOrder = dto.SortOrder;

        await _uow.CompleteAsync();

        return Ok(module);
    }

    // DELETE /api/events/{eventId}/modules/{moduleId} — Admin only
    // Deletes module; returns 204; 404 if not found
    [HttpDelete("{moduleId}")]
    public async Task<IActionResult> Delete(int eventId, int moduleId)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var module = await _uow.EventModules.GetByIdAsync(moduleId);
        if (module == null || module.EventId != eventId)
            return NotFound("A modul nem található!");

        _uow.EventModules.Delete(module);
        await _uow.CompleteAsync();

        return NoContent();
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
}
