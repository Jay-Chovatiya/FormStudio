using FormStudio.Domain.Entities;

namespace FormStudio.Application.Interfaces.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IFormRepository Forms { get; }
        IGenericRepository<FormSubmissionEntity> Submissions { get; }
        IGenericRepository<FormResponseEntity> Responses { get; }
        Task<int> CompleteAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
