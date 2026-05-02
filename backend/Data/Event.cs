namespace Backend.Data;

public class Event
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Room { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxParticipants { get; set; }
    public bool IsPublished { get; set; } = true;
    public List<Registration> Registrations { get; set; } = new();
    public List<EventModule> Modules { get; set; } = new();
}
