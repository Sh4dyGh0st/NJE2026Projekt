using Backend.Data;

namespace Backend.Repositories;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<User> Users { get; }
    IGenericRepository<Event> Events { get; }
    IGenericRepository<Registration> Registrations { get; }
    IGenericRepository<News> News { get; }
    IGenericRepository<EventModule> EventModules { get; }

    Task<int> CompleteAsync();
}
