using System.Text.Json;
using System.Text.Json.Serialization;

namespace FormStudio.Application.Common
{
    public class DateTimeJsonConverter : JsonConverter<DateTime?>
    {
        private const string Format = "yyyy-MM-ddTHH:mm";

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                string? str = reader.GetString();
                if (string.IsNullOrWhiteSpace(str))
                {
                    return null;
                }

                if (DateTime.TryParse(str, out DateTime dt))
                {
                    return dt.Kind == DateTimeKind.Unspecified
                        ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
                        : dt.ToUniversalTime();
                }
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
            {
                writer.WriteStringValue(value.Value.ToString(Format));
            }
            else
            {
                writer.WriteNullValue();
            }
        }
    }

    public class StringJsonConverter : JsonConverter<string?>
    {
        public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                string? str = reader.GetString();
                return string.IsNullOrWhiteSpace(str) ? null : str;
            }

            using (JsonDocument doc = JsonDocument.ParseValue(ref reader))
            {
                return doc.RootElement.ToString();
            }
        }

        public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                writer.WriteNullValue();
            }
            else
            {
                writer.WriteStringValue(value);
            }
        }
    }
}
