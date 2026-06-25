using System.Text;
using AuthorVault.Api.Configuration;
using AuthorVault.Api.Data;
using AuthorVault.Api.Options;
using AuthorVault.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<AwsOptions>(builder.Configuration.GetSection(AwsOptions.SectionName));

var connectionString = ConnectionStringResolver.Resolve(builder.Configuration);

var mySqlVersion = new MySqlServerVersion(new Version(8, 0, 36));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, mySqlVersion));

var jwtOpts = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOpts.Issuer,
            ValidAudience = jwtOpts.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOpts.Key)),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
        options.MapInboundClaims = false;
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value;
                if (sub is not null)
                {
                    var identity = (System.Security.Claims.ClaimsIdentity?)ctx.Principal?.Identity;
                    identity?.AddClaim(new System.Security.Claims.Claim(
                        System.Security.Claims.ClaimTypes.NameIdentifier, sub));
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (corsOrigins.Length > 0)
            policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod();
        else
            policy.AllowAnyHeader().AllowAnyMethod().SetIsOriginAllowed(_ => true);
    });
});

builder.Services.AddOpenApi();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddScoped<WorkspaceService>();

var aws = builder.Configuration.GetSection(AwsOptions.SectionName).Get<AwsOptions>() ?? new AwsOptions();
if (!string.IsNullOrWhiteSpace(aws.AccessKeyId) && !string.IsNullOrWhiteSpace(aws.S3BucketName))
    builder.Services.AddSingleton<IFileStorageService, S3FileStorageService>();
else
    builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        await DatabaseInitializer.MigrateAsync(db, connectionString, logger);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Could not connect to MySQL. Start XAMPP MySQL, then run: npm start");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseStaticFiles();

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var hasSpa = File.Exists(Path.Combine(wwwrootPath, "index.html"));
if (hasSpa)
{
    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwrootPath)
    });
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (hasSpa)
    app.MapFallbackToFile("index.html");

app.Run();
