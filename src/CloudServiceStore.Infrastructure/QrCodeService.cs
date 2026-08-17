using CloudServiceStore.Application.Catalog;
using QRCoder;

namespace CloudServiceStore.Infrastructure;

public sealed class QrCodeService : IQrCodeService
{
    public byte[] GeneratePng(string content)
    {
        if (!Uri.TryCreate(content, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
            throw new ArgumentException("QR content must be an absolute HTTP(S) URL.", nameof(content));

        using var data = QRCodeGenerator.GenerateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        return new PngByteQRCode(data).GetGraphic(12);
    }
}
