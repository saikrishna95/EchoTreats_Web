import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cake, Square, Candy, Box, CakeSlice, Cookie, Sparkles, ChefHat, Search } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { mapDbProduct } from "@/lib/productMapper";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bakery.jpg";
import logo from "@/assets/logo.png";

const categories = [
  { icon: Cake, label: "Cakes", href: "#cakes" },
  { icon: Square, label: "Brownies", href: "#brownies" },
  { icon: Candy, label: "Chocolates", href: "#chocolates" },
  { icon: ChefHat, label: "Cupcakes", href: "#cupcakes" },
  { icon: Box, label: "Tub Desserts", href: "#tubs" },
  { icon: CakeSlice, label: "Cheesecakes", href: "#cheesecakes" },
  { icon: Cookie, label: "Cookies", href: "#cookies" },
  { icon: Sparkles, label: "Customise", href: "#custom" },
];

const HeroSection = () => {
  const [query, setQuery] = useState("");
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
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice(0, 6)
      .map(mapDbProduct);
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
    <section id="hero-section" className="relative overflow-hidden gradient-hero min-h-[90vh]">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-blush/80 via-background/60 to-background" />
      </div>

      <div className="relative container pt-12 pb-6 md:pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mt-1 mb-2"
        >
          <img src={logo} alt="Echo Treats" className="h-14 md:h-20 object-contain" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-xs md:text-sm tracking-widest text-muted-foreground mb-2">WELCOME TO ECHOTREATS</p>

          <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-3">
            Deliciously Made
            <br />
            <span className="italic text-primary">Bakery</span> Treats
          </h1>

          <p className="text-muted-foreground mb-6">
            Artisan & custom, made-to-order
            <br />
            From our kitchen to your celebrations
          </p>

          <div className="flex justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => scrollTo("#products")}
              className="px-6 py-3 bg-primary text-white rounded-full hover:scale-105 transition"
            >
              View Menu
            </button>

            <button
              type="button"
              onClick={() => scrollTo("#custom")}
              className="px-6 py-3 bg-white/70 border rounded-full hover:scale-105 transition"
            >
              Custom Orders
            </button>
          </div>
        </motion.div>

        <div className="mt-6 max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search treats..."
            aria-label="Search treats"
            className="w-full pl-10 pr-4 py-3 rounded-full border bg-white/80 backdrop-blur"
          />

          {filtered.length > 0 && (
            <div className="absolute w-full bg-white mt-2 rounded-xl shadow max-h-60 overflow-auto z-10">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3 hover:bg-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                    <div className="text-left min-w-0">
                      <p className="text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(p.id, p.name)}
                    className="shrink-0 px-3 py-1.5 text-xs rounded-full bg-primary text-white hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile: 4 top + 4 bottom | Tablet/Desktop: single horizontal row */}
        <div className="mt-4">
          <div className="grid grid-cols-4 gap-3 md:hidden">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => scrollTo(cat.href)}
                className="w-full min-h-[92px] px-2 py-3 rounded-xl bg-white/70 backdrop-blur border hover:scale-105 transition flex flex-col items-center justify-center"
              >
                <cat.icon className="mb-2 w-5 h-5 text-primary" />
                <span className="text-xs text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex md:justify-center md:gap-4 lg:gap-5 md:flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => scrollTo(cat.href)}
                className="w-[110px] lg:w-[120px] min-h-[108px] px-3 py-4 rounded-2xl bg-white/70 backdrop-blur border hover:scale-105 transition flex flex-col items-center justify-center"
              >
                <cat.icon className="mb-3 w-6 h-6 text-primary" />
                <span className="text-sm text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
