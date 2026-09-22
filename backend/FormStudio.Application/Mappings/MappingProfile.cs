using System.Text.Encodings.Web;
using System.Text.Json;
using AutoMapper;
using FormStudio.Application.DTOs;
using FormStudio.Domain.Entities;

namespace FormStudio.Application.Mappings
{
    public class MappingProfile : Profile
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        public MappingProfile()
        {
            // 1. FormDefinition <-> FormDefinitionDto
            CreateMap<FormDefinitionEntity, FormDefinitionDto>()
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => src.StartDate.HasValue ? src.StartDate.Value.ToString("yyyy-MM-ddTHH:mm") : null))
                .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.EndDate.HasValue ? src.EndDate.Value.ToString("yyyy-MM-ddTHH:mm") : null))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt.ToString("o")))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt.ToString("o")))
                .ForMember(dest => dest.Sections, opt => opt.MapFrom(src => src.Sections.OrderBy(s => s.DisplayOrder)))
                .ReverseMap()
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => ParseDate(src.StartDate)))
                .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => ParseDate(src.EndDate)))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => ParseDate(src.CreatedAt) ?? DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            // 2. FormSection <-> FormSectionDto
            CreateMap<FormSectionEntity, FormSectionDto>()
                .ForMember(dest => dest.Fields, opt => opt.MapFrom(src => src.Fields.OrderBy(f => f.DisplayOrder)))
                .ReverseMap();

            // 3. FormField <-> FormFieldDto
            CreateMap<FormFieldEntity, FormFieldDto>()
                .ForMember(dest => dest.Default, opt => opt.MapFrom(src => ParseDefaultValue(src.DefaultValue)))
                .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options.OrderBy(o => o.DisplayOrder)))
                .ReverseMap()
                .ForMember(dest => dest.DefaultValue, opt => opt.MapFrom(src => NormalizeDefaultValue(src.Default)));

            // 4. FieldOption <-> FieldOptionDto
            CreateMap<FieldOptionEntity, FieldOptionDto>().ReverseMap();

            // 5. FieldValidation <-> FieldValidationDto
            CreateMap<FieldValidationEntity, FieldValidationDto>()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => ParseValidationValue(src.Value)))
                .ReverseMap()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value != null ? src.Value.ToString() : null));

            // 6. FormSubmission <-> FormSubmissionDto
            CreateMap<FormSubmissionEntity, FormSubmissionDto>()
                .ForMember(dest => dest.SubmittedAt, opt => opt.MapFrom(src => src.SubmittedAt.ToString("o")))
                .ReverseMap()
                .ForMember(dest => dest.SubmittedAt, opt => opt.MapFrom(src => ParseDate(src.SubmittedAt) ?? DateTime.UtcNow));

            // 7. FormResponse <-> FormResponseDto
            CreateMap<FormResponseEntity, FormResponseDto>()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => DeserializeJson(src.ValueJson)))
                .ReverseMap()
                .ForMember(dest => dest.ValueJson, opt => opt.MapFrom(src => SerializeJson(src.Value)));
        }

        public static string? NormalizeDefaultValue(object? obj)
        {
            if (obj == null) return null;
            if (obj is string str)
            {
                return CleanQuotes(str);
            }
            if (obj is JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == JsonValueKind.Null || jsonElement.ValueKind == JsonValueKind.Undefined)
                    return null;
                if (jsonElement.ValueKind == JsonValueKind.String)
                {
                    return CleanQuotes(jsonElement.GetString());
                }
                if (jsonElement.ValueKind == JsonValueKind.True) return "true";
                if (jsonElement.ValueKind == JsonValueKind.False) return "false";
                return CleanQuotes(jsonElement.GetRawText());
            }
            if (obj is bool b) return b ? "true" : "false";
            return CleanQuotes(obj.ToString());
        }

        public static object? ParseDefaultValue(string? val)
        {
            val = CleanQuotes(val);
            if (string.IsNullOrEmpty(val)) return null;
            if (bool.TryParse(val, out bool b)) return b;
            if (long.TryParse(val, out long l)) return l;
            if (double.TryParse(val, out double d)) return d;
            return val;
        }

        public static string? CleanQuotes(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;

            s = s.Trim();

            bool changed = true;
            while (changed && s.Length > 0)
            {
                changed = false;

                // 1. Strip unicode escapes for quotes: \u0022, \\u0022, \\\u0022, etc.
                if (s.StartsWith(@"\\\u0022", StringComparison.OrdinalIgnoreCase))
                {
                    s = s.Substring(8).Trim();
                    changed = true;
                }
                else if (s.StartsWith(@"\\u0022", StringComparison.OrdinalIgnoreCase))
                {
                    s = s.Substring(7).Trim();
                    changed = true;
                }
                else if (s.StartsWith(@"\u0022", StringComparison.OrdinalIgnoreCase))
                {
                    s = s.Substring(6).Trim();
                    changed = true;
                }

                if (s.EndsWith(@"\\\u0022", StringComparison.OrdinalIgnoreCase))
                {
                    s = s.Substring(0, s.Length - 8).Trim();
                    changed = true;
                }
                else if (s.EndsWith(@"\\u0022", StringComparison.OrdinalIgnoreCase))
                {
                    s = s.Substring(0, s.Length - 7).Trim();
                    changed = true;
                }
                else if (s.EndsWith(@"\u0022", StringComparison.OrdinalIgnoreCase))
                {
                    s = s.Substring(0, s.Length - 6).Trim();
                    changed = true;
                }

                // 2. Strip escaped quotes: \" or \\"
                if (s.StartsWith(@"\\"""))
                {
                    s = s.Substring(3).Trim();
                    changed = true;
                }
                else if (s.StartsWith(@"\"""))
                {
                    s = s.Substring(2).Trim();
                    changed = true;
                }

                if (s.EndsWith(@"\\"""))
                {
                    s = s.Substring(0, s.Length - 3).Trim();
                    changed = true;
                }
                else if (s.EndsWith(@"\"""))
                {
                    s = s.Substring(0, s.Length - 2).Trim();
                    changed = true;
                }

                // 3. Strip standard quotes: " or '
                if (s.Length >= 2 && ((s.StartsWith("\"") && s.EndsWith("\"")) || (s.StartsWith("'") && s.EndsWith("'"))))
                {
                    s = s.Substring(1, s.Length - 2).Trim();
                    changed = true;
                }
            }

            // If only quote markers or escape markers remain, treat as null
            if (s.Equals(@"\u0022", StringComparison.OrdinalIgnoreCase) ||
                s.Equals(@"\\u0022", StringComparison.OrdinalIgnoreCase) ||
                s.Equals(@"\""") ||
                s == "\"" ||
                s == "'")
            {
                return null;
            }

            return string.IsNullOrWhiteSpace(s) ? null : s;
        }

        private static DateTime? ParseDate(string? d)
        {
            if (string.IsNullOrWhiteSpace(d)) return null;
            if (DateTime.TryParse(d, out DateTime dt))
            {
                if (dt.Kind == DateTimeKind.Unspecified)
                {
                    return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                }
                return dt.ToUniversalTime();
            }
            return null;
        }

        private static object? DeserializeJson(string? json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            try { return JsonSerializer.Deserialize<object>(json, JsonOptions); }
            catch { return json; }
        }

        private static string? SerializeJson(object? obj)
        {
            if (obj == null) return null;
            return obj is string str ? str : JsonSerializer.Serialize(obj, JsonOptions);
        }

        private static object? ParseValidationValue(string? val)
        {
            if (string.IsNullOrEmpty(val)) return null;
            if (double.TryParse(val, out double num)) return num;
            return val;
        }
    }
}
