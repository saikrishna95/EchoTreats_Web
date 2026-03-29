import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { mapDbProduct } from "@/lib/productMapper";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bakery.jpg";
import logo from "@/assets/logo.png";
import ProductDetailModal from "@/components/ProductDetailModal";
import type { Database } from "@/integrations/supabase/types";

import imgCake from "@/assets/category_logo/cake.png";
import imgBrownie from "@/assets/category_logo/brownie.png";
import imgChocolate from "@/assets/category_logo/choco-logo.png";
import imgCupcake from "@/assets/category_logo/cupcake.png";
import imgTub from "@/assets/category_logo/tub.png";
import imgCheesecake from "@/assets/category_logo/cheesecake.png";
import imgCookie from "@/assets/category_logo/cookie.png";
import imgCustom from "@/assets/category_logo/custom.png";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const categories = [
  { img: imgCake, label: "Cakes", href: "#cakes" },
  { img: imgBrownie, label: "Brownies", href: "#brownies" },
  { img: imgChocolate, label: "Chocolates", href: "#chocolates" },
  { img: imgCupcake, label: "Cupcakes", href: "#cupcakes" },
  { img: imgTub, label: "Tub Desserts", href: "#tubs" },
  { img: imgCheesecake, label: "Cheesecakes", href: "#cheesecakes" },
  { img: imgCookie, label: "Cookies", href: "#cookies" },
  { img: imgCustom, label: "Customise", href: "#custom" },
];

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtered = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 6)
      .map((p) => ({ raw: p, mapped: mapDbProduct(p) }));
  }, [products, query]);

  const handleAdd = async (productId: string, productName: string) => {
    if (!user) {
      toast.info("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }

    await addToCart(productId);
    toast.success(`${productName} added to cart`);
  };

  return (
    <>
    <section id="hero-section" className="relative overflow-hidden gradient-hero lg:min-h-screen">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-blush/80 via-background/60 to-background" />
      </div>

      <div className="relative container flex flex-col lg:min-h-screen lg:justify-between pt-16 portrait:md:pt-14 landscape:md:pt-20 lg:pt-10 pb-6 gap-5 lg:gap-0">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <img src={logo} alt="Echo Treats" className="h-14 md:h-20 lg:h-24 object-contain drop-shadow-md" />
        </motion.div>

        {/* Centre content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex flex-col items-center text-center max-w-2xl mx-auto w-full"
        >
          <p className="text-xs md:text-sm tracking-widest text-muted-foreground mb-1 md:mb-2">WELCOME TO ECHOTREATS</p>

          <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-2 md:mb-3">
            Deliciously Made
            <br />
            <span className="italic text-primary">Bakery</span> Treats
          </h1>

          <p className="text-muted-foreground text-sm md:text-base mb-3 md:mb-5">
            Artisan & custom, made-to-order
            <br />
            From our kitchen to your celebrations
          </p>

          <div className="flex justify-center gap-3 flex-wrap mt-4 mb-4 md:mt-0 md:mb-5">
            <button
              type="button"
              onClick={() => scrollTo("#products")}
              className="px-8 py-2.5 bg-primary text-white rounded-full shadow-md hover:scale-105 transition text-sm"
            >
              View Menu
            </button>
            <button
              type="button"
              onClick={() => scrollTo("#custom")}
              className="px-8 py-2.5 bg-white/70 border rounded-full shadow-md hover:scale-105 transition text-sm"
            >
              Custom Orders
            </button>
          </div>

          {/* Search */}
          <div className="w-full max-w-md relative mb-4 md:mb-0">
            <div className="w-full flex items-center rounded-full border bg-white/80 backdrop-blur shadow-md px-4 py-2.5 gap-2">
              <Search className="w-4 h-4 text-foreground/50 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search treats..."
                aria-label="Search treats"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {filtered.length > 0 && (
              <div className="absolute w-full bg-white mt-2 rounded-xl shadow max-h-60 overflow-auto z-10">
                {filtered.map(({ raw, mapped: p }) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedProduct(raw); setQuery(""); }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                      <div className="text-left min-w-0">
                        <p className="text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.price}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleAdd(p.id, p.name); }}
                      className="shrink-0 px-3 py-1.5 text-xs rounded-full bg-primary text-white hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Category buttons */}
        <div>
          {/* Mobile: 4×2 grid */}
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 md:hidden">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => scrollTo(cat.href)}
                className="flex flex-col items-center justify-end gap-1.5 hover:scale-105 transition"
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-14 h-14 object-contain drop-shadow-md"
                />
                <span className="text-xs text-center leading-tight font-medium drop-shadow">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop: single row */}
          <div className="hidden md:flex md:justify-center md:gap-8 lg:gap-10">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => scrollTo(cat.href)}
                className="flex flex-col items-center justify-end gap-2 hover:scale-105 transition"
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-14 h-14 lg:w-16 lg:h-16 object-contain drop-shadow-md"
                />
                <span className="text-sm text-center leading-tight font-medium drop-shadow">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>

    <ProductDetailModal
      product={selectedProduct}
      open={!!selectedProduct}
      onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
    />
  </>
  );
};

export default HeroSection;
