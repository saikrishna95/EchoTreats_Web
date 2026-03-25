import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import img1 from "@/assets/product-cake-1.jpg";
import img2 from "@/assets/product-cupcake-1.jpg";
import img3 from "@/assets/product-cookies-1.jpg";
import img4 from "@/assets/product-cake-3.jpg";
import img5 from "@/assets/product-cheesecake-1.jpg";
import img6 from "@/assets/product-tub-1.jpg";

const images = [img1, img2, img3, img4, img5, img6];

const InstagramSection = () => {
  return (
    <section className="py-16 md:py-20 gradient-rose">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground">@echotreats</h2>
            <Instagram className="w-6 h-6 text-primary" />
          </div>
          <p className="font-body text-muted-foreground text-sm">Follow us on Instagram for daily inspiration</p>
        </motion.div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {images.map((img, i) => (
            <motion.a
              key={i}
              href="https://instagram.com/echo.treats"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="aspect-square rounded-xl overflow-hidden group"
            >
              <img src={img} alt="Instagram post" loading="lazy" width={640} height={640} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <a
            href="https://instagram.com/echo.treats"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-body text-sm font-medium rounded-full hover:opacity-90 transition-opacity shadow-soft"
          >
            Follow Us
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default InstagramSection;
