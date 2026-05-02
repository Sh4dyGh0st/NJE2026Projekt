namespace Backend.DTOs;

public class UserRegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string Role { get; set; } = "User";
}
