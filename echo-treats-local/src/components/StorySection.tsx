import { motion } from "framer-motion";
import storyImg from "@/assets/about_logo.jpg";

const StorySection = () => {
  return (
    <section id="story" className="pt-16 md:pt-20 pb-4 md:pb-6">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl overflow-hidden shadow-card"
          >
            <img src={storyImg} alt="Our bakery story" loading="lazy" width={800} height={800} className="w-full h-auto object-cover" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Our Story</p>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-4 leading-tight">
              From Hobby to<br /><span className="italic text-primary">Home Bakery</span> 💕
            </h2>
            <div className="space-y-4 font-body text-sm text-muted-foreground leading-relaxed">
              <p>
                Echo Treats began as a simple love for baking - a hobby that grew into something much more meaningful.
                What began in a small home kitchen is now a beloved artisan cloud bakery, crafting made-to-order treats
                with care and creativity.
              </p>
              <p>
                Every cake we bake, every cookie we shape, and every dessert we layer is a reflection of our commitment
                to quality, freshness, and thoughtful design. We believe in small-batch care, premium ingredients, and
                making every order feel personal.
              </p>
              <p>
                If we wouldn’t enjoy it ourselves, we wouldn’t serve it. That’s our promise to you.
              </p>
            </div>
            <p className="mt-4 font-body text-sm font-bold text-foreground">- Indulge in Treats that Echo delight</p>
            <p className="mt-2 font-body text-xs text-muted-foreground">📍&nbsp; &nbsp;Hyderabad</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
