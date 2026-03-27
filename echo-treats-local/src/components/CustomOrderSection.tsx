import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Mail, MessageCircle, Phone, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import customImg from "@/assets/product-custom-1.jpg";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919000000000";
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || "+919000000000";
const MAX_PX = 800;
const JPEG_QUALITY = 0.75;

/** Compress an image file to max MAX_PX × MAX_PX at JPEG_QUALITY */
const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round((height * MAX_PX) / width); width = MAX_PX; }
        else { width = Math.round((width * MAX_PX) / height); height = MAX_PX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), "image/jpeg", JPEG_QUALITY);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });

const CustomOrderSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitChannel, setSubmitChannel] = useState<"email" | "whatsapp">("email");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", occasion: "", product_type: "",
    flavor: "", size_quantity: "", delivery_date: "", message: "", allergy_note: "",
    address: "", pincode: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const compressed = await compressImage(imageFile);
      const fileName = `custom-refs/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, compressed, {
        contentType: "image/jpeg", upsert: false,
      });
      if (error) { toast.error("Image upload failed"); return null; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch {
      toast.error("Image processing failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const buildOrderSummary = (imageUrl?: string | null) => {
    return [
      `Custom Order Request`,
      ``,
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Product Type: ${form.product_type}`,
      `Occasion: ${form.occasion || "N/A"}`,
      `Flavor: ${form.flavor || "N/A"}`,
      `Size/Quantity: ${form.size_quantity || "N/A"}`,
      `Delivery Date: ${form.delivery_date || "N/A"}`,
      `Address: ${form.address}`,
      `Pincode: ${form.pincode || "N/A"}`,
      ``,
      `Message: ${form.message || "None"}`,
      form.allergy_note ? `Allergy Note: ${form.allergy_note}` : "",
      imageUrl ? `\nReference Image: ${imageUrl}` : "",
    ].filter(Boolean).join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.product_type || !form.address) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);

    const imageUrl = await uploadImage();

    const submissionData: any = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      occasion: form.occasion || null,
      product_type: form.product_type,
      flavor: form.flavor || null,
      size_quantity: form.size_quantity || null,
      delivery_date: form.delivery_date || null,
      message: [
        form.message,
        form.allergy_note ? `[Allergy Note] ${form.allergy_note}` : "",
        imageUrl ? `[Reference Image] ${imageUrl}` : "",
      ].filter(Boolean).join("\n") || null,
      address: form.address,
      pincode: form.pincode || null,
      user_id: user?.id || null,
    };

    const { error } = await supabase.from("custom_orders").insert(submissionData);
    if (error) {
      toast.error("Failed to submit request");
      setLoading(false);
      return;
    }

    const orderSummary = buildOrderSummary(imageUrl);
    setLoading(false);

    if (submitChannel === "email") {
      const subject = encodeURIComponent(`New Custom Order from ${form.name}`);
      const mailtoBody = encodeURIComponent(orderSummary);
      window.open(`mailto:echotreats.v@gmail.com?subject=${subject}&body=${mailtoBody}`, "_self");
      toast.success("Your email app will open with the order details.");
    } else {
      const waText = encodeURIComponent(orderSummary);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`, "_blank");
      toast.success("Opening WhatsApp with your order details.");
    }

    setForm({
      name: "", email: "", phone: "", occasion: "", product_type: "",
      flavor: "", size_quantity: "", delivery_date: "", message: "", allergy_note: "",
      address: "", pincode: "",
    });
    clearImage();
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const inputCls = "w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <section id="custom" className="py-16 md:py-20 gradient-warm">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="sticky top-24">
            <div className="rounded-3xl overflow-hidden shadow-card">
              <img src={customImg} alt="Custom cake inspiration" loading="lazy" width={640} height={480} className="w-full h-auto object-contain" />
            </div>
            <div className="mt-5 text-center md:text-left">
              <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-1.5">Custom Orders</h2>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">Create your own custom cakes and treats! Tell us your vision and we'll bring it to life.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-background/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-card border border-border/50">
            <h3 className="font-heading text-xl font-semibold text-foreground mb-6">Request a Custom Quote</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Name *" value={form.name} onChange={e => update("name", e.target.value)} className={inputCls} required />
                <input type="email" placeholder="Email *" value={form.email} onChange={e => update("email", e.target.value)} className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="tel" placeholder="Phone *" value={form.phone} onChange={e => update("phone", e.target.value)} className={inputCls} required />
                <select value={form.occasion} onChange={e => update("occasion", e.target.value)} className={inputCls}>
                  <option value="">Occasion</option>
                  <option>Birthday</option><option>Anniversary</option><option>Wedding</option><option>Baby Shower</option><option>Corporate</option><option>Festival</option><option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select value={form.product_type} onChange={e => update("product_type", e.target.value)} className={inputCls} required>
                  <option value="">Product Type *</option>
                  <option>Cake</option><option>Cupcakes</option><option>Cookies</option><option>Chocolates</option><option>Dessert Box</option><option>Hamper</option>
                </select>
                <input type="text" placeholder="Flavor Preference" value={form.flavor} onChange={e => update("flavor", e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Size / Quantity" value={form.size_quantity} onChange={e => update("size_quantity", e.target.value)} className={inputCls} />
                <input type="date" value={form.delivery_date} onChange={e => update("delivery_date", e.target.value)} className={inputCls} />
              </div>
              <textarea placeholder="Delivery Address *" rows={2} value={form.address} onChange={e => update("address", e.target.value)} className={`${inputCls} resize-none`} required />
              <input type="text" placeholder="Pincode" value={form.pincode} onChange={e => update("pincode", e.target.value)} className={inputCls} />
              <textarea placeholder="Inspiration notes, message on cake, special requests..." rows={3} value={form.message} onChange={e => update("message", e.target.value)} className={`${inputCls} resize-none`} />
              <textarea placeholder="Allergic to any food or ingredients? Let us know here…" rows={2} value={form.allergy_note} onChange={e => update("allergy_note", e.target.value)} maxLength={500} className={`${inputCls} resize-none`} />

              {/* Reference Image Upload */}
              <div>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={imagePreview} alt="Reference" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full shadow hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-3 py-1.5 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-body text-xs text-muted-foreground truncate">{imageFile?.name}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl font-body text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload Reference Image
                    <span className="text-xs opacity-60">(optional · max 10MB)</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  onClick={() => setSubmitChannel("email")}
                  className="flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity shadow-soft disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {(loading || uploading) && submitChannel === "email" ? "Sending..." : "Send via Email"}
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  onClick={() => setSubmitChannel("whatsapp")}
                  className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity shadow-soft disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  {(loading || uploading) && submitChannel === "whatsapp" ? "Sending..." : "Send via WhatsApp"}
                </button>
              </div>
              <div className="relative flex items-center justify-center pt-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <span className="relative bg-background/80 px-3 font-body text-xs text-muted-foreground">or skip the form</span>
              </div>
              <a href={`tel:${CONTACT_PHONE}`} className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity border border-border">
                <Phone className="w-4 h-4" /> Call Us Directly
              </a>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CustomOrderSection;
