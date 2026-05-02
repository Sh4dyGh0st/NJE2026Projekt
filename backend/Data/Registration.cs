namespace Backend.Data;

public class Registration
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int UserId { get; set; }
    public DateTime RegistrationDate { get; set; } = DateTime.Now;
    public bool IsPresent { get; set; } = false;
    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
