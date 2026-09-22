using FormStudio.Api.Middleware;
using FormStudio.Application.Interfaces.Repositories;
using FormStudio.Application.Interfaces.Services;
using FormStudio.Application.Mappings;
using FormStudio.Application.Services;
using FormStudio.Infrastructure.Data;
using FormStudio.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// 1. Add Controllers
builder.Services.AddControllers();

// 2. Configure PostgreSQL DbContext
string? connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FormStudioDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. Register AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

// 4. Register Infrastructure & Generic Repository + Unit of Work
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// 5. Register Application Services
builder.Services.AddScoped<IFormService, FormService>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();

// 6. Configure CORS for Angular Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 7. Configure Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

WebApplication app = builder.Build();

// 8. Apply Database Migrations & Seed Sample Data on Startup
using (IServiceScope scope = app.Services.CreateScope())
{
    IServiceProvider services = scope.ServiceProvider;
    try
    {
        FormStudioDbContext context = services.GetRequiredService<FormStudioDbContext>();
        await context.Database.MigrateAsync();
        await DbInitializer.InitializeAsync(context);
    }
    catch (Exception ex)
    {
        ILogger<Program> logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing or seeding the database.");
    }
}

// 9. Configure HTTP Request Pipeline & Global Middleware
app.UseCors("AllowAngularApp");

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
