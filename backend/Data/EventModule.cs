namespace Backend.Data;

public class EventModule
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public string ModuleType { get; set; } = string.Empty; // "InformationPage" | "Map" | "UsefulInformation"
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public Event Event { get; set; } = null!;
}
