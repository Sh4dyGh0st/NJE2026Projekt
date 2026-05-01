using Microsoft.AspNetCore.Mvc;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Repositories;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public NewsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _uow.News.GetAllAsync());

    [HttpGet("category/{category}")]
    public async Task<IActionResult> GetByCategory(string category)
    {
        var allNews = await _uow.News.GetAllAsync();
        var filtered = allNews.Where(n => n.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        return Ok(filtered);
    }

    [HttpPost]
    public async Task<IActionResult> Create(NewsCreateDto dto)
    {
        var news = new News
        {
            Title = dto.Title,
            Content = dto.Content,
            Category = dto.Category,
            CreatedAt = DateTime.Now // Itt adjuk meg a szerveridőt
        };

        await _uow.News.AddAsync(news);
        await _uow.CompleteAsync();

        return Ok(news);
    }
}