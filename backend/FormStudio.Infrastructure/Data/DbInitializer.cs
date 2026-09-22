using FormStudio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormStudio.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(FormStudioDbContext context)
        {
            if (await context.Forms.AnyAsync(f => f.Code == "emp-feedback-2026"))
            {
                return; 
            }

            List<FormDefinitionEntity> sampleForms = new List<FormDefinitionEntity>
            {
                new FormDefinitionEntity
                {
                    Name = "Employee Feedback Form",
                    Code = "emp-feedback-2026",
                    Description = "Gather feedback regarding workplace environment, team support, and career growth.",
                    Category = "Human Resources",
                    Status = "Published",
                    AllowMultipleSubmissions = false,
                    AllowSaveAsDraft = true,
                    ConfirmationMessage = "Thank you for your valuable feedback! Your response has been recorded.",
                    SubmitButtonText = "Submit Feedback",
                    CancelButtonText = "Clear",
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    UpdatedAt = DateTime.UtcNow,
                    Sections = new List<FormSectionEntity>
                    {
                        new FormSectionEntity
                        {
                            Title = "Personal & Department Details",
                            Description = "Basic details to help us contextually evaluate response trends.",
                            Visibility = true,
                            DisplayOrder = 0,
                            Fields = new List<FormFieldEntity>
                            {
                                new FormFieldEntity
                                {
                                    Name = "employeeName",
                                    Label = "Full Name",
                                    Type = "Textbox",
                                    Placeholder = "e.g. John Doe",
                                    HelperDescription = "Optional: Leave blank if you wish to respond anonymously",
                                    Visibility = true,
                                    DisplayOrder = 0,
                                    Validations = new List<FieldValidationEntity>
                                    {
                                        new FieldValidationEntity { Type = "minLength", Value = "2" }
                                    }
                                },
                                new FormFieldEntity
                                {
                                    Name = "email",
                                    Label = "Corporate Email",
                                    Type = "Email",
                                    Placeholder = "john.doe@company.com",
                                    Visibility = true,
                                    DisplayOrder = 1,
                                    Validations = new List<FieldValidationEntity>
                                    {
                                        new FieldValidationEntity { Type = "required" },
                                        new FieldValidationEntity { Type = "email" }
                                    }
                                },
                                new FormFieldEntity
                                {
                                    Name = "department",
                                    Label = "Department",
                                    Type = "Dropdown",
                                    Visibility = true,
                                    DisplayOrder = 2,
                                    Validations = new List<FieldValidationEntity>
                                    {
                                        new FieldValidationEntity { Type = "required" }
                                    },
                                    Options = new List<FieldOptionEntity>
                                    {
                                        new FieldOptionEntity { Label = "Engineering", Value = "Engineering", DisplayOrder = 0 },
                                        new FieldOptionEntity { Label = "Human Resources", Value = "HR", DisplayOrder = 1 },
                                        new FieldOptionEntity { Label = "Product & Design", Value = "Product", DisplayOrder = 2 },
                                        new FieldOptionEntity { Label = "Sales & Marketing", Value = "Sales", DisplayOrder = 3 }
                                    }
                                }
                            }
                        },
                        new FormSectionEntity
                        {
                            Title = "Workplace Assessment",
                            Description = "Please rate your recent work experience and project satisfaction.",
                            Visibility = true,
                            DisplayOrder = 1,
                            Fields = new List<FormFieldEntity>
                            {
                                new FormFieldEntity
                                {
                                    Name = "satisfactionLevel",
                                    Label = "Overall Job Satisfaction",
                                    Type = "RadioButton",
                                    Visibility = true,
                                    DisplayOrder = 0,
                                    Validations = new List<FieldValidationEntity>
                                    {
                                        new FieldValidationEntity { Type = "required" }
                                    },
                                    Options = new List<FieldOptionEntity>
                                    {
                                        new FieldOptionEntity { Label = "Very Satisfied", Value = "very_satisfied", DisplayOrder = 0 },
                                        new FieldOptionEntity { Label = "Satisfied", Value = "satisfied", DisplayOrder = 1 },
                                        new FieldOptionEntity { Label = "Neutral", Value = "neutral", DisplayOrder = 2 },
                                        new FieldOptionEntity { Label = "Unsatisfied", Value = "unsatisfied", DisplayOrder = 3 }
                                    }
                                },
                                new FormFieldEntity
                                {
                                    Name = "workplacePerks",
                                    Label = "Selected Perks You Value Most",
                                    Type = "Checkbox",
                                    Visibility = true,
                                    DisplayOrder = 1,
                                    Options = new List<FieldOptionEntity>
                                    {
                                        new FieldOptionEntity { Label = "Flexible Work Hours", Value = "flex_hours", DisplayOrder = 0 },
                                        new FieldOptionEntity { Label = "Remote / Hybrid Policy", Value = "remote", DisplayOrder = 1 },
                                        new FieldOptionEntity { Label = "Learning & Certification Budget", Value = "learning", DisplayOrder = 2 },
                                        new FieldOptionEntity { Label = "Health & Wellness Allowance", Value = "wellness", DisplayOrder = 3 }
                                    }
                                },
                                new FormFieldEntity
                                {
                                    Name = "comments",
                                    Label = "Detailed Comments & Suggestions",
                                    Type = "Textarea",
                                    Placeholder = "Share any ideas on how we can improve our culture and productivity...",
                                    HelperDescription = "Maximum 1000 characters",
                                    Visibility = true,
                                    DisplayOrder = 2,
                                    Validations = new List<FieldValidationEntity>
                                    {
                                        new FieldValidationEntity { Type = "maxLength", Value = "1000" }
                                    }
                                },
                                new FormFieldEntity
                                {
                                    Name = "reviewDate",
                                    Label = "Preferred Discussion Date",
                                    Type = "Date",
                                    Visibility = true,
                                    DisplayOrder = 3
                                }
                            }
                        }
                    }
                },
                new FormDefinitionEntity
                {
                    Name = "Customer Satisfaction Survey",
                    Code = "csat-q3-2026",
                    Description = "Quarterly CSAT survey for evaluating platform reliability and support speed.",
                    Category = "Customer Service",
                    Status = "Published",
                    AllowMultipleSubmissions = true,
                    AllowSaveAsDraft = true,
                    ConfirmationMessage = "We appreciate your input! You are helping us build a better platform.",
                    SubmitButtonText = "Send Review",
                    CreatedAt = DateTime.UtcNow.AddDays(-14),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2),
                    Sections = new List<FormSectionEntity>
                    {
                        new FormSectionEntity
                        {
                            Title = "Service Rating",
                            Visibility = true,
                            DisplayOrder = 0,
                            Fields = new List<FormFieldEntity>
                            {
                                new FormFieldEntity
                                {
                                    Name = "supportRating",
                                    Label = "Support Response Speed",
                                    Type = "RadioButton",
                                    Visibility = true,
                                    DisplayOrder = 0,
                                    Validations = new List<FieldValidationEntity>
                                    {
                                        new FieldValidationEntity { Type = "required" }
                                    },
                                    Options = new List<FieldOptionEntity>
                                    {
                                        new FieldOptionEntity { Label = "Excellent (< 1 hour)", Value = "excellent", DisplayOrder = 0 },
                                        new FieldOptionEntity { Label = "Good (Same day)", Value = "good", DisplayOrder = 1 },
                                        new FieldOptionEntity { Label = "Average (1-2 days)", Value = "average", DisplayOrder = 2 },
                                        new FieldOptionEntity { Label = "Poor (> 2 days)", Value = "poor", DisplayOrder = 3 }
                                    }
                                },
                                new FormFieldEntity
                                {
                                    Name = "recommendScore",
                                    Label = "Likelihood to Recommend (1-10)",
                                    Type = "Number",
                                    Placeholder = "Enter 1 to 10",
                                    Visibility = true,
                                    DisplayOrder = 1,
                                    Validations = new List<FieldValidationEntity>
                                    {
                                        new FieldValidationEntity { Type = "required" },
                                        new FieldValidationEntity { Type = "minValue", Value = "1" },
                                        new FieldValidationEntity { Type = "maxValue", Value = "10" }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            await context.Forms.AddRangeAsync(sampleForms);
            await context.SaveChangesAsync();

            // Seed Submissions for Employee Feedback Form
            FormDefinitionEntity? empForm = await context.Forms
                .Include(f => f.Sections)
                .ThenInclude(s => s.Fields)
                .FirstOrDefaultAsync(f => f.Code == "emp-feedback-2026");

            if (empForm != null)
            {
                Dictionary<string, int> fields = empForm.Sections.SelectMany(s => s.Fields).ToDictionary(f => f.Name, f => f.Id);

                List<FormSubmissionEntity> sampleSubmissions = new List<FormSubmissionEntity>
                {
                    new FormSubmissionEntity
                    {
                        FormId = empForm.Id,
                        SubmittedAt = DateTime.UtcNow.AddDays(-2),
                        Responses = new List<FormResponseEntity>
                        {
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("employeeName"), ValueJson = "\"Jane Smith\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("email"), ValueJson = "\"jane.smith@company.com\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("department"), ValueJson = "\"Engineering\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("satisfactionLevel"), ValueJson = "\"very_satisfied\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("workplacePerks"), ValueJson = "[\"flex_hours\",\"learning\"]" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("comments"), ValueJson = "\"Great team culture and strong engineering practices!\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("reviewDate"), ValueJson = "\"2026-09-15\"" }
                        }
                    },
                    new FormSubmissionEntity
                    {
                        FormId = empForm.Id,
                        SubmittedAt = DateTime.UtcNow.AddDays(-1),
                        Responses = new List<FormResponseEntity>
                        {
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("employeeName"), ValueJson = "\"Alex Rivera\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("email"), ValueJson = "\"alex.rivera@company.com\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("department"), ValueJson = "\"Product\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("satisfactionLevel"), ValueJson = "\"satisfied\"" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("workplacePerks"), ValueJson = "[\"remote\",\"wellness\"]" },
                            new FormResponseEntity { FieldId = fields.GetValueOrDefault("comments"), ValueJson = "\"Overall happy, would like more cross-team workshops.\"" }
                        }
                    }
                };

                await context.FormSubmissions.AddRangeAsync(sampleSubmissions);
                await context.SaveChangesAsync();
            }
        }

        public static async Task CleanupCorruptedDefaultValuesAsync(FormStudioDbContext context)
        {
            List<FormFieldEntity> fields = await context.Fields.ToListAsync();
            bool modified = false;

            foreach (FormFieldEntity field in fields)
            {
                if (field.DefaultValue != null)
                {
                    string? cleaned = Application.Mappings.MappingProfile.CleanQuotes(field.DefaultValue);
                    if (cleaned != field.DefaultValue)
                    {
                        field.DefaultValue = cleaned;
                        modified = true;
                    }
                }
            }

            if (modified)
            {
                await context.SaveChangesAsync();
            }
        }
    }
}
