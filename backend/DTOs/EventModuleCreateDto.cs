namespace Backend.DTOs;

public class EventModuleCreateDto
{
    public string ModuleType { get; set; } = string.Empty; // "InformationPage" | "Map" | "UsefulInformation"
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
}
