using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace FormStudio.Application.Common
{

    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
    public class RequiredTrimmedAttribute : ValidationAttribute
    {
        public RequiredTrimmedAttribute() : base("{0} is required.")
        {
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null)
            {
                return new ValidationResult(FormatErrorMessage(validationContext.DisplayName));
            }

            if (value is string str)
            {
                string trimmed = str.Trim();
                if (string.IsNullOrEmpty(trimmed))
                {
                    return new ValidationResult(FormatErrorMessage(validationContext.DisplayName));
                }

                if (!string.IsNullOrEmpty(validationContext.MemberName))
                {
                    PropertyInfo? prop = validationContext.ObjectInstance?.GetType().GetProperty(validationContext.MemberName)
                                         ?? validationContext.ObjectType.GetProperty(validationContext.MemberName);
                    if (prop != null && prop.CanWrite)
                    {
                        prop.SetValue(validationContext.ObjectInstance, trimmed);
                    }
                }
            }

            return ValidationResult.Success;
        }
    }

    /// <summary>
    /// Trims an optional string property if provided.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
    public class TrimmedAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is string str && !string.IsNullOrEmpty(validationContext.MemberName))
            {
                PropertyInfo? prop = validationContext.ObjectInstance?.GetType().GetProperty(validationContext.MemberName)
                                     ?? validationContext.ObjectType.GetProperty(validationContext.MemberName);
                if (prop != null && prop.CanWrite)
                {
                    prop.SetValue(validationContext.ObjectInstance, str.Trim());
                }
            }

            return ValidationResult.Success;
        }
    }

    /// <summary>
    /// Validates that a DateTime is in the future.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
    public class FutureDateAttribute : ValidationAttribute
    {
        public FutureDateAttribute() : base("{0} must be a future date.")
        {
        }

        public override bool IsValid(object? value)
        {
            if (value == null) return true;
            if (value is DateTime dt)
            {
                return dt > DateTime.UtcNow;
            }
            return true;
        }
    }
}
