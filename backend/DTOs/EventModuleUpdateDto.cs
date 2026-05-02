namespace Backend.DTOs;

public class EventModuleUpdateDto
{
    public string ModuleType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
}
