using AutoMapper;
using FormStudio.Application.DTOs;
using FormStudio.Domain.Entities;

namespace FormStudio.Application.Mappings
{
    public static class MappingExtensions
    {
        private static readonly IMapper Mapper;

        static MappingExtensions()
        {
            MapperConfiguration config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            });
            Mapper = config.CreateMapper();
        }

        public static FormDefinitionDto ToDto(this FormDefinitionEntity entity) => Mapper.Map<FormDefinitionDto>(entity);
        public static FormDefinitionEntity ToEntity(this FormDefinitionDto dto) => Mapper.Map<FormDefinitionEntity>(dto);

        public static FormSectionDto ToDto(this FormSectionEntity entity) => Mapper.Map<FormSectionDto>(entity);
        public static FormSectionEntity ToEntity(this FormSectionDto dto) => Mapper.Map<FormSectionEntity>(dto);

        public static FormFieldDto ToDto(this FormFieldEntity entity) => Mapper.Map<FormFieldDto>(entity);
        public static FormFieldEntity ToEntity(this FormFieldDto dto) => Mapper.Map<FormFieldEntity>(dto);

        public static FieldOptionDto ToDto(this FieldOptionEntity entity) => Mapper.Map<FieldOptionDto>(entity);
        public static FieldOptionEntity ToEntity(this FieldOptionDto dto) => Mapper.Map<FieldOptionEntity>(dto);

        public static FieldValidationDto ToDto(this FieldValidationEntity entity) => Mapper.Map<FieldValidationDto>(entity);
        public static FieldValidationEntity ToEntity(this FieldValidationDto dto) => Mapper.Map<FieldValidationEntity>(dto);

        public static FormSubmissionDto ToDto(this FormSubmissionEntity entity) => Mapper.Map<FormSubmissionDto>(entity);
        public static FormSubmissionEntity ToEntity(this FormSubmissionDto dto) => Mapper.Map<FormSubmissionEntity>(dto);

        public static FormResponseDto ToDto(this FormResponseEntity entity) => Mapper.Map<FormResponseDto>(entity);
        public static FormResponseEntity ToEntity(this FormResponseDto dto) => Mapper.Map<FormResponseEntity>(dto);
    }
}
