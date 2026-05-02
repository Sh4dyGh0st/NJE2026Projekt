namespace Backend.DTOs;

public class UserResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string QrToken { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
