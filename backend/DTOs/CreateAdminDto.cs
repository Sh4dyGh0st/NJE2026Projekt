namespace Backend.DTOs;

public class CreateAdminDto
{
    public string AdminSecret { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Institution { get; set; }
}
