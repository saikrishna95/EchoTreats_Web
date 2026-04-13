import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

// Cache to avoid refetching on every page visit
let cachedProducts: Product[] = [];
let cachedCategories: Category[] = [];
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [categories, setCategories] = useState<Category[]>(cachedCategories);
  const [loading, setLoading] = useState(cachedProducts.length === 0);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedProducts.length > 0 && now - cacheTime < CACHE_DURATION) {
      setProducts(cachedProducts);
      setCategories(cachedCategories);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("sort_order"),
      supabase
        .from("categories")
        .select("id, name, slug, description, sort_order, created_at, image_url")
        .order("sort_order"),
    ]);

    if (prodRes.data) { cachedProducts = prodRes.data; setProducts(prodRes.data); }
    if (catRes.data) { cachedCategories = catRes.data; setCategories(catRes.data); }
    cacheTime = Date.now();
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getProductsByCategory = (categorySlug: string) => {
    const cat = categories.find(c => c.slug === categorySlug);
    if (!cat) return [];
    return products.filter(p => p.category_id === cat.id);
  };

  const getFeatured = () => products.filter(p => p.is_featured);

  const refresh = () => fetchData(true);

  return { products, categories, loading, getProductsByCategory, getFeatured, refresh };
};
