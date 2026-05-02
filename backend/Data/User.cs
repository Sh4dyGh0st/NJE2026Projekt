namespace Backend.Data;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;  // BCrypt hash
    public string? Institution { get; set; }
    public string QrToken { get; set; } = string.Empty;   // UUID v4, permanent
    public string Role { get; set; } = "User";             // "User" | "Admin"
    public List<Registration> Registrations { get; set; } = new();
}
