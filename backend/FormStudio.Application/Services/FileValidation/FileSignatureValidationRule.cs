using FormStudio.Application.Interfaces.Services;
using FormStudio.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FormStudio.Application.Services.FileValidation
{
    /// <summary>
    /// Inspects the file stream leading bytes (magic numbers) to verify the binary file signature matches the claimed extension and blocks disguised executables/scripts.
    /// </summary>
    public class FileSignatureValidationRule : IFileValidationRule
    {
        private static readonly byte[] ExeMzSignature = [0x4D, 0x5A]; // "MZ" Windows executable / DLL / PE

        private static readonly HashSet<string> PlainTextExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".csv", ".txt", ".json", ".xml"
        };

        private static readonly Dictionary<string, List<byte[]>> KnownSignatures = new(StringComparer.OrdinalIgnoreCase)
        {
            // PDF: "%PDF-" (25 50 44 46)
            [".pdf"] = [[0x25, 0x50, 0x44, 0x46]],

            // PNG: 89 50 4E 47 0D 0A 1A 0A
            [".png"] = [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],

            // JPEG / JPG: FF D8 FF
            [".jpg"] = [[0xFF, 0xD8, 0xFF]],
            [".jpeg"] = [[0xFF, 0xD8, 0xFF]],

            // GIF: "GIF87a" or "GIF89a"
            [".gif"] = [
                [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
                [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
            ],

            // ZIP and modern Office XML (DOCX, XLSX, PPTX): "PK\x03\x04" (50 4B 03 04)
            [".zip"] = [[0x50, 0x4B, 0x03, 0x04]],
            [".docx"] = [[0x50, 0x4B, 0x03, 0x04]],
            [".xlsx"] = [[0x50, 0x4B, 0x03, 0x04]],
            [".pptx"] = [[0x50, 0x4B, 0x03, 0x04]],

            // Legacy Office Binary (.doc, .xls, .ppt): D0 CF 11 E0 A1 B1 1A E1
            [".doc"] = [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
            [".xls"] = [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
            [".ppt"] = [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],

            // WebP: "RIFF....WEBP" -> bytes 0..3 are "RIFF" (52 49 46 46)
            [".webp"] = [[0x52, 0x49, 0x46, 0x46]]
        };

        public async Task ValidateAsync(IFormFile file, FormFieldEntity fieldEntity)
        {
            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            const int maxHeaderBytesToRead = 16;
            byte[] headerBytes = new byte[maxHeaderBytesToRead];
            int bytesRead;

            using (Stream stream = file.OpenReadStream())
            {
                if (stream.CanSeek)
                {
                    stream.Position = 0;
                }

                bytesRead = await stream.ReadAsync(headerBytes.AsMemory(0, maxHeaderBytesToRead));
                if (bytesRead < 2)
                {
                    throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' is too small to contain a valid file signature.");
                }

                if (stream.CanSeek)
                {
                    stream.Position = 0;
                }
            }

            if (MatchesSignature(headerBytes, ExeMzSignature))
            {
                throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' is rejected because it contains executable binary content (MZ header).");
            }

            if (PlainTextExtensions.Contains(extension))
            {
                if (headerBytes.Take(bytesRead).Any(b => b == 0x00))
                {
                    throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' is not a valid text/CSV file (contains binary null bytes).");
                }
                return;
            }

            if (KnownSignatures.TryGetValue(extension, out List<byte[]>? validSignatures))
            {
                bool matchesValidSignature = validSignatures.Any(sig => MatchesSignature(headerBytes, sig));
                if (!matchesValidSignature)
                {
                    throw new ArgumentException($"File '{Path.GetFileName(file.FileName)}' content does not match the expected binary signature for '{extension}'.");
                }
            }
        }

        private static bool MatchesSignature(byte[] headerBytes, byte[] expectedSignature)
        {
            if (headerBytes.Length < expectedSignature.Length) return false;

            for (int i = 0; i < expectedSignature.Length; i++)
            {
                if (headerBytes[i] != expectedSignature[i])
                {
                    return false;
                }
            }
            return true;
        }
    }
}
