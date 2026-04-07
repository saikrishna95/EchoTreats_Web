import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShoppingBag, Minus, Plus, Palette, Leaf, ChefHat, ShieldCheck, Gift, CalendarDays, Heart, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { homeSectionPath } from "@/lib/homeSections";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

interface ProductDetailModalProps {
  product: ProductRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailModal = ({ product, open, onOpenChange }: ProductDetailModalProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = async () => {
    if (!user) {
      toast.info("Please sign in to place an order");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      await addToCart(product.id);
    }

    toast.success(`${quantity}x ${product.name} added to cart`);
    setQuantity(1);
    onOpenChange(false);
  };

  const handleCustomise = () => {
    onOpenChange(false);
    navigate(homeSectionPath("custom"));
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.info("Please sign in to save wishlist items");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    const added = await toggleWishlist(product.id);
    toast.success(added ? `${product.name} added to wishlist` : `${product.name} removed from wishlist`);
  };

  const tags = product.tags || [];
  const wished = isInWishlist(product.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setQuantity(1);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border/50 gap-0">
        <div className="relative bg-secondary/20 pt-12">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 left-3 z-10 p-2.5 bg-background/85 backdrop-blur-sm rounded-full shadow-card transition-colors hover:bg-background"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-64 sm:h-72 object-contain"
          />

          <button
            type="button"
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 z-10 p-2.5 bg-background/85 backdrop-blur-sm rounded-full shadow-card transition-colors hover:bg-background"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${wished ? "fill-rose text-rose" : "text-muted-foreground"}`}
            />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 text-xs font-body font-medium text-muted-foreground"
                >
                  {tag === "Vegetarian" && <Leaf className="w-3.5 h-3.5 text-green-600" />}
                  {tag === "Freshly Baked" && <ChefHat className="w-3.5 h-3.5 text-primary" />}
                  {tag === "Halal" && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                  {!["Vegetarian", "Freshly Baked", "Halal"].includes(tag) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-heading text-xl font-bold text-foreground leading-tight">{product.name}</h2>

          {product.description && (
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <p className="font-heading text-2xl font-bold text-foreground">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center border border-border rounded-full">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 hover:bg-secondary rounded-l-full transition-colors"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>

              <span className="w-10 text-center font-body font-semibold text-sm text-foreground">{quantity}</span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 hover:bg-secondary rounded-r-full transition-colors"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-foreground text-background rounded-full font-body font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" />
              Add To Cart
            </button>
          </div>

          <button
            type="button"
            onClick={handleCustomise}
            className="w-full flex items-center justify-center gap-2 h-10 border border-primary/30 text-primary rounded-full font-body font-medium text-sm hover:bg-primary/5 transition-colors"
          >
            <Palette className="w-4 h-4" />
            Customise This Product
          </button>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2.5 text-xs font-body text-muted-foreground">
              <CalendarDays className="w-4 h-4 text-muted-foreground/70" />
              Schedule delivery date in cart
            </div>
            <div className="flex items-center gap-2.5 text-xs font-body text-muted-foreground">
              <Gift className="w-4 h-4 text-muted-foreground/70" />
              Add a free gift message in cart
            </div>
          </div>

          <Accordion type="multiple" className="w-full border-t border-border">
            {product.description && (
              <AccordionItem value="description" className="border-b border-border">
                <AccordionTrigger className="font-heading text-base font-semibold text-foreground py-4 hover:no-underline">
                  Description
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-4">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="freshness" className="border-b border-border">
              <AccordionTrigger className="font-heading text-base font-semibold text-foreground py-4 hover:no-underline">
                Freshness & Storage
              </AccordionTrigger>
              <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-4">
                Best consumed within 2-3 days of delivery. Store in a cool, dry place away from direct sunlight.
                Refrigerate for longer freshness.
              </AccordionContent>
            </AccordionItem>

            {product.ingredients && (
              <AccordionItem value="ingredients" className="border-b border-border">
                <AccordionTrigger className="font-heading text-base font-semibold text-foreground py-4 hover:no-underline">
                  Ingredients
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-4">
                  {product.ingredients}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="allergens" className="border-b-0">
              <AccordionTrigger className="font-heading text-base font-semibold text-foreground py-4 hover:no-underline">
                Allergens
              </AccordionTrigger>
              <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-4">
                May contain traces of nuts, dairy, eggs, wheat, and soy. Please contact us if you have specific allergy
                concerns.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
