using AuthorVault.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthorVault.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserWorkspace> UserWorkspaces => Set<UserWorkspace>();
    public DbSet<UploadedFile> UploadedFiles => Set<UploadedFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256);
            e.Property(u => u.Name).HasMaxLength(256);
        });

        modelBuilder.Entity<UserWorkspace>(e =>
        {
            e.HasOne(w => w.User)
                .WithOne(u => u.Workspace)
                .HasForeignKey<UserWorkspace>(w => w.UserId);
        });

        modelBuilder.Entity<UploadedFile>(e =>
        {
            e.Property(f => f.FileName).HasMaxLength(512);
            e.Property(f => f.ContentType).HasMaxLength(128);
            e.Property(f => f.S3Key).HasMaxLength(1024);
            e.Property(f => f.Url).HasMaxLength(2048);
            e.Property(f => f.Category).HasMaxLength(64);
        });
    }
}
