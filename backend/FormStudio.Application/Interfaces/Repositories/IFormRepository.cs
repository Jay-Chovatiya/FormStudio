using FormStudio.Domain.Entities;

namespace FormStudio.Application.Interfaces.Repositories
{
    public interface IFormRepository : IGenericRepository<FormDefinitionEntity>
    {
        Task<FormDefinitionEntity?> GetWithDetailsByIdAsync(int id);
        Task<FormDefinitionEntity?> GetWithDetailsByCodeAsync(string code);
        Task SynchronizeFormHierarchyAsync(FormDefinitionEntity existingForm, FormDefinitionEntity updatedForm);
    }
}
