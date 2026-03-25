import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { mapDbProduct } from "@/lib/productMapper";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SearchOverlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const filtered = query.trim().length < 2
    ? []
    : products
        .filter((p) => {
          const q = query.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q)) ||
            (p.tags?.some((t) => t.toLowerCase().includes(q)))
          );
        })
        .slice(0, 8)
        .map(mapDbProduct);

  const handleAdd = async (productId: string, productName: string) => {
    if (!user) {
      toast.info("Please sign in to add items to cart");
      onClose();
      navigate("/auth");
      return;
    }
    await addToCart(productId);
    toast.success(`${productName} added to cart`);
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
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background shadow-hover"
          >
            <div className="container py-4">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cakes, cupcakes, chocolates..."
                  className="flex-1 bg-transparent font-body text-base text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors shrink-0">
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {query.trim().length >= 2 && (
              <div className="border-t border-border">
                <div className="container py-4 max-h-[60vh] overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-center font-body text-sm text-muted-foreground py-8">
                      No products found for "{query}"
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filtered.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleAdd(product.id, product.name)}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-medium text-foreground truncate">
                              {product.name}
                            </p>
                            <p className="font-body text-xs text-muted-foreground truncate">
                              {product.description}
                            </p>
                          </div>
                          <span className="font-body text-sm font-semibold text-foreground shrink-0">
                            {product.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
