import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

// Cache to avoid refetching on every page visit
let cachedProducts: Product[] = [];
let cachedCategories: Category[] = [];
let cachedFeaturedSlots: any[] = [];
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [categories, setCategories] = useState<Category[]>(cachedCategories);
  const [featuredSlots, setFeaturedSlots] = useState<any[]>(cachedFeaturedSlots);
  const [loading, setLoading] = useState(cachedProducts.length === 0);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedProducts.length > 0 && now - cacheTime < CACHE_DURATION) {
      setProducts(cachedProducts);
      setCategories(cachedCategories);
      setFeaturedSlots(cachedFeaturedSlots);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [prodRes, catRes, slotsRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("sort_order"),
      supabase
        .from("categories")
        .select("id, name, slug, description, sort_order, created_at, image_url")
        .order("sort_order"),
      (supabase.from("category_home_slots" as any) as any).select("*").order("slot_position"),
    ]);

    if (prodRes.data) { cachedProducts = prodRes.data; setProducts(prodRes.data); }
    if (catRes.data) { cachedCategories = catRes.data; setCategories(catRes.data); }
    if (slotsRes.data) { cachedFeaturedSlots = slotsRes.data; setFeaturedSlots(slotsRes.data); }
    cacheTime = Date.now();
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Flexible category lookup: exact slug → startsWith → slug contains query → name contains → first slug segment
  const findCat = (slug: string) => {
    const q = slug.toLowerCase();
    return categories.find(c => {
      const s = c.slug.toLowerCase();
      const n = c.name.toLowerCase();
      return s === q || s.startsWith(q) || s.includes(q) || n.includes(q) || q.startsWith(s.split("-")[0]);
    });
  };

  const getProductsByCategory = (categorySlug: string) => {
    const cat = findCat(categorySlug);
    if (!cat) return [];
    return products.filter(p => p.category_id === cat.id);
  };

  // Returns up to 6 products for a category's home section.
  // Uses admin-defined slots when available, otherwise first 6 by sort_order.
  const getFeaturedSlotsByCategory = (categorySlug: string): Product[] => {
    const cat = findCat(categorySlug);
    if (!cat) return [];
    const catProducts = products.filter(p => p.category_id === cat.id);
    const slots = featuredSlots
      .filter((s: any) => s.category_id === cat.id)
      .sort((a: any, b: any) => a.slot_position - b.slot_position);
    if (slots.length === 0) return catProducts.slice(0, 6);
    const slotProducts = slots
      .map((s: any) => catProducts.find(p => p.id === s.product_id))
      .filter(Boolean) as Product[];
    // Fall back to first 6 if all slot product IDs are stale/unmatched
    return slotProducts.length > 0 ? slotProducts : catProducts.slice(0, 6);
  };

  const getFeatured = () => products.filter(p => p.is_featured);

  const refresh = () => fetchData(true);

  return { products, categories, loading, getProductsByCategory, getFeaturedSlotsByCategory, getFeatured, refresh };
};
