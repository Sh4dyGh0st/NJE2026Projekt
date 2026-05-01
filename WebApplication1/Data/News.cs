namespace WebApplication1.Data;

public class News
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = "GAMF"; // Itt szűrünk majd
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}