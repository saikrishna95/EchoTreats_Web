import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export interface CartItem extends CartItemRow {
  product?: ProductRow;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.from("cart_items").select("*, product:products(*)").eq("user_id", user.id);

      if (error) {
        toast.error("Failed to load cart");
        return;
      }

      setItems((data as CartItem[]) || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return;

    setLoading(true);

    try {
      const existing = items.find((i) => i.product_id === productId);

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);

        if (error) {
          toast.error("Failed to update cart");
          return;
        }
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        });

        if (error) {
          toast.error("Failed to add item to cart");
          return;
        }
      }

      await fetchCart();
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);

      if (error) {
        toast.error("Failed to update quantity");
        return;
      }

      await fetchCart();
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);

      if (error) {
        toast.error("Failed to remove item");
        return;
      }

      await fetchCart();
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);

      if (error) {
        toast.error("Failed to clear cart");
        return;
      }

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, i) => sum + Number(i.product?.price || 0) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        isOpen,
        setIsOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
