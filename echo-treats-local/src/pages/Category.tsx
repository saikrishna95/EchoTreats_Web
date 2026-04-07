import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { mapDbProduct } from "@/lib/productMapper";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import Navbar from "@/components/Navbar";
import SlideMenu from "@/components/SlideMenu";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { homeSectionPath } from "@/lib/homeSections";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getProductsByCategory, categories, loading } = useProducts();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const category = categories.find((c) => c.slug === slug);
  const rawProducts = slug ? getProductsByCategory(slug) : [];
  const products = rawProducts.map(mapDbProduct);

  const handleProductClick = (productId: string) => {
    const raw = rawProducts.find((p) => p.id === productId);
    if (raw) setSelectedProduct(raw);
  };

  const returnSection = (location.state as { returnToSection?: string } | null)?.returnToSection || slug;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar onMenuOpen={() => setMenuOpen(true)} />
      <SlideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <CartDrawer />

      <main className="pt-20 md:pt-24">
        <div className="container py-8 md:py-12">
          <button
            type="button"
            onClick={() => navigate(homeSectionPath(returnSection))}
            className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </button>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
              {category?.name || slug || "All Products"}
            </h1>

            {category?.description && (
              <p className="font-body text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                {category.description}
              </p>
            )}

            <p className="font-body text-muted-foreground text-xs mt-2">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </motion.div>

          {loading ? (
            <div className="py-20 text-center font-body text-muted-foreground">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center font-body text-muted-foreground">No products in this category yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default Category;
