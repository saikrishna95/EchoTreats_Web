import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_available", true).order("sort_order"),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategories(catRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  const getProductsByCategory = (categorySlug: string) => {
    const cat = categories.find(c => c.slug === categorySlug);
    if (!cat) return [];
    return products.filter(p => p.category_id === cat.id);
  };

  const getFeatured = () => products.filter(p => p.is_featured);

  return { products, categories, loading, getProductsByCategory, getFeatured };
};
