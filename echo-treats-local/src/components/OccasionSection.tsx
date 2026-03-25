import { motion } from "framer-motion";
import { Heart, Gift, Baby, PartyPopper, Gem, Cake, Sparkles, Star } from "lucide-react";

const occasions = [
  { icon: Cake, label: "Birthday", color: "bg-blush" },
  { icon: Heart, label: "Anniversary", color: "bg-peach" },
  { icon: Sparkles, label: "Festive", color: "bg-cream" },
  { icon: Gem, label: "Wedding", color: "bg-nude" },
  { icon: Baby, label: "Baby Shower", color: "bg-blush" },
  { icon: Gift, label: "Corporate", color: "bg-secondary" },
  { icon: PartyPopper, label: "Celebration", color: "bg-peach" },
  { icon: Star, label: "Seasonal", color: "bg-cream" },
];

const OccasionSection = () => {
  return (
    <section id="occasions" className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">Craft by Occasion</h2>
          <p className="font-body text-muted-foreground text-sm max-w-md mx-auto">Find the perfect treat for every celebration</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          {occasions.map((occ, i) => (
            <motion.button
              key={occ.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`${occ.color} rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-card hover:-translate-y-1 transition-all duration-300`}
            >
              <occ.icon className="w-7 h-7 text-primary" />
              <span className="font-body font-medium text-sm text-foreground">{occ.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OccasionSection;
