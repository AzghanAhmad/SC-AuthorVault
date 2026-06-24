namespace AuthorVault.Api.Dtos;

public record RegisterRequest(string Name, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record AuthResponse(string Token, UserDto User);
public record UserDto(int Id, string Name, string Email);

public record PinSetupRequest(string Pin);
public record PinVerifyRequest(string Pin);
public record PinStatusResponse(bool HasPin, bool IsUnlocked);

public record FileUploadResponse(int Id, string FileName, string Url, string ContentType, long SizeBytes, string Category);
