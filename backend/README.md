# FormStudio - ASP.NET Core Web API Backend (.NET 9 + PostgreSQL)

A clean, production-ready **ASP.NET Core Web API** backend with **PostgreSQL**, built for the **FormStudio Dynamic Form Builder** Angular application.

---

## Architecture Overview

Built using a clean 4-layer architecture with single transitive dependencies:

```text
FormStudio.sln
├── 1. FormStudio.Domain/        # Domain Entities (No external dependencies)
├── 2. FormStudio.Application/   # DTOs, Repository Interfaces, AutoMapper Profiles & Services
├── 3. FormStudio.Infrastructure/  # DbContext, Generic Repository, Unit of Work, Seeding & Migrations
└── 4. FormStudio.Api/           # REST API Controllers, Exception Middleware & Program.cs Startup
```

### Dependency Flow:
`FormStudio.Api` $\rightarrow$ `FormStudio.Infrastructure` $\rightarrow$ `FormStudio.Application` $\rightarrow$ `FormStudio.Domain`

---

## Tech Stack & Design Patterns

- **Framework**: .NET 9.0 (ASP.NET Core Web API)
- **Database**: PostgreSQL (Entity Framework Core 9.0 with `Npgsql.EntityFrameworkCore.PostgreSQL`)
- **Mapping**: AutoMapper 13.0.1
- **Patterns**:
  - **Generic Repository Pattern** (`IGenericRepository<T>`, `GenericRepository<T>`)
  - **Unit of Work Pattern** (`IUnitOfWork`, `UnitOfWork`) via IoC container resolution
  - **Direct LINQ Selector Projection** (avoiding over-fetching database records)
  - **Hierarchical Entity Sync** (transactional update synchronization for nested child collections)

---

## Form Status Lifecycle

Form status is managed dynamically supporting 4 states:
- `Draft`
- `Published`
- `Unpublished`
- `Archived`

---

## API Endpoints Reference

### Forms (`/api/forms`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/forms` | Get all form definitions |
| `GET` | `/api/forms/{id}` | Get form by ID |
| `GET` | `/api/forms/code/{code}` | Get form by unique code |
| `POST` | `/api/forms` | Create a new form definition |
| `PUT` | `/api/forms/{id}` | Update existing form & hierarchy |
| `DELETE` | `/api/forms/{id}` | Delete form definition |
| `PATCH` | `/api/forms/{id}/status` | Update form status (`Draft`, `Published`, `Unpublished`, `Archived`) |
| `POST` | `/api/forms/{id}/publish` | Publish form (`Status = Published`) |
| `POST` | `/api/forms/{id}/unpublish` | Unpublish form (`Status = Unpublished`) |
| `POST` | `/api/forms/{id}/duplicate` | Duplicate form definition |

### Submissions (`/api/forms/{formId}/submissions`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/forms/{formId}/submissions` | Get all submissions for a form |
| `POST` | `/api/forms/{formId}/submissions` | Submit form responses |
| `DELETE` | `/api/forms/{formId}/submissions/{submissionId}` | Delete a submission |

---

## Configuration & Database Setup

### Connection String (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=FormStudioDb;Username=postgres;Password=postgres;"
  }
}
```

### Running the API
```bash
cd backend
dotnet run --project FormStudio.Api
```

On application startup, EF Core automatically:
1. Applies pending PostgreSQL migrations (`context.Database.MigrateAsync()`).
2. Seeds sample form definitions and submissions (`DbInitializer.InitializeAsync()`).

### Swagger Documentation
Access Swagger UI at: `https://localhost:5001/swagger` or `http://localhost:5000/swagger`
