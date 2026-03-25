import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { mapDbProduct } from "@/lib/productMapper";

const WhatsNewSection = () => {
  const { getFeatured, loading } = useProducts();
  const featured = getFeatured().slice(0, 4).map(mapDbProduct);

  if (loading || featured.length === 0) return null;

  return (
    <section className="py-16 md:py-20 gradient-rose">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">What's Dropping Next...</h2>
          <p className="font-body text-muted-foreground text-sm max-w-md mx-auto">Seasonal launches, limited editions & festive picks</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatsNewSection;
