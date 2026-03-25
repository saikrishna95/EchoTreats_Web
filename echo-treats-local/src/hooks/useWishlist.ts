import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setWishlistIds(new Set()); setWishlistItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("wishlist")
      .select("*, product:products(*)")
      .eq("user_id", user.id);
    if (data) {
      setWishlistIds(new Set(data.map(w => w.product_id)));
      setWishlistItems(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggleWishlist = async (productId: string) => {
    if (!user) return false;
    const isWished = wishlistIds.has(productId);
    if (isWished) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
    }
    await fetchWishlist();
    return !isWished;
  };

  const isInWishlist = (productId: string) => wishlistIds.has(productId);

  return { wishlistItems, loading, toggleWishlist, isInWishlist, refetch: fetchWishlist };
};
