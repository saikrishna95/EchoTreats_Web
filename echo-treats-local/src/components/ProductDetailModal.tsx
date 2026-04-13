import { useState, useRef } from "react";
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
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const mediaUrls: { type: "image" | "video" | "gif"; url: string }[] =
    ((product as any).media_urls as { type: "image" | "video" | "gif"; url: string }[] | null) || [];
  const hasMedia = mediaUrls.length > 0;
  const activeMedia = hasMedia ? mediaUrls[activeMediaIdx] : null;

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
        if (!v) { setQuantity(1); setActiveMediaIdx(0); }
      }}
    >
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-3xl border border-border/40 shadow-[0_8px_40px_rgba(0,0,0,0.18)] gap-0 bg-background">

        {/* ── Media zone ─────────────────────────────────────────── */}
        <div className="relative px-5 pt-5 pb-3" style={{ background: "linear-gradient(160deg, hsl(350 40% 96%), hsl(35 40% 97%))" }}>

          {/* Back button */}
          <button
            type="button"
            aria-label="Go back"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 left-4 z-10 p-2 bg-background/80 backdrop-blur-md rounded-full shadow-md border border-border/30 hover:bg-background transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>

          {/* Heart button */}
          <button
            type="button"
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            onClick={handleToggleWishlist}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 backdrop-blur-md rounded-full shadow-md border border-border/30 hover:bg-background transition-colors"
          >
            <Heart className={`w-4 h-4 transition-colors ${wished ? "fill-rose text-rose" : "text-muted-foreground"}`} />
          </button>

          {/* Main media frame — centered, capped size, gold border */}
          <div className="flex justify-center">
            <div className="rounded-2xl border border-gold/35 shadow-[0_4px_20px_rgba(0,0,0,0.10)] overflow-hidden inline-flex">
              {activeMedia?.type === "video" ? (
                <video
                  key={activeMedia.url}
                  src={activeMedia.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  style={{ maxWidth: "min(340px, 80vw)", maxHeight: "240px", display: "block" }}
                />
              ) : (
                <img
                  src={activeMedia?.url || product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  style={{ maxWidth: "min(340px, 80vw)", maxHeight: "240px", display: "block", objectFit: "contain" }}
                />
              )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {hasMedia && mediaUrls.length > 1 && (
            <div ref={scrollRef} className="flex gap-2.5 pt-3 pb-1 overflow-x-auto scrollbar-none justify-center">
              {mediaUrls.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveMediaIdx(i)}
                  className={`shrink-0 w-13 h-13 rounded-xl overflow-hidden border-2 transition-all shadow-sm ${
                    i === activeMediaIdx
                      ? "border-gold/70 scale-105 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                      : "border-border/40 opacity-70 hover:opacity-100 hover:border-gold/40"
                  }`}
                  style={{ width: 52, height: 52 }}
                >
                  {m.type === "video" ? (
                    <video src={m.url} muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product details ─────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-6 space-y-4">

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/40 text-xs font-body font-medium text-muted-foreground"
                >
                  {tag === "Vegetarian" && <Leaf className="w-3 h-3 text-green-600" />}
                  {tag === "Freshly Baked" && <ChefHat className="w-3 h-3 text-primary" />}
                  {tag === "Halal" && <ShieldCheck className="w-3 h-3 text-primary" />}
                  {!["Vegetarian", "Freshly Baked", "Halal"].includes(tag) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  )}
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Name + price row */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-foreground leading-tight flex-1">{product.name}</h2>
            <p className="font-heading text-2xl font-bold text-gold shrink-0">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Short description */}
          {product.description && (
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center border border-border rounded-full bg-secondary/30">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 hover:bg-secondary rounded-l-full transition-colors"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              <span className="w-9 text-center font-body font-semibold text-sm text-foreground">{quantity}</span>
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
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-foreground text-background rounded-full font-body font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-soft"
            >
              <ShoppingBag className="w-4 h-4" />
              Add To Cart
            </button>
          </div>

          {/* Customise */}
          <button
            type="button"
            onClick={handleCustomise}
            className="w-full flex items-center justify-center gap-2 h-10 border border-primary/40 text-primary rounded-full font-body font-medium text-sm hover:bg-primary/10 transition-colors"
          >
            <Palette className="w-4 h-4" />
            Customise This Product
          </button>

          {/* Perks */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30 text-xs font-body text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5 text-primary/60" />
              Schedule delivery in cart
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30 text-xs font-body text-muted-foreground">
              <Gift className="w-3.5 h-3.5 text-primary/60" />
              Free gift message in cart
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 pt-1" />

          {/* Accordion */}
          <Accordion type="multiple" className="w-full">
            {product.description && (
              <AccordionItem value="description" className="border-b border-border/50">
                <AccordionTrigger className="font-heading text-sm font-semibold text-foreground py-3.5 hover:no-underline">
                  Description
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-4">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="freshness" className="border-b border-border/50">
              <AccordionTrigger className="font-heading text-sm font-semibold text-foreground py-3.5 hover:no-underline">
                Freshness &amp; Storage
              </AccordionTrigger>
              <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-4">
                Best consumed within 2–3 days of delivery. Store in a cool, dry place away from direct sunlight.
                Refrigerate for longer freshness.
              </AccordionContent>
            </AccordionItem>

            {product.ingredients && (
              <AccordionItem value="ingredients" className="border-b border-border/50">
                <AccordionTrigger className="font-heading text-sm font-semibold text-foreground py-3.5 hover:no-underline">
                  Ingredients
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-4">
                  {product.ingredients}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="allergens" className="border-b-0">
              <AccordionTrigger className="font-heading text-sm font-semibold text-foreground py-3.5 hover:no-underline">
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
