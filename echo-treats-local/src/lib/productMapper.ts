import type { Product } from "@/components/ProductCard";
import type { Database } from "@/integrations/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export const mapDbProduct = (p: ProductRow): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: `From ₹${Number(p.price).toLocaleString("en-IN")}`,
  image: p.image_url || "/placeholder.svg",
  tags: p.tags || [],
  mediaUrls: ((p as any).media_urls as { type: "image" | "video" | "gif"; url: string }[] | null) || undefined,
});
