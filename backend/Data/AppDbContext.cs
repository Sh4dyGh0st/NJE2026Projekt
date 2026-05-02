using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Event> Events { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Registration> Registrations { get; set; }
    public DbSet<News> News { get; set; }
    public DbSet<EventModule> EventModules { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.QrToken).IsUnique();

        modelBuilder.Entity<Registration>()
            .HasIndex(r => new { r.UserId, r.EventId }).IsUnique();

        modelBuilder.Entity<Registration>()
            .HasOne(r => r.Event)
            .WithMany(e => e.Registrations)
            .HasForeignKey(r => r.EventId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Registration>()
            .HasOne(r => r.User)
            .WithMany(u => u.Registrations)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EventModule>()
            .HasOne(m => m.Event)
            .WithMany(e => e.Modules)
            .HasForeignKey(m => m.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
