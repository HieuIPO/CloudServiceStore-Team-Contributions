using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudServiceStore.Infrastructure.Persistence.Configurations;

public sealed class NewsCategoryConfiguration : IEntityTypeConfiguration<NewsCategory>
{
    public void Configure(EntityTypeBuilder<NewsCategory> builder)
    {
        builder.ToTable("NewsCategories");
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(140).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => new { x.IsActive, x.DisplayOrder });
    }
}

public sealed class NewsArticleConfiguration : IEntityTypeConfiguration<NewsArticle>
{
    public void Configure(EntityTypeBuilder<NewsArticle> builder)
    {
        builder.ToTable("NewsArticles");
        builder.Property(x => x.Title).HasMaxLength(220).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(240).IsRequired();
        builder.Property(x => x.Excerpt).HasMaxLength(500).IsRequired();
        builder.Property(x => x.MarkdownContent).HasMaxLength(50_000).IsRequired();
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.IsFeatured).IsUnique().HasFilter("[IsDeleted] = 0 AND [IsFeatured] = 1");
        builder.HasIndex(x => new { x.Status, x.PublishedAt });
        builder.HasIndex(x => new { x.CategoryId, x.Status, x.PublishedAt });
        builder.HasOne(x => x.Category).WithMany(x => x.Articles).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}
