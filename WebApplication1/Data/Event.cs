namespace WebApplication1.Data;

public class Event
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty; // Pl.: "GAMF Aula"
    public string? Room { get; set; } // Ide beírhatják a konkrét termet, ha kell
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxParticipants { get; set; }
    public bool IsPublished { get; set; }

    // Csak a regisztrációk maradnak meg
    public List<Registration> Registrations { get; set; } = new();
}