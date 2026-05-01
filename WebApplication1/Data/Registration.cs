public class Registration
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int UserId { get; set; }
    public DateTime RegistrationDate { get; set; } = DateTime.Now;
    public bool IsPresent { get; set; } = false; // Ezt állítjuk 'true'-ra a QR beolvasáskor
}