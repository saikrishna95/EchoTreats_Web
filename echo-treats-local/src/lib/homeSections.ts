export const homeSectionIds = [
  "products",
  "cakes",
  "brownies",
  "chocolates",
  "cupcakes",
  "tubs",
  "cheesecakes",
  "cookies",
  "new",
  "occasions",
  "custom",
  "reviews",
  "feed",
  "story",
  "contact",
] as const;

export type HomeSectionId = (typeof homeSectionIds)[number];

const homeSectionIdSet = new Set<string>(homeSectionIds);

export const homeSectionPath = (sectionId?: string | null) => {
  if (!sectionId) {
    return "/";
  }

  return sectionId === "products" ? "/products" : `/${sectionId}`;
};

export const getHomeSectionFromPathname = (pathname: string): HomeSectionId | null => {
  if (pathname === "/") {
    return null;
  }

  const slug = pathname.replace(/^\/+|\/+$/g, "");
  return homeSectionIdSet.has(slug) ? (slug as HomeSectionId) : null;
};

export const isHomeSectionPathname = (pathname: string) => {
  return pathname === "/" || getHomeSectionFromPathname(pathname) !== null;
};
