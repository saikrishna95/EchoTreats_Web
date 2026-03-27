import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Module-level cache keyed by user id
const cache: Record<string, { items: any[]; ids: Set<string>; time: number }> = {};
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const useWishlist = () => {
  const { user } = useAuth();
  const cached = user ? cache[user.id] : undefined;
  const fetchingRef = useRef(false);

  const [wishlistIds, setWishlistIds] = useState<Set<string>>(cached?.ids ?? new Set());
  const [wishlistItems, setWishlistItems] = useState<any[]>(cached?.items ?? []);
  const [loading, setLoading] = useState(!cached);

  const fetchWishlist = useCallback(async (force = false) => {
    if (!user) {
      setWishlistIds(new Set());
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    // Skip if already fetching
    if (fetchingRef.current) return;

    // Skip if cache is fresh and not forced
    const now = Date.now();
    if (!force && cache[user.id] && now - cache[user.id].time < CACHE_TTL) {
      setWishlistIds(cache[user.id].ids);
      setWishlistItems(cache[user.id].items);
      setLoading(false);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);

    // Fetch only wishlist IDs first (fast) then join products
    const { data: wishlistData } = await supabase
      .from("wishlist")
      .select("id, product_id")
      .eq("user_id", user.id);

    if (wishlistData && wishlistData.length > 0) {
      const productIds = wishlistData.map((w: any) => w.product_id);

      // Fetch products separately (uses index)
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price, image_url, description, category_id")
        .in("id", productIds);

      const items = wishlistData.map((w: any) => ({
        ...w,
        product: productsData?.find((p: any) => p.id === w.product_id) || null,
      }));

      const ids = new Set(productIds as string[]);
      cache[user.id] = { items, ids, time: Date.now() };
      setWishlistIds(ids);
      setWishlistItems(items);
    } else {
      const ids = new Set<string>();
      cache[user.id] = { items: [], ids, time: Date.now() };
      setWishlistIds(ids);
      setWishlistItems([]);
    }

    setLoading(false);
    fetchingRef.current = false;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      setWishlistItems([]);
      setLoading(false);
      // Clear all cached data on logout so next login starts fresh
      Object.keys(cache).forEach(k => delete cache[k]);
      return;
    }

    // Show cache instantly if available
    if (cache[user.id]) {
      setWishlistIds(cache[user.id].ids);
      setWishlistItems(cache[user.id].items);
      setLoading(false);

      // Only refresh if cache is stale
      const now = Date.now();
      if (now - cache[user.id].time > CACHE_TTL) {
        fetchWishlist(true);
      }
    } else {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  const toggleWishlist = async (productId: string) => {
    if (!user) return false;
    const isWished = wishlistIds.has(productId);

    // Optimistic update — instant UI response
    const newIds = new Set(wishlistIds);

    if (isWished) {
      // Remove instantly from UI
      newIds.delete(productId);
      const newItems = wishlistItems.filter((w: any) => w.product_id !== productId);
      cache[user.id] = { ...cache[user.id], items: newItems, ids: newIds };
      setWishlistIds(newIds);
      setWishlistItems(newItems);

      // Then delete from DB
      await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
    } else {
      // Add instantly to UI
      newIds.add(productId);
      setWishlistIds(new Set(newIds));

      // Insert to DB
      const { data } = await supabase
        .from("wishlist")
        .insert({ user_id: user.id, product_id: productId })
        .select("id, product_id")
        .single();

      if (data) {
        // Fetch product details
        const { data: product } = await supabase
          .from("products")
          .select("id, name, price, image_url, description, category_id")
          .eq("id", productId)
          .single();

        const newItem = { ...data, product };
        const newItems = [...wishlistItems, newItem];
        cache[user.id] = { ...cache[user.id], items: newItems, ids: newIds };
        setWishlistItems(newItems);
      }
    }

    return !isWished;
  };

  const isInWishlist = (productId: string) => wishlistIds.has(productId);

  const clearCache = () => {
    if (user) delete cache[user.id];
  };

  return {
    wishlistItems,
    loading,
    toggleWishlist,
    isInWishlist,
    refetch: () => fetchWishlist(true),
    clearCache,
  };
};