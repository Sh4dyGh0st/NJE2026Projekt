using Backend.Data;

namespace Backend.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public IGenericRepository<User> Users { get; private set; }
    public IGenericRepository<Event> Events { get; private set; }
    public IGenericRepository<Registration> Registrations { get; private set; }
    public IGenericRepository<News> News { get; private set; }
    public IGenericRepository<EventModule> EventModules { get; private set; }

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Users = new GenericRepository<User>(_context);
        Events = new GenericRepository<Event>(_context);
        Registrations = new GenericRepository<Registration>(_context);
        News = new GenericRepository<News>(_context);
        EventModules = new GenericRepository<EventModule>(_context);
    }

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
