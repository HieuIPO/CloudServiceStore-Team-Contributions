namespace CloudServiceStore.Infrastructure.Persistence;

internal static class VisualQaSeedIds
{
    public static Guid For(int series, int index) =>
        Guid.Parse($"00000000-0000-4000-8000-{series:X4}{index:X8}");

    public static Guid AdminRoleId => For(1, 1);
    public static Guid EditorRoleId => For(1, 2);
    public static Guid CustomerRoleId => For(1, 3);
    public static Guid AdminUserId => For(1, 11);
    public static Guid EditorUserId => For(1, 12);
    public static Guid LandingContentId => For(2, 1);
    public static Guid AffiliateProgramContentId => For(2, 2);

    public static Guid ServiceCategory(int index) => For(10, index);
    public static Guid ServicePlan(int index) => For(11, index);
    public static Guid ServicePlanFeature(int planIndex, int featureIndex) => For(12, planIndex * 10 + featureIndex);
    public static Guid PlanPrice(int planIndex, int version) => For(13, planIndex * 10 + version);
    public static Guid Promotion(int index) => For(14, index);
    public static Guid PromotionPlan(int promotionIndex, int planIndex) => For(15, promotionIndex * 100 + planIndex);

    public static Guid NewsCategory(int index) => For(20, index);
    public static Guid NewsArticle(int index) => For(21, index);
    public static Guid Testimonial(int index) => For(30, index);
    public static Guid CustomerLogo(int index) => For(31, index);

    public static Guid Order(int index) => For(40, index);
    public static Guid OrderHistory(int orderIndex, int historyIndex) => For(41, orderIndex * 10 + historyIndex);
    public static Guid AffiliateApplication(int index) => For(50, index);
    public static Guid AffiliateHistory(int applicationIndex, int historyIndex) => For(51, applicationIndex * 10 + historyIndex);
    public static Guid AuditLog(int index) => For(60, index);
}
