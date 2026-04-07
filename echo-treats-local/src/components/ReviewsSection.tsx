import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

const reviews = [
  { name: "@sweet.tooth", text: "Amazing cupcakes! The flavors are incredible and so beautifully decorated.", rating: 4.8 },
  { name: "@yum.mummy", text: "Delicious cakes! Thank you for making my daughter's birthday so special.", rating: 5 },
  { name: "@foodie.hyd", text: "Best cookies in town. The packaging is so premium and thoughtful.", rating: 4.9 },
  { name: "@cake.lover", text: "Ordered a custom wedding cake — absolutely stunning. Everyone loved it!", rating: 5 },
];

const ReviewsSection = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  return (
    <section id="reviews" className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-gold text-gold" />
            ))}
          </div>
          <p className="font-body text-sm font-semibold text-foreground mb-1">217 reviews</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">What Our Customers Say</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className={`w-3.5 h-3.5 ${j < Math.floor(review.rating) ? "fill-gold text-gold" : "text-border"}`} />
                ))}
                <span className="text-xs font-body font-medium text-muted-foreground ml-1">{review.rating}</span>
              </div>
              <p className="font-body text-sm text-foreground mb-3 line-clamp-3">"{review.text}"</p>
              <p className="font-body text-xs text-muted-foreground font-medium">{review.name}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <button onClick={() => setFeedbackOpen(true)} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-body text-sm font-medium rounded-full hover:opacity-90 transition-opacity shadow-soft">
            <MessageCircle className="w-4 h-4" />
            Leave Feedback
          </button>
          <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
