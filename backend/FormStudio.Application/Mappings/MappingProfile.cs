using AutoMapper;
using FormStudio.Application.DTOs;
using FormStudio.Domain.Entities;

namespace FormStudio.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // FormDefinition <-> FormDefinitionDto
            CreateMap<FormDefinitionEntity, FormDefinitionDto>()
                .ForMember(dest => dest.Sections, opt => opt.MapFrom(src => src.Sections.OrderBy(s => s.DisplayOrder)))
                .ReverseMap()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.Now));

            // FormSection <-> FormSectionDto
            CreateMap<FormSectionEntity, FormSectionDto>()
                .ForMember(dest => dest.Fields, opt => opt.MapFrom(src => src.Fields.OrderBy(f => f.DisplayOrder)))
                .ReverseMap();

            // FormField <-> FormFieldDto
            CreateMap<FormFieldEntity, FormFieldDto>()
                .ForMember(dest => dest.Default, opt => opt.MapFrom(src => src.DefaultValue))
                .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options.OrderBy(o => o.DisplayOrder)))
                .ReverseMap()
                .ForMember(dest => dest.DefaultValue, opt => opt.MapFrom(src => src.Default));

            // FileTypeConfig <-> FileTypeConfigDto
            CreateMap<FileTypeConfigEntity, FileTypeConfigDto>();
            CreateMap<FileTypeConfigDto, FileTypeConfigEntity>()
                .ForMember(dest => dest.Extension, opt => opt.MapFrom(src => src.Extension != null ? src.Extension.Trim().ToLower() : string.Empty))
                .ForMember(dest => dest.MimeType, opt => opt.MapFrom(src => src.MimeType != null ? src.MimeType.Trim().ToLower() : string.Empty));

            // FieldOption <-> FieldOptionDto
            CreateMap<FieldOptionEntity, FieldOptionDto>().ReverseMap();

            // FieldValidation <-> FieldValidationDto
            CreateMap<FieldValidationEntity, FieldValidationDto>()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => ParseValidationValue(src.Value)))
                .ReverseMap()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value != null ? src.Value.ToString() : null));

            // FormSubmission <-> FormSubmissionDto
            CreateMap<FormSubmissionEntity, FormSubmissionDto>().ReverseMap();

            // FormResponse <-> FormResponseDto
            CreateMap<FormResponseEntity, FormResponseDto>()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.ValueJson))
                .ReverseMap()
                .ForMember(dest => dest.ValueJson, opt => opt.MapFrom(src => src.Value != null ? src.Value.ToString() : null));

            // User <-> UserDto
            CreateMap<UserEntity, UserDto>().ReverseMap();
        }

        private static object? ParseValidationValue(string? val)
        {
            if (string.IsNullOrEmpty(val)) return null;
            if (double.TryParse(val, out double num)) return num;
            return val;
        }
    }
}
