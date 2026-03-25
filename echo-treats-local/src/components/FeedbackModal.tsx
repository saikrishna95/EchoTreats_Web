import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const ratingQuestions = [
  { key: "taste_rating" as const, label: "Taste & Quality" },
  { key: "presentation_rating" as const, label: "Presentation & Packaging" },
  { key: "service_rating" as const, label: "Service & Delivery" },
];

interface ProductOption {
  id: string;
  name: string;
}

const FeedbackModal = ({ open, onClose }: FeedbackModalProps) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    taste_rating: 0,
    presentation_rating: 0,
    service_rating: 0,
    product_ids: [] as string[],
    comment: "",
  });
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from("products").select("id, name").eq("is_available", true).order("name").then(({ data }) => {
        if (data) setProducts(data);
      });
    }
  }, [open]);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleProduct = (id: string) => {
    setForm(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(id)
        ? prev.product_ids.filter(p => p !== id)
        : [...prev.product_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast.error("Please fill in name, email and phone");
      return;
    }
    if (!form.taste_rating || !form.presentation_rating || !form.service_rating) {
      toast.error("Please rate all three categories");
      return;
    }
    if (form.product_ids.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("feedback" as any).insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      taste_rating: form.taste_rating,
      presentation_rating: form.presentation_rating,
      service_rating: form.service_rating,
      product_ids: form.product_ids,
      comment: form.comment || null,
    } as any);

    if (error) {
      toast.error("Failed to submit feedback");
      setLoading(false);
      return;
    }

    toast.success("Thank you for your feedback!");
    setForm({ name: "", email: "", phone: "", taste_rating: 0, presentation_rating: 0, service_rating: 0, product_ids: [], comment: "" });
    setLoading(false);
    onClose();
  };

  const inputCls = "w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-background rounded-3xl p-6 md:p-8 shadow-card border border-border/50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-semibold text-foreground">Leave Your Feedback</h3>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Name *" value={form.name} onChange={e => update("name", e.target.value)} className={inputCls} required />
                <input type="email" placeholder="Email *" value={form.email} onChange={e => update("email", e.target.value)} className={inputCls} required />
              </div>
              <input type="tel" placeholder="Phone *" value={form.phone} onChange={e => update("phone", e.target.value)} className={inputCls} required />

              {/* Rating questions */}
              <div className="space-y-3">
                <p className="font-body text-sm font-medium text-foreground">Rate your experience *</p>
                {ratingQuestions.map(q => (
                  <div key={q.key} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-3">
                    <span className="font-body text-sm text-foreground">{q.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => update(q.key, star)}
                          className="p-0.5 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              star <= form[q.key]
                                ? "fill-gold text-gold"
                                : "text-border hover:text-gold/50"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Product selection */}
              <div>
                <p className="font-body text-sm font-medium text-foreground mb-2">Products you tried *</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`px-3 py-1.5 rounded-full font-body text-xs font-medium border transition-colors ${
                        form.product_ids.includes(p.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Tell us more about your experience..."
                rows={3}
                value={form.comment}
                onChange={e => update("comment", e.target.value)}
                maxLength={1000}
                className={`${inputCls} resize-none`}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity shadow-soft disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
