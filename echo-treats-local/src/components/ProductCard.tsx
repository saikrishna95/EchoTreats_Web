import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  tags?: string[];
  mediaUrls?: { type: "image" | "video" | "gif"; url: string }[];
}

interface ProductCardProps {
  product: Product;
  index: number;
  onClick?: () => void;
}

const tagColors: Record<string, string> = {
  "Best Seller": "bg-primary text-primary-foreground",
  Bestseller: "bg-primary text-primary-foreground",
  New: "bg-gold text-primary-foreground",
  Limited: "bg-rose text-primary-foreground",
  "Limited Edition": "bg-rose text-primary-foreground",
  Festive: "bg-peach text-foreground",
  Customise: "bg-secondary text-secondary-foreground",
  "Eggless Available": "bg-secondary text-secondary-foreground",
  Premium: "bg-secondary text-secondary-foreground",
  Nutty: "bg-secondary text-secondary-foreground",
};

const ProductCard = ({ product, index, onClick }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const mediaList = product.mediaUrls && product.mediaUrls.length > 0
    ? product.mediaUrls
    : [{ type: "image" as const, url: product.image }];

  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = (idx: number) => setActiveIdx(Math.max(0, Math.min(idx, mediaList.length - 1)));

  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); goTo(activeIdx - 1); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); goTo(activeIdx + 1); };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30) goTo(activeIdx + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.info("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }
    await addToCart(product.id);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.info("Please sign in to save wishlist items");
      navigate("/auth");
      return;
    }
    const added = await toggleWishlist(product.id);
    toast.success(added ? `${product.name} added to wishlist` : `${product.name} removed from wishlist`);
  };

  const wished = isInWishlist(product.id);
  const activeMedia = mediaList[activeIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div
        onClick={onClick}
        className="relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-hover transition-all duration-300 group-hover:-translate-y-1 cursor-pointer"
      >
        {/* Media area */}
        <div
          className="relative aspect-square overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {activeMedia.type === "video" ? (
            <video
              key={activeMedia.url}
              src={activeMedia.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <img
              key={activeMedia.url}
              src={activeMedia.url}
              alt={product.name}
              loading="lazy"
              width={640}
              height={640}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="absolute top-3 left-3 right-16 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className={`max-w-full px-2.5 py-1 text-[10px] font-body font-semibold rounded-full whitespace-nowrap ${
                    tagColors[tag] || "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Wishlist button */}
          <button
            type="button"
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 z-10 p-2 bg-background/85 backdrop-blur-sm rounded-full shadow-card transition-colors hover:bg-background"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${wished ? "fill-rose text-rose" : "text-muted-foreground"}`}
            />
          </button>

          {/* Prev / Next arrows — only when multiple media */}
          {mediaList.length > 1 && activeIdx > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow-card transition-colors hover:bg-background"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          {mediaList.length > 1 && activeIdx < mediaList.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow-card transition-colors hover:bg-background"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          )}

          {/* Dot indicators */}
          {mediaList.length > 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {mediaList.map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all duration-200 ${
                    i === activeIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Quick-action buttons on hover */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              type="button"
              aria-label="View product details"
              onClick={(e) => { e.stopPropagation(); onClick?.(); }}
              className="p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background shadow-card transition-colors"
            >
              <Eye className="w-4 h-4 text-foreground" />
            </button>

            <button
              type="button"
              aria-label="Add product to cart"
              onClick={handleAddToCart}
              className="p-2 bg-primary rounded-full hover:opacity-90 shadow-card transition-opacity"
            >
              <ShoppingBag className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-xs font-body text-muted-foreground mb-2 line-clamp-1">{product.description}</p>
          <p className="font-body font-semibold text-sm text-foreground">{product.price}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
