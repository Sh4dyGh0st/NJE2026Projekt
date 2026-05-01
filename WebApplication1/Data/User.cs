using System.Text.Json.Serialization;

public class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

  
    public string Password { get; set; } = string.Empty;

    public string? Institution { get; set; }

 
    public string? QrCodeData { get; set; }

    public string Role { get; set; } = "Student";

   
    public List<Registration> Registrations { get; set; } = new();
}