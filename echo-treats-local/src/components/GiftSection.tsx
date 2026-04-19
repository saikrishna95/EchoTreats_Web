import { motion } from "framer-motion";
import { Gift, ShoppingBag, Heart, Star, Package, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const giftOptions = [
  {
    icon: Gift,
    title: "Chocolate Hamper",
    desc: "Curated assortment of premium handcrafted chocolates in a beautiful gift box",
    color: "bg-nude",
  },
  {
    icon: Package,
    title: "Dessert Box",
    desc: "A mix of our bestselling brownies, cookies & treats — perfect for sharing",
    color: "bg-blush",
  },
  {
    icon: Sparkles,
    title: "Festive Gift Pack",
    desc: "Seasonal specials wrapped in festive packaging for every celebration",
    color: "bg-peach",
  },
  {
    icon: Heart,
    title: "Couple's Sweet Box",
    desc: "Romantic assortment of treats for anniversaries, date nights & proposals",
    color: "bg-blush",
  },
  {
    icon: ShoppingBag,
    title: "Corporate Gifting",
    desc: "Branded treat boxes for teams, clients & events — custom quantities available",
    color: "bg-cream",
  },
  {
    icon: Star,
    title: "Birthday Surprise Box",
    desc: "Make birthdays sweeter with a personalised assortment of their favourite treats",
    color: "bg-nude",
  },
];

const GiftSection = () => {
  const navigate = useNavigate();

  return (
    <section id="gifts" className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">Gift Boxes & Hampers</h2>
          <p className="font-body text-muted-foreground text-sm max-w-md mx-auto">
            The sweetest way to say it — curated gift sets for every occasion and everyone you love
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {giftOptions.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`${item.color} rounded-2xl p-6 flex gap-4 hover:shadow-card hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
              onClick={() => navigate("/custom", { state: { returnToSection: "custom" } })}
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center shadow-soft">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <button
            onClick={() => {
              const el = document.getElementById("custom");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 font-body text-sm font-medium text-foreground border border-border rounded-full hover:bg-secondary transition-colors"
          >
            <Gift className="w-4 h-4" />
            Order a Custom Gift Box
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default GiftSection;
