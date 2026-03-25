import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  const handleCheckout = async () => {
    if (!user) {
      setIsOpen(false);
      navigate("/auth");
      return;
    }
    setPlacing(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ user_id: user.id, total, status: "pending", notes: orderNotes.trim() || null })
      .select()
      .single();

    if (error || !order) {
      toast.error("Failed to place order");
      setPlacing(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product?.name || "Product",
      quantity: item.quantity,
      unit_price: Number(item.product?.price || 0),
    }));

    await supabase.from("order_items").insert(orderItems);
    await clearCart();
    setOrderNotes("");
    setPlacing(false);
    setIsOpen(false);
    toast.success("Order placed successfully!");
    navigate("/profile");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-background z-50 flex flex-col shadow-hover"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Cart ({itemCount})
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-body text-sm text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 bg-card rounded-xl p-3 border border-border/50">
                      {item.product?.image_url && (
                        <img src={item.product.image_url} alt={item.product?.name} className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-foreground truncate">{item.product?.name}</p>
                        <p className="font-body text-xs text-muted-foreground">₹{Number(item.product?.price || 0).toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-secondary rounded transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-body text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-secondary rounded transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeItem(item.id)} className="ml-auto p-1 hover:bg-destructive/10 rounded text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-border space-y-3">
                <div>
                  <label className="font-body text-xs font-medium text-foreground mb-1 block">
                    Remarks / Allergy Note
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Allergic to any food or ingredients? Let us know here…"
                    maxLength={500}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">₹{total.toLocaleString()}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity shadow-soft disabled:opacity-50"
                >
                  {placing ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
