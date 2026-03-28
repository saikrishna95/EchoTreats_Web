import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductCard, { type Product } from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

interface ProductSectionProps {
  id: string;
  title: string;
  subtitle: string;
  products: Product[];
  rawProducts?: ProductRow[];
  accent?: boolean;
  categorySlug?: string;
}

const ProductSection = ({ id, title, subtitle, products, rawProducts, accent, categorySlug }: ProductSectionProps) => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);

  const handleProductClick = (productId: string) => {
    const raw = rawProducts?.find(p => p.id === productId);
    if (raw) setSelectedProduct(raw);
  };

  return (
    <section id={id} className={`py-16 md:py-20 ${accent ? "gradient-warm" : ""}`}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">{title}</h2>
          <p className="font-body text-muted-foreground text-sm md:text-base max-w-md mx-auto">{subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onClick={() => handleProductClick(product.id)} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <button
            onClick={() => navigate(categorySlug ? `/category/${categorySlug}` : `/#${id}`, categorySlug ? { state: { returnToSection: id } } : undefined)}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 font-body text-sm font-medium text-foreground border border-border rounded-full hover:bg-secondary transition-colors whitespace-nowrap"
          >
            View Full Collection
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
      />
    </section>
  );
};

export default ProductSection;
