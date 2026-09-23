using AutoMapper;
using FormStudio.Application.DTOs;
using FormStudio.Domain.Entities;

namespace FormStudio.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // 1. FormDefinition <-> FormDefinitionDto
            CreateMap<FormDefinitionEntity, FormDefinitionDto>()
                .ForMember(dest => dest.Sections, opt => opt.MapFrom(src => src.Sections.OrderBy(s => s.DisplayOrder)))
                .ReverseMap()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            // 2. FormSection <-> FormSectionDto
            CreateMap<FormSectionEntity, FormSectionDto>()
                .ForMember(dest => dest.Fields, opt => opt.MapFrom(src => src.Fields.OrderBy(f => f.DisplayOrder)))
                .ReverseMap();

            // 3. FormField <-> FormFieldDto
            CreateMap<FormFieldEntity, FormFieldDto>()
                .ForMember(dest => dest.Default, opt => opt.MapFrom(src => src.DefaultValue))
                .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options.OrderBy(o => o.DisplayOrder)))
                .ReverseMap()
                .ForMember(dest => dest.DefaultValue, opt => opt.MapFrom(src => src.Default));

            // 4. FieldOption <-> FieldOptionDto
            CreateMap<FieldOptionEntity, FieldOptionDto>().ReverseMap();

            // 5. FieldValidation <-> FieldValidationDto
            CreateMap<FieldValidationEntity, FieldValidationDto>()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => ParseValidationValue(src.Value)))
                .ReverseMap()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value != null ? src.Value.ToString() : null));

            // 6. FormSubmission <-> FormSubmissionDto
            CreateMap<FormSubmissionEntity, FormSubmissionDto>().ReverseMap();

            // 7. FormResponse <-> FormResponseDto
            CreateMap<FormResponseEntity, FormResponseDto>()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.ValueJson))
                .ReverseMap()
                .ForMember(dest => dest.ValueJson, opt => opt.MapFrom(src => src.Value != null ? src.Value.ToString() : null));
        }

        private static object? ParseValidationValue(string? val)
        {
            if (string.IsNullOrEmpty(val)) return null;
            if (double.TryParse(val, out double num)) return num;
            return val;
        }
    }
}
