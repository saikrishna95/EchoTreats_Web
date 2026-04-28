import { useState, useEffect, useRef } from "react";
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

interface SelectedProduct {
  id?: string;
  name: string;
}

const FeedbackModal = ({ open, onClose }: FeedbackModalProps) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    taste_rating: 0,
    presentation_rating: 0,
    service_rating: 0,
    comment: "",
  });
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productInput, setProductInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      supabase.from("products").select("id, name").eq("is_available", true).order("name").then(({ data }) => {
        if (data) setProducts(data);
      });
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(productInput.toLowerCase()) &&
      !selectedProducts.some(sp => sp.id === p.id)
  );

  const addProduct = (p: ProductOption) => {
    setSelectedProducts(prev => [...prev, { id: p.id, name: p.name }]);
    setProductInput("");
    setShowDropdown(false);
  };

  const addCustom = () => {
    const name = productInput.trim();
    if (!name) return;
    if (selectedProducts.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
    setSelectedProducts(prev => [...prev, { name }]);
    setProductInput("");
    setShowDropdown(false);
  };

  const removeProduct = (name: string) => {
    setSelectedProducts(prev => prev.filter(p => p.name !== name));
  };

  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length === 1) {
        addProduct(filteredProducts[0]);
      } else if (productInput.trim()) {
        addCustom();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-add whatever is still typed in the product input
    const pending = productInput.trim();
    let finalSelected = selectedProducts;
    if (pending && !selectedProducts.some(p => p.name.toLowerCase() === pending.toLowerCase())) {
      const match = products.find(p => p.name.toLowerCase() === pending.toLowerCase());
      finalSelected = match
        ? [...selectedProducts, { id: match.id, name: match.name }]
        : [...selectedProducts, { name: pending }];
      setSelectedProducts(finalSelected);
      setProductInput("");
    }

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }
    if (!form.taste_rating || !form.presentation_rating || !form.service_rating) {
      toast.error("Please rate all three categories");
      return;
    }
    if (finalSelected.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const productIds = finalSelected.filter(p => p.id).map(p => p.id!);
    const customNames = finalSelected.filter(p => !p.id).map(p => p.name);
    let comment = form.comment.trim();
    if (customNames.length > 0) {
      const suffix = `Also tried: ${customNames.join(", ")}`;
      comment = comment ? `${comment}\n\n${suffix}` : suffix;
    }

    setLoading(true);
    const { error } = await supabase.from("feedback").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      taste_rating: form.taste_rating,
      presentation_rating: form.presentation_rating,
      service_rating: form.service_rating,
      product_ids: productIds,
      comment: comment || null,
    });

    if (error) {
      toast.error(error.message || "Failed to submit feedback");
      setLoading(false);
      return;
    }

    toast.success("Thank you for your feedback!");
    setForm({ name: "", email: "", phone: "", location: "", taste_rating: 0, presentation_rating: 0, service_rating: 0, comment: "" });
    setSelectedProducts([]);
    setProductInput("");
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
              <div className="grid grid-cols-2 gap-4">
                <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={e => update("phone", e.target.value)} className={inputCls} />
                <input type="text" placeholder="Location (e.g. Hyderabad)" value={form.location} onChange={e => update("location", e.target.value)} className={inputCls} maxLength={60} />
              </div>

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

              {/* Product combobox */}
              <div>
                <p className="font-body text-sm font-medium text-foreground mb-2">Products you tried *</p>

                {/* Selected tags */}
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedProducts.map(p => (
                      <span
                        key={p.name}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 font-body text-xs font-medium text-primary"
                      >
                        {p.name}
                        <button
                          type="button"
                          onClick={() => removeProduct(p.name)}
                          className="ml-0.5 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input with dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="Type a product name…"
                    value={productInput}
                    onChange={e => {
                      setProductInput(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleProductKeyDown}
                    className={inputCls}
                    autoComplete="off"
                  />

                  <AnimatePresence>
                    {showDropdown && productInput.trim() && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-10 mt-1 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
                      >
                        {filteredProducts.map(p => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onMouseDown={e => { e.preventDefault(); addProduct(p); }}
                              className="w-full text-left px-4 py-2.5 font-body text-sm text-foreground hover:bg-secondary/60 transition-colors"
                            >
                              {p.name}
                            </button>
                          </li>
                        ))}
                        {filteredProducts.length === 0 && (
                          <li>
                            <button
                              type="button"
                              onMouseDown={e => { e.preventDefault(); addCustom(); }}
                              className="w-full text-left px-4 py-2.5 font-body text-sm text-muted-foreground hover:bg-secondary/60 transition-colors"
                            >
                              Add &ldquo;{productInput.trim()}&rdquo;
                            </button>
                          </li>
                        )}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Select from suggestions or press Enter to add a custom product.
                </p>
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
