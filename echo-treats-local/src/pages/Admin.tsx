import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  MessageSquare,
  Star,
  Bell,
  X,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type CustomOrder = Database["public"]["Tables"]["custom_orders"]["Row"];

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  tags: "",
  image_url: "",
  is_featured: false,
  occasion: "",
};

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"products" | "orders" | "custom" | "feedback" | "analytics">("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState(emptyProductForm);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    void fetchAll();
  }, [user, isAdmin, authLoading, navigate]);

  const fetchAll = async () => {
    const [p, c, o, co, fb] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("custom_orders").select("*").order("created_at", { ascending: false }),
      supabase
        .from("feedback" as any)
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (p.error) console.error("Products fetch error:", p.error);
    if (c.error) console.error("Categories fetch error:", c.error);
    if (o.error) console.error("Orders fetch error:", o.error);
    if (co.error) console.error("Custom orders fetch error:", co.error);
    if (fb.error) console.error("Feedback fetch error:", fb.error);

    if (p.data) setProducts(p.data);
    if (c.data) setCategories(c.data);
    if (o.data) setOrders(o.data);
    if (co.data) setCustomOrders(co.data);
    if (fb.data) setFeedbacks(fb.data as any[]);
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setShowAddProduct(false);
  };

  const startAddProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setShowAddProduct(true);
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setShowAddProduct(true);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ? String(product.price) : "",
      category_id: product.category_id || "",
      tags: product.tags?.join(", ") || "",
      image_url: product.image_url || "",
      is_featured: product.is_featured || false,
      occasion: (product as any).occasion || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addProduct = async () => {
    const tags = productForm.tags
      ? productForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const { error } = await supabase.from("products").insert({
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category_id: productForm.category_id || null,
      tags,
      image_url: productForm.image_url || null,
      is_featured: productForm.is_featured,
      occasion: productForm.occasion || null,
    });

    if (error) {
      console.error("Add product failed:", error);
      toast.error("Failed to add product");
      return;
    }

    toast.success("Product added");
    resetProductForm();
    await fetchAll();
  };

  const updateProduct = async () => {
    if (!editingProductId) return;

    const tags = productForm.tags
      ? productForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const { error } = await supabase
      .from("products")
      .update({
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category_id: productForm.category_id || null,
        tags,
        image_url: productForm.image_url || null,
        is_featured: productForm.is_featured,
        occasion: productForm.occasion || null,
      })
      .eq("id", editingProductId);

    if (error) {
      console.error("Update product failed:", error);
      toast.error("Failed to update product");
      return;
    }

    toast.success("Product updated");
    resetProductForm();
    await fetchAll();
  };

  const deleteProduct = async (id: string) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Delete product failed:", error);
      toast.error("Failed to delete product");
      return;
    }

    toast.success("Product deleted");
    await fetchAll();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);

    if (error) {
      console.error("Update order failed:", error);
      toast.error("Failed to update order");
      return;
    }

    toast.success("Order updated");
    await fetchAll();
  };

  const updateCustomOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("custom_orders").update({ status }).eq("id", id);

    if (error) {
      console.error("Update custom order failed:", error);
      toast.error("Failed to update custom request");
      return;
    }

    toast.success("Custom request updated");
    await fetchAll();
  };

  const deleteCustomOrder = async (id: string) => {
    const confirmed = window.confirm("Delete this custom order request?");
    if (!confirmed) return;

    const { data, error } = await supabase.from("custom_orders").delete().eq("id", id).select("id");

    if (error) {
      console.error("Delete custom order failed:", error);
      toast.error("Failed to delete custom request");
      return;
    }

    if (!data || data.length === 0) {
      console.warn("No custom order row was deleted. Likely RLS/policy issue.");
      toast.error("Delete was blocked or no matching record was found");
      return;
    }

    setCustomOrders((prev) => prev.filter((item) => item.id !== id));
    toast.success("Custom request deleted");
    await fetchAll();
  };

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);

  const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");
  const avgOrderValue = nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const pendingCustom = customOrders.filter((co) => co.status === "pending").length;
  const newFeedback = feedbacks.length;
  const totalNotifications = pendingOrders + pendingCustom + newFeedback;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body text-muted-foreground">Loading...</div>
    );
  }

  const inputCls =
    "w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalNotifications > 9 ? "9+" : totalNotifications}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-card border border-border/50 z-50 overflow-hidden">
                  <p className="font-body text-xs font-semibold text-foreground px-4 pt-3 pb-2">Notifications</p>

                  {totalNotifications === 0 ? (
                    <p className="px-4 pb-4 font-body text-xs text-muted-foreground">All caught up!</p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {pendingOrders > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab("orders");
                            setShowNotifDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-body text-xs text-foreground">
                            {pendingOrders} pending order{pendingOrders > 1 ? "s" : ""}
                          </span>
                        </button>
                      )}

                      {pendingCustom > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab("custom");
                            setShowNotifDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <Edit2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-body text-xs text-foreground">
                            {pendingCustom} custom request{pendingCustom > 1 ? "s" : ""}
                          </span>
                        </button>
                      )}

                      {newFeedback > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab("feedback");
                            setShowNotifDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-body text-xs text-foreground">{newFeedback} new feedback</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground mb-6">Admin Dashboard</h1>

        <div className="flex gap-1 mb-6 bg-secondary/50 rounded-xl p-1 overflow-x-auto">
          {[
            { key: "products" as const, label: "Products", icon: Package },
            { key: "orders" as const, label: "Orders", icon: ShoppingBag },
            { key: "custom" as const, label: "Custom Requests", icon: Edit2 },
            { key: "feedback" as const, label: "Feedback", icon: MessageSquare },
            { key: "analytics" as const, label: "Analytics", icon: Eye },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "bg-background shadow-card text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-body text-sm text-muted-foreground">{products.length} products</p>
              <button
                type="button"
                onClick={startAddProduct}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    {editingProductId ? "Edit Product" : "Add Product"}
                  </h2>
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Close product form"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Product Name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    placeholder="Price"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <input
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className={inputCls}
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="Tags (comma separated)"
                    value={productForm.tags}
                    onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Image URL"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={productForm.occasion}
                    onChange={(e) => setProductForm({ ...productForm, occasion: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select Occasion</option>
                    {[
                      "Birthday",
                      "Anniversary",
                      "Festive",
                      "Wedding",
                      "Baby Shower",
                      "Corporate",
                      "Celebration",
                      "Seasonal",
                    ].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 font-body text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        is_featured: e.target.checked,
                      })
                    }
                  />
                  Featured product
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={editingProductId ? updateProduct : addProduct}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    {editingProductId ? "Update" : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="px-6 py-2 bg-secondary text-foreground rounded-lg font-body text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />}

                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      ₹{Number(p.price).toLocaleString()} • {p.tags?.join(", ")}
                      {(p as any).occasion ? ` • ${(p as any).occasion}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditProduct(p)}
                      className="p-2 hover:bg-secondary rounded-lg text-foreground transition-colors"
                      aria-label="Edit product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProduct(p.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                      aria-label="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center py-12 font-body text-sm text-muted-foreground">No orders yet</p>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="bg-card rounded-xl p-5 border border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-body text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                      <p className="font-body text-sm font-medium text-foreground mt-1">
                        ₹{Number(o.total).toLocaleString()}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg font-body text-xs"
                    >
                      {["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {o.notes && <p className="font-body text-xs text-muted-foreground">Notes: {o.notes}</p>}
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === "custom" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {customOrders.length === 0 ? (
              <p className="text-center py-12 font-body text-sm text-muted-foreground">No custom order requests</p>
            ) : (
              customOrders.map((co) => (
                <div key={co.id} className="bg-card rounded-xl p-5 border border-border/50">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{co.name}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {co.email} • {co.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={co.status}
                        onChange={(e) => updateCustomOrderStatus(co.id, e.target.value)}
                        className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg font-body text-xs"
                      >
                        {["pending", "reviewed", "quoted", "accepted", "rejected"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => deleteCustomOrder(co.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                        aria-label="Delete custom request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-body text-xs text-muted-foreground">
                    <span>Occasion: {co.occasion || "—"}</span>
                    <span>Type: {co.product_type || "—"}</span>
                    <span>Flavor: {co.flavor || "—"}</span>
                    <span>Budget: {co.budget || "—"}</span>
                    <span>Size: {co.size_quantity || "—"}</span>
                    <span>Date: {co.delivery_date || "—"}</span>
                  </div>

                  {co.message && <p className="mt-2 font-body text-xs text-foreground">"{co.message}"</p>}
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === "feedback" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {feedbacks.length === 0 ? (
              <p className="text-center py-12 font-body text-sm text-muted-foreground">No feedback yet</p>
            ) : (
              feedbacks.map((fb: any) => (
                <div key={fb.id} className="bg-card rounded-xl p-5 border border-border/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{fb.name}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {fb.email}
                        {fb.phone ? ` • ${fb.phone}` : ""}
                      </p>
                    </div>
                    <span className="font-body text-xs text-muted-foreground">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: "Taste", value: fb.taste_rating },
                      { label: "Presentation", value: fb.presentation_rating },
                      { label: "Service", value: fb.service_rating },
                    ].map((r) => (
                      <div key={r.label} className="bg-secondary/30 rounded-lg p-2 text-center">
                        <p className="font-body text-[10px] text-muted-foreground mb-1">{r.label}</p>
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= r.value ? "fill-gold text-gold" : "text-border"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {fb.comment && <p className="font-body text-xs text-foreground">"{fb.comment}"</p>}
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === "analytics" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { label: "Total Orders", value: orders.length },
              { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}` },
              { label: "Avg Order Value", value: `₹${Math.round(avgOrderValue).toLocaleString()}` },
              { label: "Products", value: products.length },
              { label: "Custom Requests", value: customOrders.length },
              { label: "Pending Orders", value: orders.filter((o) => o.status === "pending").length },
              { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length },
              { label: "Categories", value: categories.length },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 text-center">
                <p className="font-body text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="font-heading text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;
