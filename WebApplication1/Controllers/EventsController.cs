using Microsoft.AspNetCore.Mvc;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Repositories;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public EventsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpPost]
    public async Task<IActionResult> Create(EventCreateDto dto)
    {
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

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _uow.Events.GetAllAsync());
}