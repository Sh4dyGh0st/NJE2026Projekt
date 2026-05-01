using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Event> Events { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Registration> Registrations { get; set; }
   

        public DbSet<News> News { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Egyedi email cím beállítása
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

            // Itt adhatsz meg egyéb szabályokat, pl. alapértelmezett értékeket
        }
    }
}