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

  const firstName = user
    ? (user.user_metadata?.first_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
      user.email?.split("@")[0] ||
      "there"
    : null;

  const welcomeText = firstName
    ? `HI ${firstName.toUpperCase()}, WELCOME TO ECHOTREATS`
    : "WELCOME TO ECHOTREATS";

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtered = useMemo(() => {
    if (query.trim().length < 2) return [];

    const q = query.toLowerCase();

    return products
      .filter(
        (p) =>
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

  const renderButtons = (buttonClassName = "") => (
    <div className="flex justify-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={() => scrollTo("#products")}
        className={`px-6 py-3 bg-primary text-white rounded-full hover:scale-105 transition ${buttonClassName}`}
      >
        View Menu
      </button>

      <button
        type="button"
        onClick={() => scrollTo("#custom")}
        className={`px-6 py-3 bg-white/70 border rounded-full hover:scale-105 transition ${buttonClassName}`}
      >
        Custom Orders
      </button>
    </div>
  );

  const renderSearch = (wrapperClassName = "", maxWidthClassName = "max-w-md") => (
    <div className={wrapperClassName}>
      <div className={`${maxWidthClassName} mx-auto relative`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-[1]" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search treats..."
          aria-label="Search treats"
          className="w-full pl-10 pr-4 py-3 rounded-full border bg-white/80 backdrop-blur shadow-sm"
        />

        {filtered.length > 0 && (
          <div className="absolute w-full bg-white mt-2 rounded-xl shadow max-h-60 overflow-auto z-20">
            {filtered.map(({ raw, mapped: p }) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedProduct(raw);
                  setQuery("");
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="text-left min-w-0">
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.price}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(p.id, p.name);
                  }}
                  className="shrink-0 px-3 py-1.5 text-xs rounded-full bg-primary text-white hover:opacity-90"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderIconItem = (
    cat: { img: string; label: string; href: string },
    imgClassName: string,
    textClassName: string
  ) => (
    <button
      key={cat.label}
      type="button"
      onClick={() => scrollTo(cat.href)}
      className="flex flex-col items-center justify-start hover:scale-105 transition"
    >
      <img
        src={cat.img}
        alt={cat.label}
        className={`${imgClassName} object-contain`}
      />
      <span className={`${textClassName} text-center leading-tight mt-2`}>
        {cat.label}
      </span>
    </button>
  );

  return (
    <>
      <section
        id="hero-section"
        className="relative overflow-hidden gradient-hero min-h-[90vh]"
      >
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blush/80 via-background/60 to-background" />
        </div>

        {/* MOBILE */}
        <div className="relative container pt-12 pb-6 md:hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mt-1 mb-2"
          >
            <img src={logo} alt="Echo Treats" className="h-14 object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-xs tracking-widest text-muted-foreground mb-2">
              {welcomeText}
            </p>

            <h1 className="text-4xl font-semibold leading-tight mb-3">
              Deliciously Made
              <br />
              <span className="italic text-primary">Bakery</span> Treats
            </h1>

            <p className="text-muted-foreground mb-6">
              Artisan & custom, made-to-order
              <br />
              From our kitchen to your celebrations
            </p>

            {renderButtons("text-sm")}
          </motion.div>

          {renderSearch("mt-6", "max-w-md")}

          <div className="mt-6">
            <div className="grid grid-cols-4 gap-x-3 gap-y-5">
              {categories.map((cat) => renderIconItem(cat, "w-10 h-10", "text-xs"))}
            </div>
          </div>
        </div>

        {/* TABLET */}
        <div className="relative container hidden md:block lg:hidden pt-10 pb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mt-1 mb-2"
          >
            <img src={logo} alt="Echo Treats" className="h-14 object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-sm tracking-widest text-muted-foreground mb-2">
              {welcomeText}
            </p>

            <h1 className="text-5xl font-semibold leading-tight mb-3">
              Deliciously Made
              <br />
              <span className="italic text-primary">Bakery</span> Treats
            </h1>

            <p className="text-base text-muted-foreground mb-5">
              Artisan & custom, made-to-order
              <br />
              From our kitchen to your celebrations
            </p>

            {renderButtons("text-base")}
          </motion.div>

          {renderSearch("mt-5", "max-w-lg")}

          <div className="mt-10 max-w-5xl mx-auto">
            <div className="grid grid-cols-5 gap-x-4 items-start">
              {categories.slice(0, 5).map((cat) =>
                renderIconItem(cat, "w-11 h-11", "text-sm")
              )}
            </div>

            <div className="grid grid-cols-3 gap-x-6 items-start max-w-3xl mx-auto mt-6">
              {categories.slice(5, 8).map((cat) =>
                renderIconItem(cat, "w-11 h-11", "text-sm")
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="relative container hidden lg:block pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mt-0 mb-1"
          >
            <img src={logo} alt="Echo Treats" className="h-14 object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-sm tracking-widest text-muted-foreground mb-2">
              {welcomeText}
            </p>

            <h1 className="text-6xl font-semibold leading-[0.95] mb-2">
              Deliciously Made
              <br />
              <span className="italic text-primary">Bakery</span> Treats
            </h1>

            <p className="text-muted-foreground mb-4">
              Artisan & custom, made-to-order
              <br />
              From our kitchen to your celebrations
            </p>

            {renderButtons()}
          </motion.div>

          {renderSearch("mt-4", "max-w-md")}

          <div className="mt-6">
            <div className="flex justify-center gap-8 flex-wrap">
              {categories.map((cat) => renderIconItem(cat, "w-12 h-12", "text-sm"))}
            </div>
          </div>
        </div>
      </section>

      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      />
    </>
  );
};

export default HeroSection;