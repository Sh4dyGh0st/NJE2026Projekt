using Microsoft.AspNetCore.Mvc;
using WebApplication1.DTOs;
using WebApplication1.Repositories;

[ApiController]
[Route("api/[controller]")]
public class RegistrationsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public RegistrationsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _uow.Registrations.GetAllAsync());

    [HttpPost("join")]
    public async Task<IActionResult> JoinEvent(RegistrationJoinDto dto)
    {
        var targetEvent = await _uow.Events.GetByIdAsync(dto.EventId);
        if (targetEvent == null) return NotFound("Az esemény nem található!");

        var allRegs = await _uow.Registrations.GetAllAsync();
        if (allRegs.Any(r => r.UserId == dto.UserId && r.EventId == dto.EventId))
        {
            return BadRequest("Már jelentkeztél erre az eseményre!");
        }

        var reg = new Registration
        {
            UserId = dto.UserId,
            EventId = dto.EventId,
            RegistrationDate = DateTime.Now,
            IsPresent = false
        };

        await _uow.Registrations.AddAsync(reg);
        await _uow.CompleteAsync();
        return Ok(new { Message = "Sikeres jelentkezés!" });
    }

    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn(string qrData, int eventId)
    {
        var allUsers = await _uow.Users.GetAllAsync();
        var user = allUsers.FirstOrDefault(u => u.QrCodeData == qrData);

        if (user == null) return NotFound("Érvénytelen QR kód!");

        var allRegs = await _uow.Registrations.GetAllAsync();
        var existingReg = allRegs.FirstOrDefault(r => r.UserId == user.Id && r.EventId == eventId);

        if (existingReg != null)
        {
            existingReg.IsPresent = true;
            await _uow.CompleteAsync();
            return Ok($"{user.FullName} jelenléte igazolva!");
        }

        var newReg = new Registration
        {
            UserId = user.Id,
            EventId = eventId,
            IsPresent = true,
            RegistrationDate = DateTime.Now
        };

        await _uow.Registrations.AddAsync(newReg);
        await _uow.CompleteAsync();

        return Ok($"{user.FullName} regisztrálva és beléptetve!");
    }
}