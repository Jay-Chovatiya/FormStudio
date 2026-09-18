using System;
using System.Linq;
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
            PropertyNameCaseInsensitive = true
        };

        public MappingProfile()
        {
            // 1. FormDefinition <-> FormDefinitionDto
            CreateMap<FormDefinitionEntity, FormDefinitionDto>()
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => src.StartDate.HasValue ? src.StartDate.Value.ToString("yyyy-MM-dd") : null))
                .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.EndDate.HasValue ? src.EndDate.Value.ToString("yyyy-MM-dd") : null))
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
                .ForMember(dest => dest.Default, opt => opt.MapFrom(src => DeserializeJson(src.DefaultValue)))
                .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options.OrderBy(o => o.DisplayOrder)))
                .ReverseMap()
                .ForMember(dest => dest.DefaultValue, opt => opt.MapFrom(src => SerializeJson(src.Default)));

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

        private static DateTime? ParseDate(string? d) =>
            DateTime.TryParse(d, out var dt) ? dt.ToUniversalTime() : null;

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
            if (double.TryParse(val, out var num)) return num;
            return val;
        }
    }
}
