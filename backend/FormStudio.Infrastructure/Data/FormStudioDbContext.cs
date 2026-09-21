using FormStudio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormStudio.Infrastructure.Data
{
    public class FormStudioDbContext : DbContext
    {
        public FormStudioDbContext(DbContextOptions<FormStudioDbContext> options) : base(options)
        {
        }

        public DbSet<FormDefinitionEntity> Forms => Set<FormDefinitionEntity>();
        public DbSet<FormSectionEntity> Sections => Set<FormSectionEntity>();
        public DbSet<FormFieldEntity> Fields => Set<FormFieldEntity>();
        public DbSet<FieldOptionEntity> FieldOptions => Set<FieldOptionEntity>();
        public DbSet<FieldValidationEntity> FieldValidations => Set<FieldValidationEntity>();
        public DbSet<FormSubmissionEntity> FormSubmissions => Set<FormSubmissionEntity>();
        public DbSet<FormResponseEntity> FormResponses => Set<FormResponseEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Table Mappings
            modelBuilder.Entity<FormDefinitionEntity>().ToTable("forms");
            modelBuilder.Entity<FormSectionEntity>().ToTable("sections");
            modelBuilder.Entity<FormFieldEntity>().ToTable("fields");
            modelBuilder.Entity<FieldOptionEntity>().ToTable("field_options");
            modelBuilder.Entity<FieldValidationEntity>().ToTable("field_validations");
            modelBuilder.Entity<FormSubmissionEntity>().ToTable("form_submissions");
            modelBuilder.Entity<FormResponseEntity>().ToTable("form_responses");

            // FormDefinition Configuration
            modelBuilder.Entity<FormDefinitionEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            });

            // FormSection Configuration
            modelBuilder.Entity<FormSectionEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.HasOne(e => e.FormDefinition)
                    .WithMany(f => f.Sections)
                    .HasForeignKey(e => e.FormDefinitionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FormField Configuration
            modelBuilder.Entity<FormFieldEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Label).IsRequired().HasMaxLength(200);
                entity.HasOne(e => e.FormSection)
                    .WithMany(s => s.Fields)
                    .HasForeignKey(e => e.FormSectionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FieldOption Configuration
            modelBuilder.Entity<FieldOptionEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Label).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Value).IsRequired().HasMaxLength(200);
                entity.HasOne(e => e.FormField)
                    .WithMany(f => f.Options)
                    .HasForeignKey(e => e.FormFieldId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FieldValidation Configuration
            modelBuilder.Entity<FieldValidationEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
                entity.HasOne(e => e.FormField)
                    .WithMany(f => f.Validations)
                    .HasForeignKey(e => e.FormFieldId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FormSubmission Configuration
            modelBuilder.Entity<FormSubmissionEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.FormDefinition)
                    .WithMany(f => f.Submissions)
                    .HasForeignKey(e => e.FormId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FormResponse Configuration
            modelBuilder.Entity<FormResponseEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ValueJson).HasColumnType("text");
                entity.HasOne(e => e.FormSubmission)
                    .WithMany(s => s.Responses)
                    .HasForeignKey(e => e.FormSubmissionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
