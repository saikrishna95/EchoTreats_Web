import { motion } from "framer-motion";
import { ShoppingBag, Eye, Heart } from "lucide-react";
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
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={640}
            height={640}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

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

          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              type="button"
              aria-label="View product details"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
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
