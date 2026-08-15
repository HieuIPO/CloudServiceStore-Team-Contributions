namespace Application.Common.Interfaces;

public interface IQrCodeGenerator
{
    byte[] GenerateQrCode(string text);
}
