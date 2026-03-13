export interface PostDef {
  title: string;
  slug: string;
  language: "en" | "es";
  category:
    | "pillar"
    | "data-driven"
    | "comparison"
    | "city-specific"
    | "problem-solution"
    | "buying-guide"
    | "listicle"
    | "roi-analysis"
    | "vertical-specific"
    | "bilingual-advantage"
    | "pain-point"
    | "guia-de-compra"
    | "lista"
    | "analisis-roi"
    | "vertical-especifico"
    | "ventaja-bilingue"
    | "punto-de-dolor";
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  relatedPostSlugs: string[];
  authorName?: string;
  markdown: string;
}
