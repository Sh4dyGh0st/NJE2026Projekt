using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.DTOs;
using Backend.Repositories;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public NewsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET /api/news — public; ordered by CreatedAt descending
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var allNews = await _uow.News.GetAllAsync();
        var ordered = allNews.OrderByDescending(n => n.CreatedAt).ToList();
        return Ok(ordered);
    }

    // GET /api/news/category/{category} — public; case-insensitive filter
    [HttpGet("category/{category}")]
    public async Task<IActionResult> GetByCategory(string category)
    {
        var allNews = await _uow.News.GetAllAsync();
        var filtered = allNews
            .Where(n => n.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(n => n.CreatedAt)
            .ToList();
        return Ok(filtered);
    }

    // POST /api/news — Admin only
    [HttpPost]
    public async Task<IActionResult> Create(NewsCreateDto dto)
    {
        var requestingUser = await GetRequestingUser();
        var authError = RequireAdmin(requestingUser);
        if (authError != null) return authError;

        var news = new News
        {
            Title = dto.Title,
            Content = dto.Content,
            Category = dto.Category,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.News.AddAsync(news);
        await _uow.CompleteAsync();

        return Ok(news);
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
