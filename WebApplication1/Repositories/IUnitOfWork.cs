using WebApplication1.Data;

namespace WebApplication1.Repositories;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<User> Users { get; }
    IGenericRepository<Event> Events { get; }
    IGenericRepository<Registration> Registrations { get; }
    IGenericRepository<News> News { get; }

    Task<int> CompleteAsync(); // Ez az egyetlen hely, ahol a SaveChanges fut
}