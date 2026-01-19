using System;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SzpitalnaKadra.Helpers
{
    public class IPAddressConverter : JsonConverter<IPAddress?>
    {
        public override IPAddress? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var ipString = reader.GetString();
            if (string.IsNullOrWhiteSpace(ipString))
                return null;

            if (IPAddress.TryParse(ipString, out var ip))
                return ip;

            throw new JsonException($"Invalid IP address: {ipString}");
        }

        public override void Write(Utf8JsonWriter writer, IPAddress? value, JsonSerializerOptions options)
        {
            if (value != null)
                writer.WriteStringValue(value.ToString());
            else
                writer.WriteNullValue();
        }
    }
}
