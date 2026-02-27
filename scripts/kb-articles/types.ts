export interface ArticleData {
  slug: string;
  title: string;
  titleEs: string;
  excerpt: string;
  excerptEs: string;
  content: string;
  contentEs: string;
  metaTitle: string;
  metaTitleEs: string;
  metaDescription: string;
  metaDescriptionEs: string;
  searchKeywords: string;
  searchKeywordsEs: string;
  categorySlug: string;
  dashboardContextRoutes: string[];
  sortOrder: number;
  readingTimeMinutes: number;
}
