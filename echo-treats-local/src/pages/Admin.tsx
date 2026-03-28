import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Package, ShoppingBag, Plus, Trash2, Edit2, Check, Eye,
  MessageSquare, Star, Bell, X, Upload, Filter, Download, Users,
  BarChart2, Tag, Store, TrendingUp, ChevronDown, Search, RefreshCw,
  ToggleLeft, ToggleRight, Image as ImageIcon, Megaphone, Instagram, Link,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type CustomOrder = Database["public"]["Tables"]["custom_orders"]["Row"];

const emptyProductForm = {
  name: "", description: "", price: "", category_id: "",
  tags: "", image_url: "", is_featured: false, occasion: "", is_available: true,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  reviewed: "bg-blue-100 text-blue-700",
  quoted: "bg-purple-100 text-purple-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"products" | "orders" | "custom" | "feedback" | "analytics" | "users" | "categories" | "store" | "banners" | "instagram">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");

  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [addingUser, setAddingUser] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementText, setAnnouncementText] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Site visits
  const [visitStats, setVisitStats] = useState({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });

  // Instagram posts
  const [instaPosts, setInstaPosts] = useState<any[]>(Array.from({ length: 5 }, (_, i) => ({ id: null, sort_order: i + 1, post_url: "", image_url: "", _file: null, _preview: null })));
  const [instaUploading, setInstaUploading] = useState<number | null>(null);
  const instaFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) { navigate("/"); return; }
    void fetchAll();
  }, [user, isAdmin, authLoading, navigate]);

  const fetchAll = async () => {
    setDataLoading(true);
    try {
      const [p, c, o, oi, co, fb, pr, ur, an, ig] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("order_items").select("*"),
        supabase.from("custom_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("feedback" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("announcements" as any).select("*").order("sort_order"),
        supabase.from("instagram_posts" as any).select("*").order("sort_order").limit(6),
      ]);

      if (p.data) setProducts(p.data);
      if (c.data) setCategories(c.data);
      if (o.data) setOrders(o.data);
      if (oi.data) {
        const grouped: Record<string, any[]> = {};
        oi.data.forEach((item: any) => {
          if (!grouped[item.order_id]) grouped[item.order_id] = [];
          grouped[item.order_id].push(item);
        });
        setOrderItems(grouped);
      }
      if (co.data) setCustomOrders(co.data);
      if (fb.data) setFeedbacks(fb.data as any[]);
      if (pr.data) setProfiles(pr.data);
      if (ur.data) setUserRoles(ur.data);
      if (an.data) setAnnouncements(an.data as any[]);

      // Visit stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [vTotal, vToday, vWeek, vMonth] = await Promise.all([
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }),
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }).gte("visited_at", todayStart),
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }).gte("visited_at", weekStart),
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }).gte("visited_at", monthStart),
      ]);
      setVisitStats({
        total: vTotal.count ?? 0,
        today: vToday.count ?? 0,
        thisWeek: vWeek.count ?? 0,
        thisMonth: vMonth.count ?? 0,
      });
      if (ig.data) {
        const filled = Array.from({ length: 5 }, (_, i) => {
          const existing = (ig.data as any[]).find(r => r.sort_order === i + 1);
          return existing
            ? { ...existing, _file: null, _preview: null }
            : { id: null, sort_order: i + 1, post_url: "", image_url: "", _file: null, _preview: null };
        });
        setInstaPosts(filled);
      }
    } catch (err) {
      toast.error("Failed to load admin data. Please refresh.");
    } finally {
      setDataLoading(false);
    }
  };

  // ── Image Upload ──────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return productForm.image_url || null;
    setUploadingImage(true);
    const ext = imageFile.name.split(".").pop();
    const fileName = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, imageFile, { upsert: true });
    setUploadingImage(false);
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── Products ──────────────────────────────────────────────────
  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setShowAddProduct(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setShowAddProduct(true);
    setImagePreview(product.image_url || null);
    setProductForm({
      name: product.name || "", description: product.description || "",
      price: product.price ? String(product.price) : "",
      category_id: product.category_id || "", tags: product.tags?.join(", ") || "",
      image_url: product.image_url || "", is_featured: product.is_featured || false,
      occasion: (product as any).occasion || "", is_available: product.is_available ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProduct = async () => {
    const imageUrl = await uploadImage();
    const tags = productForm.tags ? productForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const payload = {
      name: productForm.name, description: productForm.description,
      price: parseFloat(productForm.price), category_id: productForm.category_id || null,
      tags, image_url: imageUrl, is_featured: productForm.is_featured,
      occasion: productForm.occasion || null, is_available: productForm.is_available,
    };

    if (editingProductId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProductId);
      if (error) { toast.error("Failed to update product"); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Failed to add product"); return; }
      toast.success("Product added");
    }
    resetProductForm();
    await fetchAll();
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Failed to delete product"); return; }
    toast.success("Product deleted");
    await fetchAll();
  };

  const toggleProductAvailability = async (product: Product) => {
    const { error } = await supabase.from("products").update({ is_available: !product.is_available }).eq("id", product.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(product.is_available ? "Marked out of stock" : "Marked available");
    await fetchAll();
  };

  // ── Categories ────────────────────────────────────────────────
  const saveCategory = async () => {
    const payload = { name: categoryForm.name, slug: categoryForm.slug, description: categoryForm.description };
    if (editingCategoryId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingCategoryId);
      if (error) { toast.error("Failed to update category"); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error("Failed to add category"); return; }
      toast.success("Category added");
    }
    setCategoryForm({ name: "", slug: "", description: "" });
    setEditingCategoryId(null);
    setShowAddCategory(false);
    await fetchAll();
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error("Failed to delete category"); return; }
    toast.success("Category deleted");
    await fetchAll();
  };

  // ── Orders ────────────────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update order"); return; }
    toast.success("Order updated");
    await fetchAll();
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order record?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error("Failed to delete order"); return; }
    toast.success("Order deleted");
    await fetchAll();
  };

  const exportOrdersCSV = () => {
    const rows = [["Order ID", "Customer", "Email", "Phone", "Total", "Status", "Date", "Items"]];
    filteredOrders.forEach(o => {
      const profile = profiles.find(p => p.user_id === o.user_id);
      const name = o.guest_name || profile?.full_name || "—";
      const email = o.guest_email || "—";
      const phone = o.guest_phone || profile?.phone || "—";
      const items = (orderItems[o.id] || []).map(i => `${i.product_name} x${i.quantity}`).join("; ");
      rows.push([o.id.slice(0, 8), name, email, phone, String(o.total), o.status, new Date(o.created_at).toLocaleDateString(), items]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
  };

  // ── Users ─────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUserForm.email || !newUserForm.password || !newUserForm.name) {
      toast.error("Name, email and password are required"); return;
    }
    setAddingUser(true);
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: {
        email: newUserForm.email,
        password: newUserForm.password,
        full_name: newUserForm.name,
        phone: newUserForm.phone,
      },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create user");
      setAddingUser(false);
      return;
    }
    toast.success(`User ${newUserForm.email} created — ready to log in immediately`);
    setNewUserForm({ name: "", email: "", phone: "", password: "" });
    setShowAddUser(false);
    setAddingUser(false);
    await fetchAll();
  };

  const setAdminRole = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) { toast.error("Failed to set admin"); return; }
    toast.success("Admin access granted");
    await fetchAll();
  };

  const removeAdminRole = async (userId: string) => {
    if (!window.confirm("Remove admin access for this user?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    if (error) { toast.error("Failed to remove admin"); return; }
    toast.success("Admin access removed");
    await fetchAll();
  };

  const blockUser = async (userId: string) => {
    if (!window.confirm("Block this user? They will still be able to log in but can be identified as restricted.")) return;
    // Remove admin role first if present
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    // Insert blocked marker (role: "user") — ignore if already exists
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "user" });
    if (error && !error.message.includes("duplicate")) {
      toast.error("Failed to block user"); return;
    }
    toast.success("User blocked");
    await fetchAll();
  };

  const unblockUser = async (userId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "user");
    if (error) { toast.error("Failed to unblock user"); return; }
    toast.success("User unblocked");
    await fetchAll();
  };

  // ── Analytics ─────────────────────────────────────────────────
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const activeOrders = orders.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  // Actual revenue = delivered only
  const actualRevenue = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);
  // Projected = pipeline orders (not yet delivered, not cancelled)
  const projectedRevenue = activeOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue = deliveredOrders.length > 0 ? actualRevenue / deliveredOrders.length : 0;
  const cancellationRate = orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0;

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const pendingCustom = customOrders.filter(co => co.status === "pending").length;
  const totalNotifications = pendingOrders + pendingCustom + feedbacks.length;

  // Avg fulfillment days (created → delivered, using updated_at as proxy)
  const fulfillmentDays = deliveredOrders.map(o => {
    const created = new Date(o.created_at).getTime();
    const updated = new Date(o.updated_at).getTime();
    return (updated - created) / (1000 * 60 * 60 * 24);
  });
  const avgFulfillmentDays = fulfillmentDays.length > 0
    ? fulfillmentDays.reduce((s, d) => s + d, 0) / fulfillmentDays.length
    : 0;

  // Monthly revenue (current month, actual delivered only)
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthRevenue = deliveredOrders.filter(o => o.created_at.startsWith(thisMonthStr)).reduce((s, o) => s + Number(o.total), 0);
  const lastMonthRevenue = deliveredOrders.filter(o => o.created_at.startsWith(lastMonthStr)).reduce((s, o) => s + Number(o.total), 0);
  const monthGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null;

  // Repeat customers (placed more than 1 order)
  const ordersByUser = orders.reduce((acc: Record<string, number>, o) => {
    const key = o.user_id || o.guest_email || "guest";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const repeatCustomers = Object.values(ordersByUser).filter(c => c > 1).length;

  const revenueByCategory = categories.map(cat => {
    const catProductIds = products.filter(p => p.category_id === cat.id).map(p => p.id);
    // Only count items from delivered orders
    const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));
    let revenue = 0;
    Object.entries(orderItems).forEach(([orderId, items]) => {
      if (!deliveredOrderIds.has(orderId)) return;
      (items as any[]).forEach(item => {
        if (catProductIds.includes(item.product_id)) revenue += Number(item.unit_price) * item.quantity;
      });
    });
    return { name: cat.name, revenue };
  }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  const topProducts = products.map(p => {
    const sold = Object.values(orderItems).flat()
      .filter((i: any) => i.product_id === p.id)
      .reduce((s: number, i: any) => s + i.quantity, 0);
    return { name: p.name, sold };
  }).filter(p => p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5);

  const ordersByStatus = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map(s => ({
    status: s, count: orders.filter(o => o.status === s).length
  })).filter(s => s.count > 0);

  // Last 7 days — actual (delivered) bars + projected overlay
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayDelivered = orders.filter(o => o.created_at.startsWith(dateStr) && o.status === "delivered");
    const dayActive = orders.filter(o => o.created_at.startsWith(dateStr) && ["pending", "confirmed", "preparing", "ready"].includes(o.status));
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      actual: dayDelivered.reduce((s, o) => s + Number(o.total), 0),
      projected: dayActive.reduce((s, o) => s + Number(o.total), 0),
      count: dayDelivered.length + dayActive.length,
    };
  });
  const maxRevenue = Math.max(...last7Days.map(d => d.actual + d.projected), 1);

  // ── Announcements ─────────────────────────────────────────────
  const saveAnnouncement = async () => {
    const text = announcementText.trim();
    if (!text) { toast.error("Enter announcement text"); return; }
    if (editingAnnouncementId) {
      const { error } = await (supabase.from("announcements" as any) as any).update({ text }).eq("id", editingAnnouncementId);
      if (error) { toast.error("Failed to update"); return; }
      setAnnouncements(prev => prev.map(a => a.id === editingAnnouncementId ? { ...a, text } : a));
      toast.success("Announcement updated");
    } else {
      const maxOrder = announcements.reduce((m, a) => Math.max(m, a.sort_order ?? 0), 0);
      const { data, error } = await (supabase.from("announcements" as any) as any)
        .insert({ text, is_active: true, sort_order: maxOrder + 1 })
        .select()
        .single();
      if (error) { toast.error("Failed to add"); return; }
      setAnnouncements(prev => [...prev, data]);
      toast.success("Announcement added");
    }
    setAnnouncementText("");
    setEditingAnnouncementId(null);
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await (supabase.from("announcements" as any) as any).delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success("Announcement deleted");
  };

  const toggleAnnouncement = async (id: string, current: boolean) => {
    const { error } = await (supabase.from("announcements" as any) as any).update({ is_active: !current }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
  };

  // ── Instagram Posts ───────────────────────────────────────────
  const updateInstaSlot = (index: number, changes: Partial<typeof instaPosts[0]>) => {
    setInstaPosts(prev => prev.map((p, i) => i === index ? { ...p, ...changes } : p));
  };

  const handleInstaImageSelect = (index: number, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Select an image"); return; }
    updateInstaSlot(index, { _file: file, _preview: URL.createObjectURL(file) });
  };

  const saveInstaSlot = async (index: number) => {
    const slot = instaPosts[index];
    if (!slot.post_url && !slot._file && !slot.image_url) {
      toast.error("Add an Instagram URL and image");
      return;
    }
    setInstaUploading(index);
    let imageUrl = slot.image_url;
    if (slot._file) {
      const ext = (slot._file as File).name.split(".").pop();
      const fileName = `instagram/${Date.now()}-${index}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(fileName, slot._file as File, { upsert: true });
      if (upErr) { toast.error("Image upload failed"); setInstaUploading(null); return; }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    const payload = { sort_order: slot.sort_order, post_url: slot.post_url, image_url: imageUrl };
    if (slot.id) {
      await (supabase.from("instagram_posts" as any) as any).update(payload).eq("id", slot.id);
    } else {
      const { data } = await (supabase.from("instagram_posts" as any) as any).insert(payload).select().single();
      if (data) updateInstaSlot(index, { id: (data as any).id });
    }
    updateInstaSlot(index, { image_url: imageUrl, _file: null, _preview: null });
    setInstaUploading(null);
    toast.success(`Slot ${index + 1} saved`);
  };

  const clearInstaSlot = async (index: number) => {
    const slot = instaPosts[index];
    if (slot.id) {
      await (supabase.from("instagram_posts" as any) as any).delete().eq("id", slot.id);
    }
    updateInstaSlot(index, { id: null, post_url: "", image_url: "", _file: null, _preview: null });
    toast.success(`Slot ${index + 1} cleared`);
  };

  // ── Filtered Orders ───────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const matchStatus = orderFilter === "all" || o.status === orderFilter;
    const name = o.guest_name || profiles.find(p => p.user_id === o.user_id)?.full_name || "";
    const matchSearch = !orderSearch || name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id.includes(orderSearch) || (o.guest_email || "").includes(orderSearch);
    return matchStatus && matchSearch;
  });

  const inputCls = "w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-body text-muted-foreground">Loading...</div>;

  const tabs = [
    { key: "products", label: "Products", icon: Package },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "custom", label: "Custom", icon: Edit2 },
    { key: "categories", label: "Categories", icon: Tag },
    { key: "feedback", label: "Feedback", icon: MessageSquare },
    { key: "users", label: "Users", icon: Users },
    { key: "analytics", label: "Analytics", icon: BarChart2 },
    { key: "banners", label: "Banners", icon: Megaphone },
    { key: "instagram", label: "Instagram", icon: Instagram },
  ];

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => navigate("/")}
            className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={fetchAll}
              className="p-2 hover:bg-secondary rounded-full transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="relative">
              <button type="button" onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 hover:bg-secondary rounded-full transition-colors">
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
                          <button type="button" onClick={() => { setTab("orders"); setShowNotifDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                            <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-body text-xs">{pendingOrders} pending order{pendingOrders > 1 ? "s" : ""}</span>
                          </button>
                        )}
                        {pendingCustom > 0 && (
                          <button type="button" onClick={() => { setTab("custom"); setShowNotifDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                            <Edit2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-body text-xs">{pendingCustom} custom request{pendingCustom > 1 ? "s" : ""}</span>
                          </button>
                        )}
                        {feedbacks.length > 0 && (
                          <button type="button" onClick={() => { setTab("feedback"); setShowNotifDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                            <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-body text-xs">{feedbacks.length} new feedback</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground mb-6">Admin Dashboard</h1>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Orders", value: orders.length, color: "text-blue-600" },
            { label: "Revenue", value: `₹${actualRevenue.toLocaleString()}`, color: "text-green-600" },
            { label: "Products", value: products.length, color: "text-purple-600" },
            { label: "Pending", value: pendingOrders, color: "text-amber-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl p-4 border border-border/50 text-center">
              <p className={`font-heading text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary/50 rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key ? "bg-background shadow-card text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── LOADING STATE ── */}
        {dataLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {!dataLoading && tab === "products" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-body text-sm text-muted-foreground">{products.length} products</p>
              <button type="button" onClick={() => { setEditingProductId(null); setProductForm(emptyProductForm); setImagePreview(null); setShowAddProduct(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* Search + Category Filter */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setProductCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-colors ${productCategoryFilter === "all" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  All ({products.length})
                </button>
                {categories.map(c => {
                  const count = products.filter(p => p.category_id === c.id).length;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setProductCategoryFilter(c.id)}
                      className={`px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-colors ${productCategoryFilter === c.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                    >
                      {c.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {showAddProduct && (
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">{editingProductId ? "Edit Product" : "Add Product"}</h2>
                  <button type="button" onClick={resetProductForm} className="p-2 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
                </div>

                {/* Image Upload */}
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-2">Product Image</p>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-secondary/30"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                          <span className="font-body text-[10px] text-muted-foreground">Upload</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-body text-sm hover:bg-secondary">
                        <Upload className="w-4 h-4" /> Choose Image
                      </button>
                      <p className="font-body text-xs text-muted-foreground mt-1">Max 2MB • JPG, PNG, WebP</p>
                      {imageFile && <p className="font-body text-xs text-green-600 mt-1">✓ {imageFile.name}</p>}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Product Name" value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })} className={inputCls} />
                  <input placeholder="Price (₹)" type="number" value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })} className={inputCls} />
                </div>

                <textarea placeholder="Description" value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className={`${inputCls} resize-none h-20`} />

                <div className="grid grid-cols-2 gap-4">
                  <select value={productForm.category_id}
                    onChange={e => setProductForm({ ...productForm, category_id: e.target.value })} className={inputCls}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input placeholder="Tags (comma separated)" value={productForm.tags}
                    onChange={e => setProductForm({ ...productForm, tags: e.target.value })} className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select value={productForm.occasion}
                    onChange={e => setProductForm({ ...productForm, occasion: e.target.value })} className={inputCls}>
                    <option value="">Select Occasion</option>
                    {["Birthday", "Anniversary", "Festive", "Wedding", "Baby Shower", "Corporate", "Celebration", "Seasonal"].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
                      <input type="checkbox" checked={productForm.is_featured}
                        onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })} />
                      Featured
                    </label>
                    <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
                      <input type="checkbox" checked={productForm.is_available}
                        onChange={e => setProductForm({ ...productForm, is_available: e.target.checked })} />
                      Available
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={saveProduct} disabled={uploadingImage}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90 disabled:opacity-50">
                    {uploadingImage ? "Uploading..." : <><Check className="w-4 h-4 inline mr-1" />{editingProductId ? "Update" : "Save"}</>}
                  </button>
                  <button type="button" onClick={resetProductForm}
                    className="px-6 py-2 bg-secondary text-foreground rounded-lg font-body text-sm">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {products.filter(p => {
                const matchCat = productCategoryFilter === "all" || p.category_id === productCategoryFilter;
                const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
                return matchCat && matchSearch;
              }).map(p => (
                <div key={p.id} className="flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    : <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-muted-foreground" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-sm font-medium text-foreground truncate">{p.name}</p>
                      {!p.is_available && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-body">Out of stock</span>}
                      {p.is_featured && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-body">Featured</span>}
                    </div>
                    <p className="font-body text-xs text-muted-foreground">₹{Number(p.price).toLocaleString()} • {categories.find(c => c.id === p.category_id)?.name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => toggleProductAvailability(p)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors" title={p.is_available ? "Mark out of stock" : "Mark available"}>
                      {p.is_available ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button type="button" onClick={() => startEditProduct(p)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button type="button" onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── ORDERS TAB ── */}
        {!dataLoading && tab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search by name, email, order ID..." value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)}
                className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none">
                <option value="all">All Status</option>
                {["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" onClick={exportOrdersCSV}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-body text-sm hover:bg-secondary">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <p className="font-body text-xs text-muted-foreground mb-3">{filteredOrders.length} orders</p>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <p className="text-center py-12 font-body text-sm text-muted-foreground">No orders found</p>
              ) : filteredOrders.map(o => {
                const profile = profiles.find(p => p.user_id === o.user_id);
                const customerName = o.guest_name || profile?.full_name || "Guest";
                const customerEmail = o.guest_email || "—";
                const customerPhone = o.guest_phone || profile?.phone || "—";
                const items = orderItems[o.id] || [];
                const isExpanded = expandedOrder === o.id;

                return (
                  <div key={o.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-body text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-body font-medium ${STATUS_COLORS[o.status] || "bg-secondary text-foreground"}`}>
                              {o.status}
                            </span>
                          </div>
                          {items.length > 0 && (
                            <p className="font-body text-sm font-semibold text-foreground mb-1">
                              {items.map((i: any) => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}
                            </p>
                          )}
                          <p className="font-body text-sm text-foreground">{customerName}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                            <p className="font-body text-xs text-muted-foreground">{customerEmail}</p>
                            <p className="font-body text-xs text-muted-foreground">{customerPhone}</p>
                          </div>
                          <p className="font-body text-xs text-muted-foreground mt-0.5">
                            Ordered: {new Date(o.created_at).toLocaleString()} {o.delivery_date ? `• Delivery: ${o.delivery_date}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-2">
                            <p className="font-body text-sm font-bold text-foreground">₹{Number(o.total).toLocaleString()}</p>
                            <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                              className="px-2 py-1.5 bg-secondary/50 border border-border rounded-lg font-body text-xs">
                              {["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1 self-end">
                            <p className="font-body text-[10px] text-muted-foreground/70 mr-1">
                              {o.updated_at !== o.created_at
                                ? `Updated: ${new Date(o.updated_at).toLocaleString()}`
                                : "Not yet updated"}
                            </p>
                            <button type="button" onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                              className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                            <button type="button" onClick={() => deleteOrder(o.id)}
                              className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="border-t border-border/50 px-4 pb-4 pt-3 bg-secondary/20">
                          <p className="font-body text-xs font-semibold text-foreground mb-2">Order Items:</p>
                          {items.length === 0 ? (
                            <p className="font-body text-xs text-muted-foreground">No item details available</p>
                          ) : (
                            <div className="space-y-1">
                              {items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center font-body text-xs">
                                  <span className="text-foreground">{item.product_name}</span>
                                  <span className="text-muted-foreground">x{item.quantity} × ₹{Number(item.unit_price).toLocaleString()} = <strong>₹{(item.quantity * Number(item.unit_price)).toLocaleString()}</strong></span>
                                </div>
                              ))}
                            </div>
                          )}
                          {o.delivery_address && (
                            <p className="font-body text-xs text-muted-foreground mt-2">📍 {o.delivery_address}</p>
                          )}
                          {o.notes && (
                            <p className="font-body text-xs text-muted-foreground mt-1">📝 {o.notes}</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── CUSTOM ORDERS TAB ── */}
        {!dataLoading && tab === "custom" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {customOrders.length === 0 ? (
              <p className="text-center py-12 font-body text-sm text-muted-foreground">No custom order requests</p>
            ) : customOrders.map(co => (
              <div key={co.id} className="bg-card rounded-xl p-5 border border-border/50">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">{co.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{co.email} • {co.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select value={co.status} onChange={e => { supabase.from("custom_orders").update({ status: e.target.value }).eq("id", co.id).then(() => fetchAll()); }}
                      className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg font-body text-xs">
                      {["pending", "reviewed", "quoted", "accepted", "rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" onClick={async () => {
                      if (!window.confirm("Delete this custom order?")) return;
                      await supabase.from("custom_orders").delete().eq("id", co.id);
                      await fetchAll();
                      toast.success("Deleted");
                    }} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 font-body text-xs text-muted-foreground">
                  <span>Occasion: {co.occasion || "—"}</span>
                  <span>Type: {co.product_type || "—"}</span>
                  <span>Flavor: {co.flavor || "—"}</span>
                  <span>Budget: {(co as any).budget || "—"}</span>
                  <span>Size: {co.size_quantity || "—"}</span>
                  <span>Date: {co.delivery_date || "—"}</span>
                </div>
                {(() => {
                  const refMatch = co.message?.match(/\[Reference Image\]\s*(https?:\/\/\S+)/);
                  const refUrl = refMatch?.[1] || null;
                  const cleanMsg = co.message?.replace(/\[Reference Image\]\s*https?:\/\/\S+/, "").trim();
                  return (
                    <div className="mt-2 space-y-2">
                      {cleanMsg && <p className="font-body text-xs text-foreground">"{cleanMsg}"</p>}
                      {refUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(refUrl)}
                          className="block rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                          title="Click to view full image"
                        >
                          <img src={refUrl} alt="Reference" className="h-20 w-32 object-cover" />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── CATEGORIES TAB ── */}
        {!dataLoading && tab === "categories" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-body text-sm text-muted-foreground">{categories.length} categories</p>
              <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: "", slug: "", description: "" }); setShowAddCategory(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            {showAddCategory && (
              <div className="bg-card rounded-2xl p-6 border border-border/50 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">{editingCategoryId ? "Edit Category" : "Add Category"}</h2>
                  <button type="button" onClick={() => setShowAddCategory(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
                </div>
                <input placeholder="Category Name" value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className={inputCls} />
                <input placeholder="Slug (auto-filled)" value={categoryForm.slug}
                  onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })} className={inputCls} />
                <input placeholder="Description" value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} className={inputCls} />
                <div className="flex gap-2">
                  <button type="button" onClick={saveCategory}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90">
                    <Check className="w-4 h-4 inline mr-1" />{editingCategoryId ? "Update" : "Save"}
                  </button>
                  <button type="button" onClick={() => setShowAddCategory(false)}
                    className="px-6 py-2 bg-secondary text-foreground rounded-lg font-body text-sm">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {categories.map(cat => {
                const productCount = products.filter(p => p.category_id === cat.id).length;
                return (
                  <div key={cat.id} className="flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50">
                    <div className="flex-1">
                      <p className="font-body text-sm font-medium text-foreground">{cat.name}</p>
                      <p className="font-body text-xs text-muted-foreground">{cat.description || "—"} • {productCount} products</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => {
                        setEditingCategoryId(cat.id);
                        setCategoryForm({ name: cat.name, slug: cat.slug || "", description: cat.description || "" });
                        setShowAddCategory(true);
                      }} className="p-2 hover:bg-secondary rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => deleteCategory(cat.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── FEEDBACK TAB ── */}
        {!dataLoading && tab === "feedback" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {feedbacks.length === 0 ? (
              <p className="text-center py-12 font-body text-sm text-muted-foreground">No feedback yet</p>
            ) : feedbacks.map((fb: any) => (
              <div key={fb.id} className="bg-card rounded-xl p-5 border border-border/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">{fb.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{fb.email}{fb.phone ? ` • ${fb.phone}` : ""}</p>
                  </div>
                  <span className="font-body text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[{ label: "Taste", value: fb.taste_rating }, { label: "Presentation", value: fb.presentation_rating }, { label: "Service", value: fb.service_rating }].map(r => (
                    <div key={r.label} className="bg-secondary/30 rounded-lg p-2 text-center">
                      <p className="font-body text-[10px] text-muted-foreground mb-1">{r.label}</p>
                      <div className="flex items-center justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.value ? "fill-amber-400 text-amber-400" : "text-border"}`} />)}
                      </div>
                    </div>
                  ))}
                </div>
                {fb.comment && <p className="font-body text-xs text-foreground">"{fb.comment}"</p>}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── USERS TAB ── */}
        {!dataLoading && tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Header row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search by name, email or phone..." value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button type="button" onClick={() => setShowAddUser(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-body text-sm hover:opacity-90">
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>

            {/* Add User Form */}
            {showAddUser && (
              <div className="bg-card rounded-2xl p-5 border border-border/50">
                <h3 className="font-heading text-base font-semibold mb-4">Create New User</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "Full Name *", key: "name", type: "text", placeholder: "Jane Doe" },
                    { label: "Email *", key: "email", type: "email", placeholder: "jane@example.com" },
                    { label: "Phone", key: "phone", type: "tel", placeholder: "+91 98000 00000" },
                    { label: "Password *", key: "password", type: "password", placeholder: "Min 6 characters" },
                  ].map(f => (
                    <div key={f.key}>
                      <p className="font-body text-xs text-muted-foreground mb-1">{f.label}</p>
                      <input type={f.type} placeholder={f.placeholder}
                        value={newUserForm[f.key as keyof typeof newUserForm]}
                        onChange={e => setNewUserForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={handleAddUser} disabled={addingUser}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90 disabled:opacity-60">
                    {addingUser ? "Creating..." : "Create User"}
                  </button>
                  <button type="button" onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 bg-secondary rounded-lg font-body text-sm hover:bg-secondary/80">
                    Cancel
                  </button>
                </div>
                <p className="font-body text-[10px] text-muted-foreground mt-2">User can log in immediately — no email confirmation required.</p>
              </div>
            )}

            {/* User List */}
            <div className="space-y-2">
              <p className="font-body text-xs text-muted-foreground">{profiles.length} users</p>
              {profiles
                .filter(p => {
                  if (!userSearch) return true;
                  const q = userSearch.toLowerCase();
                  return (p.full_name || "").toLowerCase().includes(q) ||
                    (p.phone || "").includes(q);
                })
                .map(p => {
                  const isAdmin = !!userRoles.find(r => r.user_id === p.user_id && r.role === "admin");
                  const isBlocked = !!userRoles.find(r => r.user_id === p.user_id && r.role === "user");
                  const orderCount = orders.filter(o => o.user_id === p.user_id).length;
                  return (
                    <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border ${isBlocked ? "bg-red-50 border-red-100" : "bg-card border-border/50"}`}>
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-body text-sm font-bold ${isAdmin ? "bg-purple-100 text-purple-700" : isBlocked ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
                        {(p.full_name || "?")[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-body text-sm font-semibold text-foreground">{p.full_name || "—"}</p>
                          {isAdmin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-body font-medium">Admin</span>}
                          {isBlocked && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-body font-medium">Blocked</span>}
                        </div>
                        <p className="font-body text-xs text-muted-foreground">
                          {p.phone || "No phone"} • Joined {new Date(p.created_at).toLocaleDateString()} • {orderCount} order{orderCount !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {!isBlocked && !isAdmin && (
                          <button type="button" onClick={() => setAdminRole(p.user_id)}
                            className="px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-body text-xs hover:bg-purple-200 transition-colors">
                            Make Admin
                          </button>
                        )}
                        {isAdmin && (
                          <button type="button" onClick={() => removeAdminRole(p.user_id)}
                            className="px-2.5 py-1.5 bg-secondary text-foreground rounded-lg font-body text-xs hover:bg-secondary/80 transition-colors">
                            Remove Admin
                          </button>
                        )}
                        {!isBlocked ? (
                          <button type="button" onClick={() => blockUser(p.user_id)}
                            className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-body text-xs hover:bg-red-100 transition-colors">
                            Block
                          </button>
                        ) : (
                          <button type="button" onClick={() => unblockUser(p.user_id)}
                            className="px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-body text-xs hover:bg-green-100 transition-colors">
                            Unblock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              {profiles.length === 0 && (
                <p className="text-center py-12 font-body text-sm text-muted-foreground">No users found</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {!dataLoading && tab === "analytics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Website Visits */}
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-heading text-base font-semibold text-foreground">Website Visits</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total All Time", value: visitStats.total, color: "text-blue-600" },
                  { label: "Today", value: visitStats.today, color: "text-green-600" },
                  { label: "This Week", value: visitStats.thisWeek, color: "text-purple-600" },
                  { label: "This Month", value: visitStats.thisMonth, color: "text-amber-600" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 bg-secondary/30 rounded-xl">
                    <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="font-body text-[10px] text-muted-foreground mt-3">Counts homepage loads across all devices & platforms</p>
            </div>

            {/* Row 1 — Revenue KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">Actual Revenue</p>
                <p className="font-heading text-2xl font-bold text-green-600 mt-1">₹{actualRevenue.toLocaleString()}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">Delivered orders only</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">Pipeline (Projected)</p>
                <p className="font-heading text-2xl font-bold text-amber-600 mt-1">₹{projectedRevenue.toLocaleString()}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">{activeOrders.length} active orders</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">This Month</p>
                <p className="font-heading text-2xl font-bold text-blue-600 mt-1">₹{thisMonthRevenue.toLocaleString()}</p>
                {monthGrowth !== null && (
                  <p className={`font-body text-[10px] mt-0.5 font-semibold ${monthGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {monthGrowth >= 0 ? "▲" : "▼"} {Math.abs(monthGrowth).toFixed(1)}% vs last month
                  </p>
                )}
                {monthGrowth === null && <p className="font-body text-[10px] text-muted-foreground mt-0.5">No prior month data</p>}
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">Avg Order Value</p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1">₹{Math.round(avgOrderValue).toLocaleString()}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">From {deliveredOrders.length} delivered</p>
              </div>
            </div>

            {/* Row 2 — Operations KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">Total Orders</p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1">{orders.length}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">{deliveredOrders.length} delivered · {pendingOrders} pending</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">Avg Fulfillment</p>
                <p className={`font-heading text-2xl font-bold mt-1 ${avgFulfillmentDays <= 1 ? "text-green-600" : avgFulfillmentDays <= 3 ? "text-amber-600" : "text-red-500"}`}>
                  {deliveredOrders.length > 0 ? `${avgFulfillmentDays.toFixed(1)}d` : "—"}
                </p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">Order → delivered</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">Cancellation Rate</p>
                <p className={`font-heading text-2xl font-bold mt-1 ${cancellationRate === 0 ? "text-green-600" : cancellationRate < 10 ? "text-amber-600" : "text-red-500"}`}>
                  {cancellationRate.toFixed(1)}%
                </p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">{cancelledOrders.length} cancelled</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <p className="font-body text-xs text-muted-foreground">Repeat Customers</p>
                <p className="font-heading text-2xl font-bold text-purple-600 mt-1">{repeatCustomers}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">Ordered more than once</p>
              </div>
            </div>

            {/* Revenue Last 7 Days — actual vs projected */}
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Revenue — Last 7 Days
                </h3>
                <div className="flex items-center gap-3 font-body text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-green-500" /> Actual</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-amber-300" /> Projected</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-36">
                {last7Days.map((d, i) => {
                  const totalH = ((d.actual + d.projected) / maxRevenue) * 112;
                  const actualH = d.actual + d.projected > 0 ? (d.actual / (d.actual + d.projected)) * totalH : 0;
                  const projH = totalH - actualH;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      {(d.actual + d.projected) > 0 && (
                        <span className="font-body text-[9px] text-muted-foreground">
                          ₹{((d.actual + d.projected) >= 1000 ? `${((d.actual + d.projected) / 1000).toFixed(1)}k` : d.actual + d.projected)}
                        </span>
                      )}
                      <div className="w-full flex flex-col justify-end" style={{ height: "112px" }}>
                        {projH > 0 && <div className="w-full rounded-t-sm bg-amber-300" style={{ height: `${Math.max(projH, 4)}px` }} />}
                        {actualH > 0 && <div className={`w-full bg-green-500 ${projH === 0 ? "rounded-t-md" : ""}`} style={{ height: `${Math.max(actualH, 4)}px` }} />}
                        {(d.actual + d.projected) === 0 && <div className="w-full bg-secondary/30 rounded-t-md" style={{ height: "4px" }} />}
                      </div>
                      <span className="font-body text-[10px] text-muted-foreground">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Orders by Status */}
              <div className="bg-card rounded-2xl p-5 border border-border/50">
                <h3 className="font-heading text-base font-semibold mb-4">Orders by Status</h3>
                <div className="space-y-2">
                  {ordersByStatus.map(s => (
                    <div key={s.status} className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-body w-20 text-center shrink-0 ${STATUS_COLORS[s.status] || "bg-secondary"}`}>{s.status}</span>
                      <div className="flex-1 bg-secondary/50 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(s.count / orders.length) * 100}%` }} />
                      </div>
                      <span className="font-body text-xs text-muted-foreground w-6 text-right">{s.count}</span>
                    </div>
                  ))}
                  {ordersByStatus.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-4">No orders yet</p>}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-card rounded-2xl p-5 border border-border/50">
                <h3 className="font-heading text-base font-semibold mb-4">Top Selling Products</h3>
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="font-body text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="font-body text-sm text-foreground flex-1 truncate">{p.name}</span>
                      <span className="font-body text-xs text-primary font-semibold">{p.sold} sold</span>
                    </div>
                  ))}
                  {topProducts.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-4">No sales data yet</p>}
                </div>
              </div>

              {/* Revenue by Category — delivered only */}
              <div className="bg-card rounded-2xl p-5 border border-border/50 md:col-span-2">
                <h3 className="font-heading text-base font-semibold mb-1">Revenue by Category</h3>
                <p className="font-body text-[10px] text-muted-foreground mb-4">Delivered orders only</p>
                <div className="space-y-2">
                  {revenueByCategory.length === 0 ? (
                    <p className="font-body text-xs text-muted-foreground text-center py-4">No delivered orders yet</p>
                  ) : revenueByCategory.map(cat => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="font-body text-sm text-foreground w-32 truncate shrink-0">{cat.name}</span>
                      <div className="flex-1 bg-secondary/50 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(cat.revenue / revenueByCategory[0].revenue) * 100}%` }} />
                      </div>
                      <span className="font-body text-xs font-semibold text-foreground">₹{cat.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Insights */}
              <div className="bg-card rounded-2xl p-5 border border-border/50 md:col-span-2">
                <h3 className="font-heading text-base font-semibold mb-3">Insights & Recommendations</h3>
                <div className="space-y-2">
                  {cancellationRate > 10 && (
                    <div className="flex gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-red-500 text-sm">⚠</span>
                      <p className="font-body text-xs text-red-700">Cancellation rate is {cancellationRate.toFixed(1)}% — review why orders are being cancelled. Consider confirming orders faster.</p>
                    </div>
                  )}
                  {avgFulfillmentDays > 2 && deliveredOrders.length > 0 && (
                    <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-amber-500 text-sm">⏱</span>
                      <p className="font-body text-xs text-amber-700">Avg fulfillment is {avgFulfillmentDays.toFixed(1)} days. Faster preparation could improve customer satisfaction and repeat orders.</p>
                    </div>
                  )}
                  {projectedRevenue > 0 && (
                    <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-amber-500 text-sm">📦</span>
                      <p className="font-body text-xs text-amber-700">₹{projectedRevenue.toLocaleString()} is in the pipeline from {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}. Convert these to boost actual revenue.</p>
                    </div>
                  )}
                  {repeatCustomers > 0 && (
                    <div className="flex gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-green-500 text-sm">⭐</span>
                      <p className="font-body text-xs text-green-700">{repeatCustomers} repeat customer{repeatCustomers !== 1 ? "s" : ""} — great sign! Consider loyalty offers or early access to keep them coming back.</p>
                    </div>
                  )}
                  {monthGrowth !== null && monthGrowth < 0 && (
                    <div className="flex gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-red-500 text-sm">📉</span>
                      <p className="font-body text-xs text-red-700">Revenue dropped {Math.abs(monthGrowth).toFixed(1)}% vs last month. Consider running a promotion or pushing featured products.</p>
                    </div>
                  )}
                  {monthGrowth !== null && monthGrowth > 20 && (
                    <div className="flex gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-green-500 text-sm">🚀</span>
                      <p className="font-body text-xs text-green-700">Revenue is up {monthGrowth.toFixed(1)}% this month! Great momentum — make sure inventory and capacity can keep up.</p>
                    </div>
                  )}
                  {revenueByCategory.length > 0 && (
                    <div className="flex gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-blue-500 text-sm">💡</span>
                      <p className="font-body text-xs text-blue-700">Top revenue category: <strong>{revenueByCategory[0].name}</strong> (₹{revenueByCategory[0].revenue.toLocaleString()}). Consider expanding its product range or adding seasonal variants.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Instagram Tab ── */}
        {!dataLoading && tab === "instagram" && (
          <motion.div key="instagram" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-heading text-base font-semibold text-foreground mb-1">Instagram Grid</h3>
              <p className="font-body text-xs text-muted-foreground">Set up to 6 posts. Paste the Instagram post URL and upload the post image. Clicking the image on the site will open the post.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {instaPosts.map((slot, i) => {
                const preview = slot._preview || slot.image_url;
                const isSaving = instaUploading === i;
                return (
                  <div key={i} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                    {/* Image slot */}
                    <div
                      className="relative aspect-square bg-secondary/30 cursor-pointer group"
                      onClick={() => !preview && instaFileRefs.current[i]?.click()}
                    >
                      {preview ? (
                        <>
                          <img src={preview} alt={`Slot ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button type="button" onClick={e => { e.stopPropagation(); instaFileRefs.current[i]?.click(); }}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                              <Upload className="w-4 h-4 text-white" />
                            </button>
                            <button type="button" onClick={e => { e.stopPropagation(); clearInstaSlot(i); }}
                              className="p-2 bg-white/20 hover:bg-red-500/70 rounded-full transition-colors">
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <Upload className="w-6 h-6" />
                          <span className="font-body text-xs">Upload image</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 w-6 h-6 bg-black/50 text-white rounded-full text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    </div>
                    <input ref={el => instaFileRefs.current[i] = el} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleInstaImageSelect(i, f); e.target.value = ""; }} />

                    {/* URL + Save */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <input
                          type="url"
                          placeholder="https://instagram.com/p/..."
                          value={slot.post_url}
                          onChange={e => updateInstaSlot(i, { post_url: e.target.value })}
                          className="flex-1 text-xs font-body bg-secondary/50 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
                        />
                      </div>
                      <button type="button" onClick={() => saveInstaSlot(i)} disabled={isSaving}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-foreground text-background rounded-lg font-body text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" />
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Banners / Announcements ── */}
        {!dataLoading && tab === "banners" && (
          <motion.div key="banners" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {editingAnnouncementId ? "Edit Announcement" : "Add New Announcement"}
              </h3>
              <div className="flex gap-3">
                <input
                  value={announcementText}
                  onChange={e => setAnnouncementText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveAnnouncement()}
                  placeholder="e.g. 🎉 Free delivery this weekend!"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={saveAnnouncement}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl font-body text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Check className="w-4 h-4" />
                  {editingAnnouncementId ? "Save" : "Add"}
                </button>
                {editingAnnouncementId && (
                  <button
                    type="button"
                    onClick={() => { setEditingAnnouncementId(null); setAnnouncementText(""); }}
                    className="shrink-0 px-3 py-2 border border-border rounded-xl font-body text-sm text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Announcements ({announcements.length})
                </h3>
                <p className="font-body text-xs text-muted-foreground mt-0.5">Toggle to show/hide on the site banner</p>
              </div>
              {announcements.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Megaphone className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-body text-sm text-muted-foreground">No announcements yet. Add one above.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {announcements.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleAnnouncement(a.id, a.is_active)}
                        className="shrink-0"
                        title={a.is_active ? "Active — click to hide" : "Hidden — click to show"}
                      >
                        {a.is_active
                          ? <ToggleRight className="w-6 h-6 text-green-500" />
                          : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                      </button>
                      <p className={`flex-1 font-body text-sm ${a.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>
                        {a.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setEditingAnnouncementId(a.id); setAnnouncementText(a.text); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(a.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>

    {/* ── Image Lightbox ── */}
    <AnimatePresence>
      {lightboxImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            src={lightboxImage}
            alt="Reference"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default Admin;