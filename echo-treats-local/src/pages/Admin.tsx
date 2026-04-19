import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Package, ShoppingBag, Plus, Trash2, Edit2, Check, Pencil,
  MessageSquare, Star, Bell, X, Upload, Download, Users,
  BarChart2, Tag, TrendingUp, ChevronDown, Search, RefreshCw,
  ToggleLeft, ToggleRight, Megaphone, Instagram, Link,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type CustomOrder = Database["public"]["Tables"]["custom_orders"]["Row"];

const emptyProductForm = {
  name: "", description: "", price: "", cost_price: "", category_id: "",
  tags: "", image_url: "", is_featured: false, occasion: "", is_available: true,
};

const formatLakh = (n: number) => {
  if (n >= 1000000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
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
  const { tab: tabParam } = useParams();

  const tab = (tabParam || "orders") as "products" | "orders" | "custom" | "feedback" | "analytics" | "users" | "categories" | "store" | "banners" | "instagram" | "profitability";
  const setTab = (t: string) => navigate(`/admin/${t}`, { replace: true });
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

  // Notification dismiss tracking — stored in localStorage
  const NOTIF_KEY = "admin_notif_seen";
  const getSeenCounts = (): { orders?: number; custom?: number; feedbacks?: number } => {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}"); } catch { return {}; }
  };
  const [seenCounts, setSeenCounts] = useState<{ orders?: number; custom?: number; feedbacks?: number }>(getSeenCounts);
  const [profitPeriod, setProfitPeriod] = useState<"week" | "month" | "quarter" | "year">("year");
  const [categoryDrilldown, setCategoryDrilldown] = useState<string | null>(null);
  const [profitTabPeriod, setProfitTabPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [profitTabDrilldown, setProfitTabDrilldown] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Multi-media state for product form
  type MediaItem = { type: "image" | "video" | "gif"; url: string; file?: File; preview?: string };
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");

  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [addingUser, setAddingUser] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState("");
  const [remarkEditId, setRemarkEditId] = useState<string | null>(null);
  const [remarkInput, setRemarkInput] = useState("");
  const [costInput, setCostInput] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderEditForm, setOrderEditForm] = useState<any>(null);
  const [orderEditItems, setOrderEditItems] = useState<any[]>([]);
  const [orderSort, setOrderSort] = useState<"newest" | "oldest" | "total-high" | "total-low">("newest");
  const [customOrderFilter, setCustomOrderFilter] = useState("all");
  const [customOrderSort, setCustomOrderSort] = useState<"newest" | "oldest">("newest");
  const [customOrderSearch, setCustomOrderSearch] = useState("");

  const emptyOfflineOrder = {
    first_name: "", last_name: "", guest_email: "", guest_phone: "",
    occasion: "", product_type: "", flavor: "", size_quantity: "",
    status: "confirmed", delivery_date: "", delivery_address: "", pincode: "",
    cake_message: "", special_request: "", food_allergy: "",
  };
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [offlineOrderForm, setOfflineOrderForm] = useState(emptyOfflineOrder);
  const [offlineOrderItems, setOfflineOrderItems] = useState([{ name: "", quantity: "1", unit_price: "" }]);
  const [savingOfflineOrder, setSavingOfflineOrder] = useState(false);
  const [offlineOrderImageFile, setOfflineOrderImageFile] = useState<File | null>(null);
  const [offlineOrderImagePreview, setOfflineOrderImagePreview] = useState<string | null>(null);
  const offlineOrderImageRef = useRef<HTMLInputElement>(null);
  const [productSort, setProductSort] = useState<"newest" | "oldest" | "name-az" | "price-low" | "price-high">("newest");

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

  // Products tab — category-first view
  const [adminProductsView, setAdminProductsView] = useState<"categories" | "list">("categories");
  // Featured home slots: categoryId -> array of 6 product IDs (null = empty slot)
  const [featuredSlotsMap, setFeaturedSlotsMap] = useState<Record<string, (string | null)[]>>({});

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

      // Visit stats — fire in background, don't block main data load
      const now2 = new Date();
      const todayStart = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate()).toISOString();
      const weekStart = new Date(now2.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString();
      Promise.all([
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }),
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }).gte("visited_at", todayStart),
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }).gte("visited_at", weekStart),
        (supabase.from("site_visits" as any) as any).select("id", { count: "exact", head: true }).gte("visited_at", monthStart),
      ]).then(([vTotal, vToday, vWeek, vMonth]) => {
        setVisitStats({
          total: vTotal.count ?? 0,
          today: vToday.count ?? 0,
          thisWeek: vWeek.count ?? 0,
          thisMonth: vMonth.count ?? 0,
        });
      }).catch(() => {});
      if (ig.data) {
        const filled = Array.from({ length: 5 }, (_, i) => {
          const existing = (ig.data as any[]).find(r => r.sort_order === i + 1);
          return existing
            ? { ...existing, _file: null, _preview: null }
            : { id: null, sort_order: i + 1, post_url: "", image_url: "", _file: null, _preview: null };
        });
        setInstaPosts(filled);
      }

      // Load featured home slots in background (table may not exist yet)
      (supabase.from("category_home_slots" as any) as any).select("*").order("slot_position").then((slotsRes: any) => {
        if (slotsRes.data) {
          const map: Record<string, (string | null)[]> = {};
          (slotsRes.data as any[]).forEach((slot: any) => {
            if (!map[slot.category_id]) map[slot.category_id] = Array(6).fill(null);
            const idx = slot.slot_position - 1;
            if (idx >= 0 && idx < 6) map[slot.category_id][idx] = slot.product_id;
          });
          setFeaturedSlotsMap(map);
        }
      }).catch(() => {});
    } catch (err) {
      toast.error("Failed to load admin data. Please refresh.");
    } finally {
      setDataLoading(false);
    }
  };


  // ── Featured Home Slots ───────────────────────────────────────
  const saveFeaturedSlot = async (categoryId: string, slotPos: number, productId: string | null) => {
    try {
      if (productId) {
        await (supabase.from("category_home_slots" as any) as any).upsert(
          { category_id: categoryId, slot_position: slotPos, product_id: productId },
          { onConflict: "category_id,slot_position" }
        );
      } else {
        await (supabase.from("category_home_slots" as any) as any)
          .delete().eq("category_id", categoryId).eq("slot_position", slotPos);
      }
      setFeaturedSlotsMap(prev => {
        const catSlots = [...(prev[categoryId] || Array(6).fill(null))];
        catSlots[slotPos - 1] = productId;
        return { ...prev, [categoryId]: catSlots };
      });
      toast.success(`Slot ${slotPos} updated`);
    } catch {
      toast.error("Failed to update slot — ensure the category_home_slots table exists in Supabase.");
    }
  };

  // ── Products ──────────────────────────────────────────────────
  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setShowAddProduct(false);
    setMediaItems([]);
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setShowAddProduct(true);
    setProductForm({
      name: product.name || "", description: product.description || "",
      price: product.price ? String(product.price) : "",
      cost_price: (product as any).cost_price ? String((product as any).cost_price) : "",
      category_id: product.category_id || "", tags: product.tags?.join(", ") || "",
      image_url: product.image_url || "", is_featured: product.is_featured || false,
      occasion: (product as any).occasion || "", is_available: product.is_available ?? true,
    });
    const existingMedia: MediaItem[] = ((product as any).media_urls as MediaItem[] | null) || [];
    setMediaItems(existingMedia);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProduct = async () => {
    setUploadingImage(true);
    // Upload any new media files
    const uploadedMedia: MediaItem[] = [];
    for (const item of mediaItems) {
      if (item.file) {
        const ext = item.file.name.split(".").pop();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(fileName, item.file, { upsert: true });
        if (error) { toast.error("Media upload failed"); setUploadingImage(false); return; }
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        uploadedMedia.push({ type: item.type, url: data.publicUrl });
      } else {
        uploadedMedia.push({ type: item.type, url: item.url });
      }
    }
    // First media item (image/gif) becomes image_url for backwards compat
    const firstImageItem = uploadedMedia.find(m => m.type === "image" || m.type === "gif");
    const imageUrl = firstImageItem?.url || productForm.image_url || null;
    setUploadingImage(false);

    const tags = productForm.tags ? productForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const payload = {
      name: productForm.name, description: productForm.description,
      price: parseFloat(productForm.price), category_id: productForm.category_id || null,
      cost_price: productForm.cost_price ? parseFloat(productForm.cost_price) : null,
      tags, image_url: imageUrl, is_featured: productForm.is_featured,
      occasion: productForm.occasion || null, is_available: productForm.is_available,
      media_urls: uploadedMedia.length > 0 ? uploadedMedia : null,
    } as any;

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

  // ── Custom Order Status Update (creates order on accept) ──────
  const updateCustomOrderStatus = async (co: CustomOrder, newStatus: string) => {
    const { error } = await supabase.from("custom_orders").update({ status: newStatus }).eq("id", co.id);
    if (error) { toast.error("Failed to update status"); return; }

    if (newStatus === "accepted") {
      // Check if an order for this custom order already exists (by notes marker)
      const marker = `[Custom Order: ${co.id}]`;
      const { data: existing } = await supabase.from("orders").select("id").ilike("notes", `%${co.id}%`).maybeSingle();
      if (!existing) {
        const orderPayload: any = {
          guest_name: co.name,
          guest_email: co.email,
          guest_phone: co.phone,
          total: 0,
          status: "preparing",
          notes: [marker, co.message].filter(Boolean).join("\n"),
          delivery_address: (co as any).address || null,
          delivery_date: co.delivery_date || null,
          user_id: co.user_id || null,
        };
        const { error: orderErr } = await supabase.from("orders").insert(orderPayload);
        if (orderErr) {
          toast.error("Status updated but failed to create order");
        } else {
          toast.success("Custom order accepted — order created in Orders tab");
        }
      } else {
        toast.success("Status updated");
      }
    } else {
      toast.success("Status updated");
    }

    await fetchAll();
  };

  // ── Orders ────────────────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update order"); return; }
    toast.success("Order updated");
    await fetchAll();
  };

  const savePayment = async (orderId: string, amount: number) => {
    const { error } = await (supabase.from("orders") as any).update({
      payment_received: true,
      payment_amount: amount,
    }).eq("id", orderId);
    if (error) { toast.error("Failed to save payment"); return; }
    toast.success("Payment recorded");
    setPaymentOrderId(null);
    setPaymentInput("");
    await fetchAll();
  };

  const startEditOrder = (o: Order) => {
    const isOff = (o.notes || "").includes("[Offline Order]");
    const gn = (key: string) => (o.notes || "").match(new RegExp(`${key}: (.+)`))?.[1]?.trim() || "";
    const cleanExtra = isOff ? (o.notes || "")
      .replace(/\[Offline Order\]\n?/,"").replace(/\[Reference Image\]\s*https?:\/\/\S+\n?/g,"")
      .replace(/Occasion:.+\n?/g,"").replace(/Product Type:.+\n?/g,"").replace(/Flavor:.+\n?/g,"")
      .replace(/Size\/Qty:.+\n?/g,"").replace(/Pincode:.+\n?/g,"").replace(/Cake Message:.+\n?/g,"")
      .replace(/Special Request:.+\n?/g,"").replace(/Food Allergy:.+\n?/g,"").trim()
      : (o.notes || "");
    setOrderEditForm({
      guest_name: o.guest_name || "", guest_email: o.guest_email || "", guest_phone: o.guest_phone || "",
      delivery_date: o.delivery_date || "", delivery_address: o.delivery_address || "",
      size_preference: (o as any).size_preference || "",
      occasion: gn("Occasion"), product_type: gn("Product Type"), flavor: gn("Flavor"),
      size_qty: gn("Size/Qty"), cake_message: gn("Cake Message"),
      special_request: gn("Special Request"), food_allergy: gn("Food Allergy"),
      extra_notes: cleanExtra,
    });
    setOrderEditItems((orderItems[o.id] || []).map((i: any) => ({
      id: i.id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price,
    })));
  };

  const saveOrderEdit = async () => {
    if (!selectedOrder || !orderEditForm) return;
    const o = selectedOrder;
    const isOff = (o.notes || "").includes("[Offline Order]");
    const refImg = (o.notes || "").match(/\[Reference Image\]\s*(https?:\/\/\S+)/)?.[1] || "";
    let notes: string | null = orderEditForm.extra_notes || null;
    if (isOff) {
      notes = [
        "[Offline Order]",
        orderEditForm.occasion && `Occasion: ${orderEditForm.occasion}`,
        orderEditForm.product_type && `Product Type: ${orderEditForm.product_type}`,
        orderEditForm.flavor && `Flavor: ${orderEditForm.flavor}`,
        orderEditForm.size_qty && `Size/Qty: ${orderEditForm.size_qty}`,
        orderEditForm.cake_message && `Cake Message: ${orderEditForm.cake_message}`,
        orderEditForm.special_request && `Special Request: ${orderEditForm.special_request}`,
        orderEditForm.food_allergy && `Food Allergy: ${orderEditForm.food_allergy}`,
        refImg && `[Reference Image] ${refImg}`,
        orderEditForm.extra_notes,
      ].filter(Boolean).join("\n");
    }
    const newTotal = orderEditItems.reduce((s, i) => s + Number(i.unit_price) * (Number(i.quantity) || 1), 0);
    const { error } = await (supabase.from("orders") as any).update({
      guest_name: orderEditForm.guest_name || null, guest_email: orderEditForm.guest_email || null,
      guest_phone: orderEditForm.guest_phone || null, delivery_date: orderEditForm.delivery_date || null,
      delivery_address: orderEditForm.delivery_address || null, notes,
      size_preference: orderEditForm.size_preference || null, total: newTotal || o.total,
    }).eq("id", o.id);
    if (error) { toast.error("Failed to update order"); return; }
    await supabase.from("order_items").delete().eq("order_id", o.id);
    const valid = orderEditItems.filter(i => i.product_name?.trim());
    if (valid.length > 0) {
      await supabase.from("order_items").insert(valid.map(i => ({
        order_id: o.id, product_name: i.product_name.trim(),
        quantity: Number(i.quantity) || 1, unit_price: Number(i.unit_price) || 0,
      })));
    }
    toast.success("Order updated");
    setOrderEditForm(null);
    setSelectedOrder(null);
    await fetchAll();
  };

  const clearPayment = async (orderId: string) => {
    const { error } = await (supabase.from("orders") as any).update({
      payment_received: false,
      payment_amount: null,
    }).eq("id", orderId);
    if (error) { toast.error("Failed to update payment"); return; }
    toast.success("Payment cleared");
    await fetchAll();
  };

  const saveOrderAdminData = async (orderId: string) => {
    const { error } = await (supabase.from("orders") as any).update({
      admin_remark: remarkInput.trim() || null,
      cost_price: costInput ? parseFloat(costInput) : null,
    }).eq("id", orderId);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Saved");
    setRemarkEditId(null);
    await fetchAll();
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order record?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error("Failed to delete order"); return; }
    toast.success("Order deleted");
    await fetchAll();
  };

  const resetOfflineOrderForm = () => {
    setOfflineOrderForm(emptyOfflineOrder);
    setOfflineOrderItems([{ name: "", quantity: "1", unit_price: "" }]);
    setOfflineOrderImageFile(null);
    setOfflineOrderImagePreview(null);
    setShowAddOrder(false);
  };

  const saveOfflineOrder = async () => {
    const guestName = `${offlineOrderForm.first_name.trim()} ${offlineOrderForm.last_name.trim()}`.trim();
    if (!guestName) { toast.error("Customer name is required"); return; }
    const validItems = offlineOrderItems.filter(i => i.name.trim() && i.unit_price);
    if (validItems.length === 0) { toast.error("Add at least one item with name and price"); return; }

    setSavingOfflineOrder(true);

    // Upload reference image if provided
    let refImageUrl = "";
    if (offlineOrderImageFile) {
      const ext = offlineOrderImageFile.name.split(".").pop();
      const fileName = `offline-orders/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(fileName, offlineOrderImageFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        refImageUrl = urlData.publicUrl;
      }
    }

    const detailLines = [
      "[Offline Order]",
      offlineOrderForm.occasion && `Occasion: ${offlineOrderForm.occasion}`,
      offlineOrderForm.product_type && `Product Type: ${offlineOrderForm.product_type}`,
      offlineOrderForm.flavor && `Flavor: ${offlineOrderForm.flavor}`,
      offlineOrderForm.size_quantity && `Size/Qty: ${offlineOrderForm.size_quantity}`,
      offlineOrderForm.pincode && `Pincode: ${offlineOrderForm.pincode}`,
      offlineOrderForm.cake_message && `Cake Message: ${offlineOrderForm.cake_message}`,
      offlineOrderForm.special_request && `Special Request: ${offlineOrderForm.special_request}`,
      offlineOrderForm.food_allergy && `Food Allergy: ${offlineOrderForm.food_allergy}`,
      refImageUrl && `[Reference Image] ${refImageUrl}`,
    ].filter(Boolean).join("\n");

    const total = validItems.reduce((sum, i) => sum + Number(i.unit_price) * Number(i.quantity || 1), 0);
    const deliveryAddr = [offlineOrderForm.delivery_address.trim(), offlineOrderForm.pincode.trim()].filter(Boolean).join(", ");

    const { data: orderData, error: orderErr } = await supabase.from("orders").insert({
      guest_name: guestName,
      guest_email: offlineOrderForm.guest_email.trim() || null,
      guest_phone: offlineOrderForm.guest_phone.trim() || null,
      status: offlineOrderForm.status,
      delivery_date: offlineOrderForm.delivery_date || null,
      delivery_address: deliveryAddr || null,
      notes: detailLines,
      total,
    }).select().single();

    if (orderErr || !orderData) {
      toast.error("Failed to create order");
      setSavingOfflineOrder(false);
      return;
    }

    const itemRows = validItems.map(i => ({
      order_id: orderData.id,
      product_name: i.name.trim(),
      quantity: Number(i.quantity) || 1,
      unit_price: Number(i.unit_price),
    }));
    await supabase.from("order_items").insert(itemRows);

    toast.success("Offline order added successfully");
    resetOfflineOrderForm();
    setSavingOfflineOrder(false);
    await fetchAll();
  };

  const exportOrdersCSV = () => {
    const cols = ["Order ID (Full)", "Order ID (Short)", "Type", "Customer", "Email", "Phone", "Total", "Status", "Payment Status", "Payment Amount", "Date", "Delivery Date", "Delivery Address", "Size Preference", "Occasion", "Product Type", "Flavor", "Size/Qty", "Cake Message", "Special Request", "Food Allergy", "Notes", "Items"];
    const escapeCSV = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [cols.map(escapeCSV).join(",")];
    filteredOrders.forEach(o => {
      const profile = profiles.find(p => p.user_id === o.user_id);
      const name = o.guest_name || profile?.full_name || "";
      const email = o.guest_email || profile?.email || "";
      const phone = o.guest_phone || profile?.phone || "";
      const items = (orderItems[o.id] || []).map((i: any) => `${i.product_name} x${i.quantity} @₹${i.unit_price}`).join("; ");
      const isOffline = (o.notes || "").includes("[Offline Order]");
      const gn = (key: string) => (o.notes || "").match(new RegExp(`${key}: (.+)`))?.[1]?.trim() ?? "";
      const cleanNotes = (o.notes || "")
        .replace(/\[Offline Order\]\n?/, "").replace(/\[Reference Image\]\s*https?:\/\/\S+\n?/g, "")
        .replace(/Occasion:.+\n?/g, "").replace(/Product Type:.+\n?/g, "").replace(/Flavor:.+\n?/g, "")
        .replace(/Size\/Qty:.+\n?/g, "").replace(/Pincode:.+\n?/g, "").replace(/Cake Message:.+\n?/g, "")
        .replace(/Special Request:.+\n?/g, "").replace(/Food Allergy:.+\n?/g, "").trim();
      const paymentReceived = (o as any).payment_received;
      const paymentAmount = paymentReceived ? String((o as any).payment_amount ?? o.total) : "";
      rows.push([
        o.id, o.id.slice(0, 8).toUpperCase(), isOffline ? "Offline" : "Online",
        name, email, phone, String(o.total), o.status,
        paymentReceived ? "Received" : "Pending", paymentAmount,
        new Date(o.created_at).toLocaleString(), o.delivery_date || "",
        o.delivery_address || "", (o as any).size_preference || "",
        isOffline ? gn("Occasion") : "", isOffline ? gn("Product Type") : "",
        isOffline ? gn("Flavor") : "", isOffline ? gn("Size/Qty") : "",
        isOffline ? gn("Cake Message") : "", isOffline ? gn("Special Request") : "",
        isOffline ? gn("Food Allergy") : "", cleanNotes, items,
      ].map(escapeCSV).join(","));
    });
    const csv = rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
  };

  const exportUsersCSV = () => {
    const escapeCSV = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const cols = ["User ID", "Full Name", "Email", "Phone", "Role", "Joined Date", "Total Orders", "Total Spent"];
    const rows = [cols.map(escapeCSV).join(",")];
    profiles.forEach(p => {
      const role = userRoles.find(r => r.user_id === p.user_id && r.role === "admin") ? "Admin" : "Customer";
      const userOrders = orders.filter(o => o.user_id === p.user_id);
      const totalSpent = userOrders.reduce((s, o) => s + Number(o.total), 0);
      rows.push([
        p.user_id, p.full_name || "", p.email || "", p.phone || "",
        role, new Date(p.created_at).toLocaleString(),
        String(userOrders.length), String(totalSpent),
      ].map(escapeCSV).join(","));
    });
    const csv = rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
  };

  // ── Feedback ───────────────────────────────────────────────────
  const exportFeedbackCSV = () => {
    const escapeCSV = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const cols = ["ID", "Name", "Email", "Phone", "Taste Rating", "Presentation Rating", "Service Rating", "Avg Rating", "Products Tried", "Comment", "Homepage Position", "Submitted At"];
    const rows = [cols.map(escapeCSV).join(",")];
    feedbacks.forEach((fb: any) => {
      const avg = (((fb.taste_rating || 0) + (fb.presentation_rating || 0) + (fb.service_rating || 0)) / 3).toFixed(1);
      rows.push([
        fb.id, fb.name || "", fb.email || "", fb.phone || "",
        String(fb.taste_rating ?? ""), String(fb.presentation_rating ?? ""), String(fb.service_rating ?? ""),
        avg,
        (fb.product_ids || []).join("; "),
        fb.comment || "",
        fb.display_position ? String(fb.display_position) : "",
        new Date(fb.created_at).toLocaleString(),
      ].map(escapeCSV).join(","));
    });
    const csv = rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "feedback.csv"; a.click();
  };

  const setFeedbackPosition = async (fbId: string, position: number | null) => {
    const { error } = await supabase.from("feedback" as any).update({ display_position: position } as any).eq("id", fbId);
    if (error) { toast.error(`Failed to update position: ${error.message}`); return; }
    setFeedbacks(prev => prev.map((fb: any) => {
      // Clear the same position from any other card first
      if (position !== null && fb.id !== fbId && fb.display_position === position) return { ...fb, display_position: null };
      if (fb.id === fbId) return { ...fb, display_position: position };
      return fb;
    }));
    toast.success(position ? `Pinned to homepage slot ${position}` : "Unpinned from homepage");
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

  const deleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Permanently delete user "${name}"? This cannot be undone.`)) return;
    const { data, error } = await supabase.functions.invoke("delete-user", { body: { user_id: userId } });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed to delete user");
      return;
    }
    toast.success("User deleted");
    await fetchAll();
  };

  // ── Analytics ─────────────────────────────────────────────────
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const activeOrders = orders.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  // Actual revenue = payment received only
  const paidOrders = orders.filter(o => (o as any).payment_received);
  const actualRevenue = paidOrders.reduce((s, o) => s + Number((o as any).payment_amount ?? o.total), 0);
  // Projected = pipeline orders (not yet delivered, not cancelled)
  const projectedRevenue = activeOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue = paidOrders.length > 0 ? actualRevenue / paidOrders.length : 0;
  const cancellationRate = orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0;

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const pendingCustom = customOrders.filter(co => co.status === "pending").length;
  const totalNotifications = pendingOrders + pendingCustom + feedbacks.length;
  // Only show badge for counts that exceed what was last "seen"
  const unseenOrders = Math.max(0, pendingOrders - (seenCounts.orders ?? 0));
  const unseenCustom = Math.max(0, pendingCustom - (seenCounts.custom ?? 0));
  const unseenFeedbacks = Math.max(0, feedbacks.length - (seenCounts.feedbacks ?? 0));
  const unseenCount = unseenOrders + unseenCustom + unseenFeedbacks;

  const dismissNotifications = () => {
    const seen = { orders: pendingOrders, custom: pendingCustom, feedbacks: feedbacks.length };
    localStorage.setItem(NOTIF_KEY, JSON.stringify(seen));
    setSeenCounts(seen);
  };

  // Avg fulfillment days (created → delivered, using updated_at as proxy)
  const fulfillmentDays = deliveredOrders.map(o => {
    const created = new Date(o.created_at).getTime();
    const updated = new Date(o.updated_at).getTime();
    return (updated - created) / (1000 * 60 * 60 * 24);
  });
  const avgFulfillmentDays = fulfillmentDays.length > 0
    ? fulfillmentDays.reduce((s, d) => s + d, 0) / fulfillmentDays.length
    : 0;

  // Monthly revenue (current month, payment received only)
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthRevenue = paidOrders.filter(o => o.created_at.startsWith(thisMonthStr)).reduce((s, o) => s + Number((o as any).payment_amount ?? o.total), 0);
  const lastMonthRevenue = paidOrders.filter(o => o.created_at.startsWith(lastMonthStr)).reduce((s, o) => s + Number((o as any).payment_amount ?? o.total), 0);
  const monthGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null;

  // Repeat customers (placed more than 1 order)
  const ordersByUser = orders.reduce((acc: Record<string, number>, o) => {
    const key = o.user_id || o.guest_email || "guest";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const repeatCustomers = Object.values(ordersByUser).filter(c => c > 1).length;

  const _deliveredOrderIdsForCat = new Set(deliveredOrders.map(o => o.id));
  const revenueByCategory = categories.map(cat => {
    const catProducts = products.filter(p => p.category_id === cat.id);
    const catProductIds = catProducts.map(p => p.id);
    const cpMap: Record<string, number | null> = {};
    catProducts.forEach(p => { cpMap[p.id] = (p as any).cost_price != null ? Number((p as any).cost_price) : null; });

    let revenue = 0;
    let revenueWithCp = 0;
    let totalCost = 0;
    let unitsSold = 0;

    Object.entries(orderItems).forEach(([orderId, items]) => {
      if (!_deliveredOrderIdsForCat.has(orderId)) return;
      (items as any[]).forEach((item: any) => {
        if (!catProductIds.includes(item.product_id)) return;
        const lineRevenue = Number(item.unit_price) * item.quantity;
        revenue += lineRevenue;
        unitsSold += item.quantity;
        if (cpMap[item.product_id] != null) {
          revenueWithCp += lineRevenue;
          totalCost += cpMap[item.product_id]! * item.quantity;
        }
      });
    });

    const profit = revenueWithCp - totalCost;
    const margin = revenueWithCp > 0 ? (profit / revenueWithCp) * 100 : null;

    // Product-level SP/CP averages for display even if no orders yet
    const productsWithCp = catProducts.filter(p => (p as any).cost_price != null);
    const avgSp = catProducts.length > 0 ? catProducts.reduce((s, p) => s + Number(p.price), 0) / catProducts.length : null;
    const avgCp = productsWithCp.length > 0 ? productsWithCp.reduce((s, p) => s + Number((p as any).cost_price), 0) / productsWithCp.length : null;
    const avgMargin = avgSp && avgCp && avgSp > 0 ? ((avgSp - avgCp) / avgSp) * 100 : null;

    return {
      name: cat.name,
      revenue, revenueWithCp, totalCost, profit, margin, unitsSold,
      hasCp: revenueWithCp > 0,
      productCount: catProducts.length,
      avgSp, avgCp, avgMargin,
      hasProductCp: productsWithCp.length > 0,
    };
  }).filter(c => c.productCount > 0).sort((a, b) => b.revenue - a.revenue);

  // ── Period-filtered Profitability ──────────────────────────────
  const profitPeriodStart = (() => {
    const n = new Date();
    if (profitPeriod === "week") { const d = new Date(n); d.setDate(d.getDate() - 7); return d; }
    if (profitPeriod === "month") return new Date(n.getFullYear(), n.getMonth(), 1);
    if (profitPeriod === "quarter") { const d = new Date(n); d.setMonth(d.getMonth() - 3); return d; }
    return new Date(n.getFullYear(), 0, 1);
  })();
  const profitPrevStart = (() => {
    const n = new Date();
    if (profitPeriod === "week") { const d = new Date(n); d.setDate(d.getDate() - 14); return d; }
    if (profitPeriod === "month") return new Date(n.getFullYear(), n.getMonth() - 1, 1);
    if (profitPeriod === "quarter") { const d = new Date(n); d.setMonth(d.getMonth() - 6); return d; }
    return new Date(n.getFullYear() - 1, 0, 1);
  })();
  const profitPrevEnd = (() => {
    const n = new Date();
    if (profitPeriod === "week") { const d = new Date(n); d.setDate(d.getDate() - 7); return d; }
    if (profitPeriod === "month") return new Date(n.getFullYear(), n.getMonth(), 1);
    if (profitPeriod === "quarter") { const d = new Date(n); d.setMonth(d.getMonth() - 3); return d; }
    return new Date(n.getFullYear(), 0, 1);
  })();
  const periodDelivered = deliveredOrders.filter(o => new Date(o.created_at) >= profitPeriodStart);
  const prevPeriodDelivered = deliveredOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= profitPrevStart && d < profitPrevEnd;
  });
  const calcPeriodStats = (ords: Order[]) => {
    let sp = 0, cp = 0, hasCp = false;
    ords.forEach(o => {
      sp += Number((o as any).payment_amount ?? o.total);
      const items = (orderItems[o.id] || []) as any[];
      let itemsCp = 0; let allHave = items.length > 0;
      items.forEach((item: any) => {
        const prod = products.find(p => p.id === item.product_id);
        const c = prod && (prod as any).cost_price != null ? Number((prod as any).cost_price) : null;
        if (c != null) itemsCp += c * item.quantity; else allHave = false;
      });
      if (allHave && items.length > 0) { cp += itemsCp; hasCp = true; }
      else if ((o as any).cost_price != null) { cp += Number((o as any).cost_price); hasCp = true; }
    });
    const profit = sp - cp;
    const margin = hasCp && sp > 0 ? (profit / sp) * 100 : null;
    return { sp, cp, profit, margin, hasCp };
  };
  const periodStats = calcPeriodStats(periodDelivered);
  const prevStats = calcPeriodStats(prevPeriodDelivered);
  const pctChange = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : null;
  const spChange = pctChange(periodStats.sp, prevStats.sp);
  const cpChange = pctChange(periodStats.cp, prevStats.cp);
  const profitChange = pctChange(periodStats.profit, prevStats.profit);
  const periodCategoryStats = categories.map(cat => {
    const catProds = products.filter(p => p.category_id === cat.id);
    const catProdIds = catProds.map(p => p.id);
    const cpMapCat: Record<string, number | null> = {};
    catProds.forEach(p => { cpMapCat[p.id] = (p as any).cost_price != null ? Number((p as any).cost_price) : null; });
    let catRev = 0, catCost = 0, catUnits = 0; let catHasCp = false;
    const ordSet = new Set<string>();
    periodDelivered.forEach(o => {
      (orderItems[o.id] || []).forEach((item: any) => {
        if (!catProdIds.includes(item.product_id)) return;
        catRev += Number(item.unit_price) * item.quantity;
        catUnits += item.quantity;
        ordSet.add(o.id);
        if (cpMapCat[item.product_id] != null) { catCost += cpMapCat[item.product_id]! * item.quantity; catHasCp = true; }
      });
    });
    const catProfit = catRev - catCost;
    const catMargin = catHasCp && catRev > 0 ? (catProfit / catRev) * 100 : null;
    return { id: cat.id, name: cat.name, revenue: catRev, cost: catCost, profit: catProfit, margin: catMargin, unitsSold: catUnits, hasCp: catHasCp, orderCount: ordSet.size, catProds, cpMapCat };
  }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  const drilldownCat = periodCategoryStats.find(c => c.name === categoryDrilldown);
  const drilldownProducts = drilldownCat ? drilldownCat.catProds.map(prod => {
    let dUnits = 0, dSp = 0, dCp = 0;
    const hasCp = (prod as any).cost_price != null;
    periodDelivered.forEach(o => {
      (orderItems[o.id] || []).forEach((item: any) => {
        if (item.product_id !== prod.id) return;
        dUnits += item.quantity;
        dSp += Number(item.unit_price) * item.quantity;
        if (hasCp) dCp += Number((prod as any).cost_price) * item.quantity;
      });
    });
    const dProfit = dSp - dCp;
    const dMargin = hasCp && dSp > 0 ? (dProfit / dSp) * 100 : null;
    return { name: prod.name, unitSp: Number(prod.price), unitCp: hasCp ? Number((prod as any).cost_price) : null, unitsSold: dUnits, totalSp: dSp, totalCp: hasCp ? dCp : null, profit: hasCp ? dProfit : null, margin: dMargin };
  }).filter(p => p.unitsSold > 0).sort((a, b) => b.unitsSold - a.unitsSold) : [];

  // ── Profitability Tab ─────────────────────────────────────────────────────
  // SP = order_items.unit_price × quantity (never products.price)
  // CP = orders.cost_price (order-level; distributed proportionally to items by SP share)
  const productById = new Map(products.map(p => [p.id, p]));
  const categoryById = new Map(categories.map(c => [c.id, c]));

  const getProfitPeriodRange = (period: "week" | "month" | "quarter" | "year", offset = 0) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (period === "week") {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { start, end };
    }
    if (period === "quarter") {
      const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + offset * 3, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 3, 1);
      return { start, end };
    }
    const start = new Date(now.getFullYear() + offset, 0, 1);
    const end = new Date(start.getFullYear() + 1, 0, 1);
    return { start, end };
  };

  const profitTabRange = getProfitPeriodRange(profitTabPeriod);
  const profitTabPrevRange = getProfitPeriodRange(profitTabPeriod, -1);
  const profitBaseOrders = deliveredOrders;

  const normalizeProfitText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const getProfitMetaValue = (o: Order, key: string) =>
    (o.notes || "").match(new RegExp(`${key}: (.+)`, "i"))?.[1]?.trim() || "";

  const getProfitNoteLines = (o: Order) =>
    (o.notes || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  // Guess category from item name + order notes when no product_id link exists (offline orders)
  const guessCategory = (itemName: string, notes: string): string => {
    const text = `${itemName} ${notes}`.toLowerCase();
    let bestId = "__custom__";
    let bestScore = 0;
    for (const cat of categories) {
      const catWords = `${cat.name} ${cat.slug}`.toLowerCase().split(/[\s\-&,]+/).filter(w => w.length > 2);
      let score = 0;
      for (const cw of catWords) {
        if (text.includes(cw)) { score += cw.length; continue; }
        for (const tw of text.split(/\s+/)) {
          if (tw.length > 2 && (cw.startsWith(tw) || tw.startsWith(cw))) score += Math.min(cw.length, tw.length) * 0.6;
        }
      }
      if (score > bestScore) { bestScore = score; bestId = cat.id; }
    }
    return bestScore >= 3 ? bestId : "__custom__";
  };

  const matchProductByText = (...texts: Array<string | null | undefined>): Product | null => {
    let best: Product | null = null;
    let bestScore = 0;
    const normalizedTexts = texts.map(text => normalizeProfitText(text || "")).filter(Boolean);

    normalizedTexts.forEach(text => {
      products.forEach(prod => {
        if (!prod.category_id) return;
        const prodName = normalizeProfitText(prod.name || "");
        if (!prodName) return;

        let score = 0;
        if (text === prodName) score = 1000 + prodName.length;
        else if (text.includes(prodName)) score = 600 + prodName.length;
        else if (prodName.includes(text) && text.length >= 4) score = 300 + text.length;
        else {
          const prodWords = prodName.split(" ").filter(w => w.length > 2);
          const textWords = text.split(" ").filter(w => w.length > 2);
          const shared = prodWords.filter(word => textWords.includes(word)).length;
          if (shared > 0) score = shared * 25 + prodName.length;
        }

        if (score > bestScore) {
          best = prod;
          bestScore = score;
        }
      });
    });

    return best;
  };

  const getOrderFallbackTexts = (o: Order) => {
    const lines = getProfitNoteLines(o);
    const firstMeaningfulLine = lines.find(line =>
      !/^\[.*\]$/.test(line) &&
      !/^(Occasion|Product Type|Flavor|Size\/Qty|Pincode|Cake Message|Special Request|Food Allergy):/i.test(line)
    );

    return [
      getProfitMetaValue(o, "Product Type"),
      firstMeaningfulLine,
      lines[0] || "",
      o.notes || "",
    ].filter(Boolean) as string[];
  };

  const resolveCategoryForOrderText = (text: string, o: Order) => {
    const matchedProduct = matchProductByText(text, ...getOrderFallbackTexts(o));
    const categoryId = matchedProduct?.category_id ?? guessCategory(text, o.notes || "");
    const categoryName = categoryById.get(categoryId)?.name
      ?? (categoryId === "__custom__" ? "Other / Custom" : "Unknown");
    return { categoryId, categoryName, matchedProduct };
  };

  const getOrderSp = (o: Order): number => {
    const paymentAmount = (o as any).payment_amount;
    if ((o as any).payment_received === true && paymentAmount != null) {
      return Number(paymentAmount) || 0;
    }
    return Number(o.total || 0);
  };

  const getOrderCp = (o: Order): number | null => {
    const value = (o as any).cost_price;
    if (value == null) return null;
    const num = Number(value);
    return num > 0 ? num : null;
  };

  const getProfitItemCp = (orderId: string, itemSp: number): number | null => {
    const ord = orders.find(o => o.id === orderId);
    const orderCp = ord ? getOrderCp(ord) : null;
    if (orderCp == null) return null;
    const items = (orderItems[orderId] || []) as any[];
    const orderTotalSp = items.reduce((sum: number, item: any) => (
      sum + Number(item.unit_price || 0) * (Number(item.quantity) || 0)
    ), 0);
    if (orderTotalSp <= 0) return orderCp;
    return orderCp * (itemSp / orderTotalSp);
  };

  const profitPeriodOrders = profitBaseOrders.filter(o => {
    const createdAt = new Date(o.created_at);
    return createdAt >= profitTabRange.start && createdAt < profitTabRange.end;
  });
  const profitPrevOrders = profitBaseOrders.filter(o => {
    const createdAt = new Date(o.created_at);
    return createdAt >= profitTabPrevRange.start && createdAt < profitTabPrevRange.end;
  });

  const profitAnyCp = profitBaseOrders.some(o => getOrderCp(o) != null);

  const calcProfitKpi = (ords: Order[]) => {
    let totalSp = 0;
    let spWithCp = 0;
    let totalCp = 0;
    ords.forEach(o => {
      const orderSp = getOrderSp(o);
      totalSp += orderSp;
      const orderCp = getOrderCp(o);
      if (orderCp != null) {
        spWithCp += orderSp;
        totalCp += orderCp;
      }
    });
    const profit = spWithCp - totalCp;
    const margin = spWithCp > 0 ? (profit / spWithCp) * 100 : null;
    return { totalSp, spWithCp, totalCp, profit, margin, hasCp: spWithCp > 0 };
  };
  const profitTabStats = calcProfitKpi(profitPeriodOrders);
  const profitTabPrevStats = calcProfitKpi(profitPrevOrders);
  const profitTabPct = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : null;
  const profitTabSpChg = profitTabPct(profitTabStats.totalSp, profitTabPrevStats.totalSp);
  const profitTabCpChg = profitTabPct(profitTabStats.totalCp, profitTabPrevStats.totalCp);
  const profitTabProfitChg = profitTabPct(profitTabStats.profit,  profitTabPrevStats.profit);

  // Category stats — built bottom-up from order items
  type ProfitCatEntry = {
    id: string; name: string; revenue: number; spWithCp: number; cost: number;
    hasCp: boolean; ordSet: Set<string>;
  };
  type ProfitSlice = {
    orderId: string;
    categoryId: string;
    categoryName: string;
    label: string;
    qtyLabel: string;
    revenue: number;
    cost: number | null;
    customer: string;
    createdAt: string;
  };
  const profitPeriodSlices: ProfitSlice[] = profitPeriodOrders.flatMap(o => {
    const items = (orderItems[o.id] || []) as any[];
    const orderSp = getOrderSp(o);
    const orderCp = getOrderCp(o);
    const customer = o.guest_name || "Guest";

    if (items.length === 0) {
      const fallbackTexts = getOrderFallbackTexts(o);
      const displayLabel = matchProductByText(...fallbackTexts)?.name
        || getProfitMetaValue(o, "Product Type")
        || fallbackTexts[0]
        || "Custom item";
      const resolved = resolveCategoryForOrderText(displayLabel, o);
      return [{
        orderId: o.id,
        categoryId: resolved.categoryId,
        categoryName: resolved.categoryName,
        label: resolved.matchedProduct?.name || displayLabel,
        qtyLabel: getProfitMetaValue(o, "Size/Qty") || "—",
        revenue: orderSp,
        cost: orderCp,
        customer,
        createdAt: o.created_at,
      }];
    }

    const itemBreakdown = items.map((item: any) => {
      const linkedProduct = item.product_id ? productById.get(item.product_id) : null;
      const matchedProduct = linkedProduct || matchProductByText(
        item.product_name || item.name || "",
        ...getOrderFallbackTexts(o)
      );
      const categoryId = linkedProduct?.category_id
        ?? matchedProduct?.category_id
        ?? (item as any).category_id
        ?? guessCategory(item.product_name || item.name || "", o.notes || "");
      const categoryName = categoryById.get(categoryId)?.name
        ?? (categoryId === "__custom__" ? "Other / Custom" : "Unknown");
      const quantity = Number(item.quantity) || 0;
      const baseRevenue = Number(item.unit_price || 0) * quantity;
      return {
        categoryId,
        categoryName,
        label: matchedProduct?.name || item.product_name || item.name || "Custom item",
        quantity,
        baseRevenue,
      };
    });

    const totalBaseRevenue = itemBreakdown.reduce((sum, item) => sum + item.baseRevenue, 0);
    const sliceMap: Record<string, ProfitSlice> = {};

    itemBreakdown.forEach(item => {
      const share = totalBaseRevenue > 0 ? item.baseRevenue / totalBaseRevenue : 1 / itemBreakdown.length;
      const allocatedRevenue = orderSp * share;
      const allocatedCost = orderCp != null ? orderCp * share : null;
      const key = `${o.id}:${item.categoryId}`;

      if (!sliceMap[key]) {
        sliceMap[key] = {
          orderId: o.id,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          label: item.label,
          qtyLabel: item.quantity > 0 ? String(item.quantity) : getProfitMetaValue(o, "Size/Qty") || "—",
          revenue: 0,
          cost: orderCp != null ? 0 : null,
          customer,
          createdAt: o.created_at,
        };
      } else if (!sliceMap[key].label.includes(item.label)) {
        sliceMap[key].label = `${sliceMap[key].label}, ${item.label}`;
      }

      sliceMap[key].revenue += allocatedRevenue;
      if (allocatedCost != null && sliceMap[key].cost != null) sliceMap[key].cost += allocatedCost;
      if (item.quantity > 0) {
        const nextQty = (Number(sliceMap[key].qtyLabel) || 0) + item.quantity;
        sliceMap[key].qtyLabel = String(nextQty);
      }
    });

    return Object.values(sliceMap);
  });

  const profitTabCatMap: Record<string, ProfitCatEntry> = {};
  profitPeriodSlices.forEach(slice => {
    if (!profitTabCatMap[slice.categoryId]) {
      profitTabCatMap[slice.categoryId] = {
        id: slice.categoryId,
        name: slice.categoryName,
        revenue: 0,
        spWithCp: 0,
        cost: 0,
        hasCp: false,
        ordSet: new Set(),
      };
    }
    const entry = profitTabCatMap[slice.categoryId];
    entry.revenue += slice.revenue;
    entry.ordSet.add(slice.orderId);
    if (slice.cost != null) {
      entry.cost += slice.cost;
      entry.spWithCp += slice.revenue;
      entry.hasCp = true;
    }
  });
  // Legacy aggregation kept commented while the slice-based profitability path is active.
  /*
  profitPeriodOrders.forEach(o => {
    const items = (orderItems[o.id] || []) as any[];
    if (items.length > 0) {
      items.forEach((item: any) => {
        const prod = products.find(p => p.id === item.product_id);
        const catId = prod?.category_id
          ?? (item as any).category_id
          ?? guessCategory(item.product_name || item.name || "", o.notes || "");
        if (!profitTabCatMap[catId]) {
          const cat = categories.find(c => c.id === catId);
          profitTabCatMap[catId] = {
            id: catId, name: cat?.name ?? (catId === "__custom__" ? "Other / Custom" : "Unknown"),
            revenue: 0, spWithCp: 0, cost: 0, hasCp: false, ordSet: new Set(),
            catProds: products.filter(p => p.category_id === catId),
          };
        }
        const entry = profitTabCatMap[catId];
        const qty   = Number(item.quantity) || 0;
        const itemSp = Number(item.unit_price || 0) * qty;
        entry.revenue += itemSp;
        entry.ordSet.add(o.id);
        const cpAlloc = getProfitItemCp(o.id, itemSp);
        if (cpAlloc != null) { entry.cost += cpAlloc; entry.spWithCp += itemSp; entry.hasCp = true; }
      });
    } else {
      // Order has no line items — attribute total to "Other / Custom" bucket
      const catId = "__custom__";
      if (!profitTabCatMap[catId]) {
        profitTabCatMap[catId] = {
          id: catId, name: "Other / Custom", revenue: 0, spWithCp: 0, cost: 0,
          hasCp: false, ordSet: new Set(), catProds: [],
        };
      }
      const entry = profitTabCatMap[catId];
      const ordSp = Number(o.total || 0);
      entry.revenue += ordSp;
      entry.ordSet.add(o.id);
      const hasCp = (o as any).cost_price != null && Number((o as any).cost_price) > 0;
      if (hasCp) {
        entry.cost += Number((o as any).cost_price);
        entry.spWithCp += ordSp;
        entry.hasCp = true;
      }
    }
  });
  */
  const profitTabCatStats = Object.values(profitTabCatMap).map(entry => {
    const profit = entry.hasCp ? entry.spWithCp - entry.cost : null;
    const margin = entry.hasCp && entry.spWithCp > 0 ? (profit! / entry.spWithCp) * 100 : null;
    return { ...entry, profit, margin, orderCount: entry.ordSet.size };
  }).filter(entry => entry.orderCount > 0 || entry.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // Drilldown: find selected category
  const profitTabDrillCat = profitTabCatStats.find(c => c.name === profitTabDrilldown);
  type DrillOrderRowNew = {
    orderId: string;
    name: string;
    qtyLabel: string;
    totalSp: number;
    cost: number | null;
    profit: number | null;
    margin: number | null;
    customer: string;
    createdAt: string;
  };
  const profitTabDrillRows: DrillOrderRowNew[] = (() => {
    if (!profitTabDrillCat) return [];
    return profitPeriodSlices
      .filter(slice => slice.categoryId === profitTabDrillCat.id)
      .map(slice => {
        const profit = slice.cost != null ? slice.revenue - slice.cost : null;
        const margin = slice.cost != null && slice.revenue > 0 ? (profit! / slice.revenue) * 100 : null;
        return {
          orderId: slice.orderId,
          name: slice.label,
          qtyLabel: slice.qtyLabel,
          totalSp: slice.revenue,
          cost: slice.cost,
          profit,
          margin,
          customer: slice.customer,
          createdAt: slice.createdAt,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  // Legacy drilldown kept commented while the per-order drilldown above is active.
  /*
  type DrillOrderRow = { name: string; units: number; totalSp: number; cost: number | null; profit: number | null; margin: number | null; orderCount: number };
  const profitTabDrillAllItems: DrillOrderRow[] = (() => {
    if (!profitTabDrillCat) return [];
    const cmap: Record<string, { totalSp: number; spWithCp: number; cost: number; ordSet: Set<string>; units: number }> = {};
    profitPeriodOrders.forEach(o => {
      (orderItems[o.id] || []).forEach((item: any) => {
        const prod  = products.find(p => p.id === item.product_id);
        const catId = prod?.category_id
          ?? (item as any).category_id
          ?? guessCategory(item.product_name || item.name || "", o.notes || "");
        if (catId !== profitTabDrillCat.id) return;
        const label: string = item.product_name || item.name || "Custom item";
        if (!cmap[label]) cmap[label] = { totalSp: 0, spWithCp: 0, cost: 0, ordSet: new Set(), units: 0 };
        const qty    = Number(item.quantity) || 0;
        const itemSp = Number(item.unit_price || 0) * qty;
        cmap[label].totalSp  += itemSp;
        cmap[label].units    += qty;
        cmap[label].ordSet.add(o.id);
        const cp = getProfitItemCp(o.id, itemSp);
        if (cp != null) { cmap[label].cost += cp; cmap[label].spWithCp += itemSp; }
      });
    });
    return Object.entries(cmap).map(([name, e]) => {
      const profit = e.spWithCp > 0 ? e.spWithCp - e.cost : null;
      const margin = e.spWithCp > 0 ? (profit! / e.spWithCp) * 100 : null;
      return { name, units: e.units, totalSp: e.totalSp, cost: e.spWithCp > 0 ? e.cost : null, profit, margin, orderCount: e.ordSet.size };
    }).sort((a, b) => b.totalSp - a.totalSp);
  })();
  */

  const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));
  const topProducts = products.map(p => {
    const sold = Object.values(orderItems).flat()
      .filter((i: any) => i.product_id === p.id)
      .reduce((s: number, i: any) => s + i.quantity, 0);
    const revenue = Object.entries(orderItems).reduce((s, [ordId, items]) => {
      if (!deliveredOrderIds.has(ordId)) return s;
      return s + (items as any[]).filter((i: any) => i.product_id === p.id).reduce((ss: number, i: any) => ss + Number(i.unit_price) * i.quantity, 0);
    }, 0);
    const sp = Number(p.price);
    const cp = (p as any).cost_price != null ? Number((p as any).cost_price) : null;
    const margin = cp != null && sp > 0 ? ((sp - cp) / sp) * 100 : null;
    return { name: p.name, sold, revenue, sp, cp, margin };
  }).filter(p => p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 8);

  // Profitability from orders with cost_price recorded
  const ordersWithCost = deliveredOrders.filter(o => (o as any).cost_price != null && (o as any).payment_received);
  const totalCostRecorded = ordersWithCost.reduce((s, o) => s + Number((o as any).cost_price), 0);
  const revenueFromCostOrders = ordersWithCost.reduce((s, o) => s + Number((o as any).payment_amount ?? o.total), 0);
  const totalProfit = revenueFromCostOrders - totalCostRecorded;
  const overallMargin = revenueFromCostOrders > 0 ? (totalProfit / revenueFromCostOrders) * 100 : null;

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
  const filteredOrders = orders
    .filter(o => {
      const matchStatus = orderFilter === "all" || o.status === orderFilter;
      const name = o.guest_name || profiles.find(p => p.user_id === o.user_id)?.full_name || "";
      const phone = o.guest_phone || profiles.find(p => p.user_id === o.user_id)?.phone || "";
      const matchSearch = !orderSearch || name.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.id.includes(orderSearch) || (o.guest_email || "").includes(orderSearch) ||
        phone.includes(orderSearch);
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      switch (orderSort) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "total-high": return Number(b.total) - Number(a.total);
        case "total-low": return Number(a.total) - Number(b.total);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
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
    { key: "profitability", label: "Profitability", icon: TrendingUp },
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
                {unseenCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unseenCount > 9 ? "9+" : unseenCount}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-card border border-border/50 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <p className="font-body text-xs font-semibold text-foreground">Notifications</p>
                      {unseenCount > 0 && (
                        <button type="button" onClick={dismissNotifications}
                          className="font-body text-[11px] text-primary hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {totalNotifications === 0 ? (
                      <p className="px-4 pb-4 font-body text-xs text-muted-foreground">All caught up!</p>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {pendingOrders > 0 && (
                          <button type="button" onClick={() => { setTab("orders"); setShowNotifDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                            <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-body text-xs">{pendingOrders} pending order{pendingOrders > 1 ? "s" : ""}</span>
                            </div>
                            {unseenOrders > 0 && (
                              <span className="shrink-0 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{unseenOrders}</span>
                            )}
                          </button>
                        )}
                        {pendingCustom > 0 && (
                          <button type="button" onClick={() => { setTab("custom"); setShowNotifDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                            <Edit2 className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-body text-xs">{pendingCustom} custom request{pendingCustom > 1 ? "s" : ""}</span>
                            </div>
                            {unseenCustom > 0 && (
                              <span className="shrink-0 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{unseenCustom}</span>
                            )}
                          </button>
                        )}
                        {feedbacks.length > 0 && (
                          <button type="button" onClick={() => { setTab("feedback"); setShowNotifDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                            <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-body text-xs">{feedbacks.length} feedback</span>
                            </div>
                            {unseenFeedbacks > 0 && (
                              <span className="shrink-0 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{unseenFeedbacks}</span>
                            )}
                          </button>
                        )}
                        <div className="px-4 py-2">
                          <button type="button" onClick={() => { dismissNotifications(); setShowNotifDropdown(false); }}
                            className="w-full py-1.5 font-body text-[11px] text-muted-foreground hover:text-foreground border border-border/50 rounded-lg transition-colors">
                            Clear all notifications
                          </button>
                        </div>
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
            {/* Always-visible header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {adminProductsView === "list" && productCategoryFilter !== "all" && (
                  <button type="button"
                    onClick={() => { setAdminProductsView("categories"); setProductCategoryFilter("all"); setProductSearch(""); setShowAddProduct(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg font-body text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Categories
                  </button>
                )}
                {adminProductsView === "list" && productCategoryFilter !== "all"
                  ? <p className="font-body text-sm font-semibold text-foreground">{categories.find(c => c.id === productCategoryFilter)?.name}</p>
                  : adminProductsView === "list"
                  ? <p className="font-body text-sm text-muted-foreground">All {products.length} products</p>
                  : <p className="font-body text-sm text-muted-foreground">{products.length} products across {categories.length} categories</p>
                }
              </div>
              <button type="button" onClick={() => { setEditingProductId(null); setProductForm(emptyProductForm); setShowAddProduct(true); setAdminProductsView("list"); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* ── CATEGORY OVERVIEW VIEW ── */}
            {adminProductsView === "categories" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {categories.map(cat => {
                  const catProducts = products.filter(p => p.category_id === cat.id);
                  const available = catProducts.filter(p => p.is_available).length;
                  const outOfStock = catProducts.length - available;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setProductCategoryFilter(cat.id); setAdminProductsView("list"); setProductSearch(""); }}
                      className="text-left bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-card transition-all group"
                    >
                      <p className="font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1">{cat.name}</p>
                      <p className="font-body text-2xl font-bold text-foreground mb-2">{catProducts.length}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="font-body text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">{available} available</span>
                        {outOfStock > 0 && <span className="font-body text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">{outOfStock} out of stock</span>}
                      </div>
                    </button>
                  );
                })}
                {/* All products card */}
                <button
                  type="button"
                  onClick={() => { setProductCategoryFilter("all"); setAdminProductsView("list"); setProductSearch(""); }}
                  className="text-left bg-secondary/30 border border-dashed border-border rounded-2xl p-5 hover:border-primary/50 transition-all group"
                >
                  <p className="font-heading text-base font-semibold text-muted-foreground group-hover:text-foreground transition-colors mb-1">All Products</p>
                  <p className="font-body text-2xl font-bold text-foreground mb-2">{products.length}</p>
                  <span className="font-body text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">view all</span>
                </button>
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {adminProductsView === "list" && (
              <>
                {/* Featured Home Slots — only when a specific category is selected */}
                {productCategoryFilter !== "all" && (() => {
                  const catProds = products.filter(p => p.category_id === productCategoryFilter);
                  const slots = featuredSlotsMap[productCategoryFilter] || Array(6).fill(null);
                  return (
                    <div className="bg-card border border-border/50 rounded-2xl p-5 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-heading text-sm font-semibold text-foreground">Home Page Featured Slots</p>
                          <p className="font-body text-xs text-muted-foreground mt-0.5">Choose up to 6 products shown in this category's home section. Unfilled slots fall back to sort order.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[0, 1, 2, 3, 4, 5].map(idx => (
                          <div key={idx} className="flex flex-col gap-1">
                            <label className="font-body text-[11px] font-semibold text-muted-foreground">Slot {idx + 1}</label>
                            <select
                              value={slots[idx] || ""}
                              onChange={e => saveFeaturedSlot(productCategoryFilter, idx + 1, e.target.value || null)}
                              className="px-2 py-2 bg-secondary/50 border border-border rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <option value="">— None —</option>
                              {catProds.map(p => (
                                <option key={p.id} value={p.id}>{p.name}{!p.is_available ? " (out of stock)" : ""}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Search + Sort */}
                <div className="space-y-3 mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <select value={productSort} onChange={e => setProductSort(e.target.value as any)}
                      className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none">
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name-az">Name A–Z</option>
                      <option value="price-low">Price: Low–High</option>
                      <option value="price-high">Price: High–Low</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {adminProductsView === "list" && showAddProduct && (
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">{editingProductId ? "Edit Product" : "Add Product"}</h2>
                  <button type="button" onClick={resetProductForm} className="p-2 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
                </div>

                {/* Multi-Media Upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-body text-xs font-medium text-foreground">Product Media</p>
                    <p className="font-body text-[10px] text-muted-foreground">Up to 3 images, 1 video, 1 GIF</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {mediaItems.map((item, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-secondary/30 group">
                        {item.type === "video" ? (
                          <video src={item.preview || item.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={item.preview || item.url} alt="" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute bottom-1 left-1 text-[9px] font-bold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                          {item.type}
                        </div>
                        <button type="button"
                          onClick={() => setMediaItems(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {mediaItems.length < 5 && (
                      <button type="button" onClick={() => mediaFileInputRef.current?.click()}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors bg-secondary/30 cursor-pointer">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="font-body text-[10px] text-muted-foreground">Add media</span>
                      </button>
                    )}
                  </div>
                  <p className="font-body text-[10px] text-muted-foreground mt-2">Images/GIFs (JPG, PNG, WebP, GIF) • Videos (MP4, WebM) • Max 15MB each</p>
                  <input ref={mediaFileInputRef} type="file" accept="image/*,video/*" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 15 * 1024 * 1024) { toast.error("File must be under 15MB"); return; }
                      const isVideo = file.type.startsWith("video/");
                      const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
                      const type: "image" | "video" | "gif" = isVideo ? "video" : isGif ? "gif" : "image";
                      // Enforce limits
                      const imgCount = mediaItems.filter(m => m.type === "image").length;
                      const vidCount = mediaItems.filter(m => m.type === "video").length;
                      const gifCount = mediaItems.filter(m => m.type === "gif").length;
                      if (type === "image" && imgCount >= 3) { toast.error("Max 3 images allowed"); return; }
                      if (type === "video" && vidCount >= 1) { toast.error("Max 1 video allowed"); return; }
                      if (type === "gif" && gifCount >= 1) { toast.error("Max 1 GIF allowed"); return; }
                      setMediaItems(prev => [...prev, { type, url: "", file, preview: URL.createObjectURL(file) }]);
                      e.target.value = "";
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Product Name" value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })} className={inputCls} />
                  <input placeholder="Selling Price (₹)" type="number" value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Cost Price / CP (₹) — making cost" type="number" value={productForm.cost_price}
                    onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} className={inputCls} />
                  {productForm.price && productForm.cost_price && parseFloat(productForm.price) > 0 ? (
                    <div className="flex items-center px-4 py-3 bg-secondary/50 border border-border rounded-xl">
                      <span className="font-body text-sm text-muted-foreground">Margin: </span>
                      {(() => {
                        const m = (parseFloat(productForm.price) - parseFloat(productForm.cost_price)) / parseFloat(productForm.price) * 100;
                        return (
                          <>
                            <span className={`font-body text-sm font-semibold ml-1 ${m >= 70 ? "text-purple-600" : m >= 50 ? "text-green-600" : m >= 30 ? "text-amber-600" : "text-red-500"}`}>
                              {m.toFixed(1)}%
                            </span>
                            <span className={`ml-1.5 font-body text-[10px] px-1.5 py-0.5 rounded-full ${m >= 70 ? "bg-purple-100 text-purple-700" : m >= 50 ? "bg-green-100 text-green-700" : m >= 30 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {m >= 70 ? "🔥 Premium" : m >= 50 ? "🟢 Good" : m >= 30 ? "🟡 Average" : "🔴 Low"}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center px-4 py-3 bg-secondary/30 border border-border/40 rounded-xl">
                      <span className="font-body text-xs text-muted-foreground">Enter both prices to see margin</span>
                    </div>
                  )}
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

            {adminProductsView === "list" && <div className="space-y-2">
              {products.filter(p => {
                const matchCat = productCategoryFilter === "all" || p.category_id === productCategoryFilter;
                const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
                return matchCat && matchSearch;
              }).sort((a, b) => {
                switch (productSort) {
                  case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  case "name-az": return a.name.localeCompare(b.name);
                  case "price-low": return Number(a.price) - Number(b.price);
                  case "price-high": return Number(b.price) - Number(a.price);
                  default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
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
            </div>}
          </motion.div>
        )}

        {/* ── ORDERS TAB ── */}
        {!dataLoading && tab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search by name, email, phone, order ID..." value={orderSearch}
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
              <select value={orderSort} onChange={e => setOrderSort(e.target.value as any)}
                className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="total-high">Total: High–Low</option>
                <option value="total-low">Total: Low–High</option>
              </select>
              <button type="button" onClick={exportOrdersCSV}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-body text-sm hover:bg-secondary">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button type="button" onClick={() => setShowAddOrder(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-body text-sm hover:opacity-90">
                <Plus className="w-4 h-4" /> Add Order
              </button>
            </div>

{/* inline form removed – modal rendered at root */}

            <p className="font-body text-xs text-muted-foreground mb-3">{filteredOrders.length} orders</p>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <p className="text-center py-12 font-body text-sm text-muted-foreground">No orders found</p>
              ) : filteredOrders.map(o => {
                const profile = profiles.find(p => p.user_id === o.user_id);
                const customerName = o.guest_name || profile?.full_name || "Guest";
                const customerEmail = o.guest_email || profile?.email || "—";
                const customerPhone = o.guest_phone || profile?.phone || "—";
                const items = orderItems[o.id] || [];
                const isExpanded = expandedOrder === o.id;
                const isOffline = (o.notes || "").includes("[Offline Order]");

                // Parse offline order details from notes
                const getNoteField = (key: string) => (o.notes || "").match(new RegExp(`${key}: (.+)`))?.[1]?.trim() || "";
                const offlineSize = isOffline ? getNoteField("Size/Qty") : "";
                const offlineProductType = isOffline ? getNoteField("Product Type") : "";

                // Item label: DB items take priority, then notes Product Type
                const itemLabel = items.length > 0
                  ? items.map((i: any) => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")
                  : offlineProductType;

                return (
                  <div key={o.id} className="bg-card rounded-xl border border-border/50 overflow-hidden cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelectedOrder(o)}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-body text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-body font-medium ${STATUS_COLORS[o.status] || "bg-secondary text-foreground"}`}>
                              {o.status}
                            </span>
                            {isOffline && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium bg-slate-100 text-slate-600">
                                Offline
                              </span>
                            )}
                          </div>
                          {itemLabel && (
                            <p className="font-body text-sm font-semibold text-foreground mb-1">{itemLabel}</p>
                          )}
                          <p className="font-body text-sm text-foreground">{customerName}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                            <p className="font-body text-xs text-muted-foreground">{customerEmail}</p>
                            <p className="font-body text-xs text-muted-foreground">{customerPhone}</p>
                          </div>
                          {offlineSize && (
                            <p className="font-body text-xs text-muted-foreground mt-0.5">Size: {offlineSize}</p>
                          )}
                          {items.length > 0 && (() => {
                            const totalQty = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0);
                            return <p className="font-body text-xs text-muted-foreground mt-0.5">Qty: {totalQty}</p>;
                          })()}
                          {(o as any).size_preference && (
                            <p className="font-body text-xs text-muted-foreground mt-0.5">Size: {(o as any).size_preference}</p>
                          )}
                          <p className="font-body text-xs text-muted-foreground mt-0.5">
                            Ordered: {new Date(o.created_at).toLocaleString()} {o.delivery_date ? `• Delivery: ${o.delivery_date}` : ""}
                          </p>
                          {o.status === "delivered" && (
                            <div className="mt-2 pt-2 border-t border-border/30" onClick={e => e.stopPropagation()}>
                              {(o as any).payment_received && paymentOrderId !== o.id ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-body text-xs text-green-600 font-medium">
                                    ✓ Payment received — ₹{Number((o as any).payment_amount ?? o.total).toLocaleString()}
                                  </span>
                                  <button type="button"
                                    onClick={() => { setPaymentOrderId(o.id); setPaymentInput(String((o as any).payment_amount ?? o.total)); }}
                                    className="font-body text-[11px] text-primary underline hover:opacity-80">
                                    Edit
                                  </button>
                                  <button type="button" onClick={() => clearPayment(o.id)}
                                    className="font-body text-[11px] text-muted-foreground underline hover:text-destructive">
                                    Clear
                                  </button>
                                </div>
                              ) : paymentOrderId === o.id ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-body text-xs text-muted-foreground">Amount received (₹):</span>
                                  <input
                                    type="number"
                                    value={paymentInput}
                                    onChange={e => setPaymentInput(e.target.value)}
                                    placeholder={String(o.total)}
                                    className="w-24 px-2 py-1 border border-border rounded-lg font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    autoFocus
                                  />
                                  <button type="button"
                                    onClick={() => savePayment(o.id, Number(paymentInput) || Number(o.total))}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg font-body text-xs hover:opacity-90">
                                    Save
                                  </button>
                                  <button type="button" onClick={() => setPaymentOrderId(null)}
                                    className="font-body text-xs text-muted-foreground underline">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button type="button"
                                  onClick={() => { setPaymentOrderId(o.id); setPaymentInput(String(o.total)); }}
                                  className="font-body text-xs text-amber-600 font-medium hover:underline">
                                  ⚠ Payment not recorded — Mark received
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
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
                          {/* Admin remark + cost price */}
                          <div className="mt-2 pt-2 border-t border-border/30" onClick={e => e.stopPropagation()}>
                            {remarkEditId === o.id ? (
                              <div className="space-y-2">
                                <textarea
                                  placeholder="Admin remark (internal note)..."
                                  value={remarkInput}
                                  onChange={e => setRemarkInput(e.target.value)}
                                  rows={2}
                                  className="w-full px-2 py-1.5 border border-border rounded-lg font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none bg-background"
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-body text-xs text-muted-foreground">Cost price (₹):</span>
                                  <input
                                    type="number"
                                    value={costInput}
                                    onChange={e => setCostInput(e.target.value)}
                                    placeholder="0"
                                    className="w-24 px-2 py-1 border border-border rounded-lg font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                                  />
                                  {costInput && Number(o.total) > 0 && (
                                    <span className={`font-body text-xs font-semibold ${
                                      ((Number(o.total) - parseFloat(costInput)) / Number(o.total) * 100) >= 40
                                        ? "text-green-600" : "text-amber-600"
                                    }`}>
                                      Margin: {(((Number(o.total) - parseFloat(costInput)) / Number(o.total)) * 100).toFixed(1)}%
                                    </span>
                                  )}
                                  <button type="button" onClick={() => saveOrderAdminData(o.id)}
                                    className="px-3 py-1 bg-primary text-primary-foreground rounded-lg font-body text-xs hover:opacity-90">Save</button>
                                  <button type="button" onClick={() => setRemarkEditId(null)}
                                    className="font-body text-xs text-muted-foreground underline">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  {(o as any).admin_remark && (
                                    <p className="font-body text-xs text-muted-foreground">🗒 {(o as any).admin_remark}</p>
                                  )}
                                  {(o as any).cost_price != null && (
                                    <p className="font-body text-xs text-muted-foreground">
                                      CP: ₹{Number((o as any).cost_price).toLocaleString()} · SP: ₹{Number(o.total).toLocaleString()} ·{" "}
                                      <span className={`font-semibold ${
                                        ((Number(o.total) - Number((o as any).cost_price)) / Number(o.total) * 100) >= 40
                                          ? "text-green-600" : "text-amber-600"
                                      }`}>
                                        {(((Number(o.total) - Number((o as any).cost_price)) / Number(o.total)) * 100).toFixed(1)}% margin
                                      </span>
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRemarkEditId(o.id);
                                    setRemarkInput((o as any).admin_remark || "");
                                    setCostInput((o as any).cost_price != null ? String((o as any).cost_price) : "");
                                  }}
                                  className="font-body text-[11px] text-primary hover:underline shrink-0"
                                >
                                  {(o as any).admin_remark || (o as any).cost_price != null ? "Edit" : "+ Remark / CP"}
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── ORDER DETAIL MODAL ── */}
        <AnimatePresence>
          {selectedOrder && (() => {
            const o = selectedOrder;
            const profile = profiles.find(p => p.user_id === o.user_id);
            const customerName = o.guest_name || profile?.full_name || "Guest";
            const customerEmail = o.guest_email || profile?.email || "—";
            const customerPhone = o.guest_phone || profile?.phone || "—";
            const items = orderItems[o.id] || [];
            const isOffline = (o.notes || "").includes("[Offline Order]");
            const getNoteField = (key: string) => (o.notes || "").match(new RegExp(`${key}: (.+)`))?.[1]?.trim() || "";
            const cleanNotes = (o.notes || "")
              .replace(/\[Offline Order\]\n?/, "")
              .replace(/\[Reference Image\]\s*https?:\/\/\S+/g, "")
              .replace(/Occasion:.+\n?/g, "").replace(/Product Type:.+\n?/g, "")
              .replace(/Flavor:.+\n?/g, "").replace(/Size\/Qty:.+\n?/g, "")
              .replace(/Pincode:.+\n?/g, "").replace(/Cake Message:.+\n?/g, "")
              .replace(/Special Request:.+\n?/g, "").replace(/Food Allergy:.+\n?/g, "")
              .trim();
            const refImageUrl = (o.notes || "").match(/\[Reference Image\]\s*(https?:\/\/\S+)/)?.[1] || "";
            const rows: [string, string][] = [
              ["Order ID", `#${o.id.slice(0, 8).toUpperCase()} (${o.id})`],
              ["Status", o.status],
              ["Customer", customerName],
              ["Email", customerEmail],
              ["Phone", customerPhone],
              ...(((o as any).size_preference ? [["Size Preference", (o as any).size_preference]] : []) as [string,string][]),
              ...(isOffline ? [
                ...(getNoteField("Occasion") ? [["Occasion", getNoteField("Occasion")]] : []),
                ...(getNoteField("Product Type") ? [["Product Type", getNoteField("Product Type")]] : []),
                ...(getNoteField("Flavor") ? [["Flavor", getNoteField("Flavor")]] : []),
                ...(getNoteField("Size/Qty") ? [["Size / Qty", getNoteField("Size/Qty")]] : []),
                ...(getNoteField("Cake Message") ? [["Cake Message", getNoteField("Cake Message")]] : []),
                ...(getNoteField("Special Request") ? [["Special Request", getNoteField("Special Request")]] : []),
                ...(getNoteField("Food Allergy") ? [["Food Allergy", getNoteField("Food Allergy")]] : []),
              ] as [string,string][] : []),
              ...(o.delivery_date ? [["Delivery Date", o.delivery_date]] as [string,string][] : []),
              ...(o.delivery_address ? [["Delivery Address", o.delivery_address]] as [string,string][] : []),
              ...(cleanNotes ? [["Notes", cleanNotes]] as [string,string][] : []),
              ["Ordered On", new Date(o.created_at).toLocaleString()],
              ...(o.updated_at !== o.created_at ? [["Last Updated", new Date(o.updated_at).toLocaleString()]] as [string,string][] : []),
              ["Payment", (o as any).payment_received
                ? `Received — ₹${Number((o as any).payment_amount ?? o.total).toLocaleString()}`
                : "Not yet recorded"],
            ];
            return (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
                  onClick={() => { setSelectedOrder(null); setRemarkEditId(null); }} />
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="bg-background rounded-2xl shadow-hover w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-heading text-lg font-semibold">{orderEditForm ? "Edit Order" : "Order Details"}</h2>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-body font-medium ${STATUS_COLORS[o.status] || "bg-secondary text-foreground"}`}>{o.status}</span>
                        {isOffline && <span className="text-[11px] px-2 py-0.5 rounded-full font-body font-medium bg-slate-100 text-slate-600">Offline</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!orderEditForm && (
                          <button type="button" onClick={() => startEditOrder(o)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg font-body text-sm transition-colors">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                        <button type="button" onClick={() => { setSelectedOrder(null); setRemarkEditId(null); setOrderEditForm(null); }} className="p-2 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* ── EDIT FORM ── */}
                    {orderEditForm ? (
                      <div className="p-5 space-y-4">
                        <p className="font-body text-xs text-muted-foreground">Edit order details below. Changes are saved immediately when you click Save.</p>

                        {/* Customer info */}
                        <div>
                          <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Customer</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Customer Name" value={orderEditForm.guest_name}
                              onChange={e => setOrderEditForm({ ...orderEditForm, guest_name: e.target.value })}
                              className="px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            <input placeholder="Email" value={orderEditForm.guest_email}
                              onChange={e => setOrderEditForm({ ...orderEditForm, guest_email: e.target.value })}
                              className="px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            <input placeholder="Phone" value={orderEditForm.guest_phone}
                              onChange={e => setOrderEditForm({ ...orderEditForm, guest_phone: e.target.value })}
                              className="px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            <input placeholder="Size Preference" value={orderEditForm.size_preference}
                              onChange={e => setOrderEditForm({ ...orderEditForm, size_preference: e.target.value })}
                              className="px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                        </div>

                        {/* Delivery */}
                        <div>
                          <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Delivery</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="date" value={orderEditForm.delivery_date}
                              onChange={e => setOrderEditForm({ ...orderEditForm, delivery_date: e.target.value })}
                              className="px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            <input placeholder="Delivery Address" value={orderEditForm.delivery_address}
                              onChange={e => setOrderEditForm({ ...orderEditForm, delivery_address: e.target.value })}
                              className="px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                        </div>

                        {/* Offline order fields */}
                        {isOffline && (
                          <div>
                            <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Order Details</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { key: "occasion", label: "Occasion" },
                                { key: "product_type", label: "Product Type" },
                                { key: "flavor", label: "Flavor" },
                                { key: "size_qty", label: "Size / Qty" },
                                { key: "cake_message", label: "Cake Message" },
                                { key: "special_request", label: "Special Request" },
                                { key: "food_allergy", label: "Food Allergy" },
                              ].map(f => (
                                <input key={f.key} placeholder={f.label} value={(orderEditForm as any)[f.key] || ""}
                                  onChange={e => setOrderEditForm({ ...orderEditForm, [f.key]: e.target.value })}
                                  className="px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        <div>
                          <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Items & Pricing</p>
                          <div className="space-y-2">
                            {orderEditItems.map((item, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input placeholder="Product name" value={item.product_name}
                                  onChange={e => setOrderEditItems(prev => prev.map((x, i) => i === idx ? { ...x, product_name: e.target.value } : x))}
                                  className="flex-1 px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <input type="number" placeholder="Qty" value={item.quantity}
                                  onChange={e => setOrderEditItems(prev => prev.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))}
                                  className="w-16 px-2 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <input type="number" placeholder="₹ Price" value={item.unit_price}
                                  onChange={e => setOrderEditItems(prev => prev.map((x, i) => i === idx ? { ...x, unit_price: e.target.value } : x))}
                                  className="w-24 px-2 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <button type="button" onClick={() => setOrderEditItems(prev => prev.filter((_, i) => i !== idx))}
                                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button type="button"
                              onClick={() => setOrderEditItems(prev => [...prev, { id: "", product_name: "", quantity: 1, unit_price: 0 }])}
                              className="flex items-center gap-1.5 text-xs font-body text-primary hover:underline mt-1">
                              <Plus className="w-3 h-3" /> Add item
                            </button>
                          </div>
                          {orderEditItems.length > 0 && (
                            <p className="font-body text-sm font-semibold text-foreground mt-2 text-right">
                              New Total: ₹{orderEditItems.reduce((s, i) => s + Number(i.unit_price) * (Number(i.quantity) || 1), 0).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Extra notes */}
                        <div>
                          <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Notes</p>
                          <textarea placeholder="Extra notes..." value={orderEditForm.extra_notes}
                            onChange={e => setOrderEditForm({ ...orderEditForm, extra_notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1 border-t border-border/50">
                          <button type="button" onClick={saveOrderEdit}
                            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-body text-sm font-semibold hover:opacity-90 transition-opacity">
                            Save Changes
                          </button>
                          <button type="button" onClick={() => setOrderEditForm(null)}
                            className="px-5 py-2.5 border border-border rounded-xl font-body text-sm hover:bg-secondary transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (

                    <div className="p-5 space-y-4">
                      {/* Items */}
                      {items.length > 0 && (
                        <div>
                          <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Items Ordered</p>
                          <div className="space-y-1.5 bg-secondary/30 rounded-xl p-3">
                            {items.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center font-body text-sm">
                                <span className="text-foreground">{item.product_name}</span>
                                <span className="text-muted-foreground text-xs">×{item.quantity} @ ₹{Number(item.unit_price).toLocaleString()} = <strong className="text-foreground">₹{(item.quantity * Number(item.unit_price)).toLocaleString()}</strong></span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center font-body text-sm pt-1.5 mt-1.5 border-t border-border/50">
                              <span className="font-semibold text-foreground">Total</span>
                              <span className="font-bold text-foreground">₹{Number(o.total).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Details grid */}
                      <div>
                        <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Order Information</p>
                        <div className="space-y-2">
                          {rows.map(([label, value]) => (
                            <div key={label} className="flex gap-3">
                              <span className="font-body text-xs text-muted-foreground w-32 shrink-0 pt-0.5">{label}</span>
                              <span className={`font-body text-sm text-foreground break-all ${label === "Payment" && !(o as any).payment_received ? "text-amber-600" : label === "Payment" ? "text-green-600" : ""}`}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Reference image */}
                      {refImageUrl && (
                        <div>
                          <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Reference Image</p>
                          <img src={refImageUrl} alt="Reference" className="rounded-xl w-full max-h-64 object-cover border border-border" />
                        </div>
                      )}

                      {/* ── Admin Notes & Cost Price ── */}
                      <div className="bg-secondary/30 rounded-xl p-4 border border-border/40 space-y-3">
                        <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wide">Admin Notes & Pricing</p>

                        {/* Remark */}
                        <div>
                          <label className="font-body text-xs text-muted-foreground mb-1 block">Remark / Internal Note</label>
                          <textarea
                            placeholder="Add an internal note about this order..."
                            value={remarkEditId === o.id ? remarkInput : ((o as any).admin_remark || "")}
                            onChange={e => {
                              if (remarkEditId !== o.id) {
                                setRemarkEditId(o.id);
                                setRemarkInput(e.target.value);
                                setCostInput((o as any).cost_price != null ? String((o as any).cost_price) : "");
                              } else {
                                setRemarkInput(e.target.value);
                              }
                            }}
                            rows={2}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          />
                        </div>

                        {/* Cost price */}
                        <div className="flex items-end gap-3 flex-wrap">
                          <div className="flex-1 min-w-32">
                            <label className="font-body text-xs text-muted-foreground mb-1 block">Cost Price / CP (₹)</label>
                            <input
                              type="number"
                              placeholder="Making cost for this order"
                              value={remarkEditId === o.id ? costInput : ((o as any).cost_price != null ? String((o as any).cost_price) : "")}
                              onChange={e => {
                                if (remarkEditId !== o.id) {
                                  setRemarkEditId(o.id);
                                  setRemarkInput((o as any).admin_remark || "");
                                  setCostInput(e.target.value);
                                } else {
                                  setCostInput(e.target.value);
                                }
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          {/* Live margin preview */}
                          {(remarkEditId === o.id ? costInput : (o as any).cost_price != null ? String((o as any).cost_price) : "") && Number(o.total) > 0 && (() => {
                            const cp = parseFloat(remarkEditId === o.id ? costInput : String((o as any).cost_price));
                            const margin = ((Number(o.total) - cp) / Number(o.total)) * 100;
                            return (
                              <div className="pb-1.5">
                                <p className="font-body text-[10px] text-muted-foreground">SP ₹{Number(o.total).toLocaleString()} · Margin</p>
                                <p className={`font-heading text-lg font-bold ${margin >= 70 ? "text-purple-600" : margin >= 50 ? "text-green-600" : margin >= 30 ? "text-amber-600" : "text-red-500"}`}>
                                  {margin.toFixed(1)}%
                                  <span className="font-body text-xs ml-1">{margin >= 70 ? "🔥" : margin >= 50 ? "🟢" : margin >= 30 ? "🟡" : "🔴"}</span>
                                </p>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Save button — only shown when editing */}
                        {remarkEditId === o.id && (
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => saveOrderAdminData(o.id)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90">
                              Save
                            </button>
                            <button type="button" onClick={() => setRemarkEditId(null)}
                              className="px-4 py-2 border border-border rounded-lg font-body text-sm hover:bg-secondary">
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    )} {/* end view/edit ternary */}
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* ── CUSTOM ORDERS TAB ── */}
        {!dataLoading && tab === "custom" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Search + Filter + Sort + Export */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search by name, email or phone..."
                  value={customOrderSearch} onChange={e => setCustomOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <select value={customOrderFilter} onChange={e => setCustomOrderFilter(e.target.value)}
                className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none">
                <option value="all">All Status</option>
                {["pending", "reviewed", "quoted", "accepted", "rejected"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={customOrderSort} onChange={e => setCustomOrderSort(e.target.value as any)}
                className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl font-body text-sm focus:outline-none">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <button type="button" onClick={() => {
                const escapeCSV = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
                const cols = ["ID", "Name", "Email", "Phone", "Occasion", "Product Type", "Flavor", "Size/Quantity", "Budget", "Delivery Date", "Status", "Message", "Address", "Submitted On", "Last Updated"];
                const rows = [cols.map(escapeCSV).join(",")];
                customOrders.forEach(co => {
                  rows.push([
                    co.id, co.name || "", co.email || "", co.phone || "",
                    co.occasion || "", co.product_type || "", co.flavor || "",
                    co.size_quantity || "", (co as any).budget || "",
                    co.delivery_date || "", co.status, co.message || "",
                    (co as any).address || "",
                    new Date(co.created_at).toLocaleString(),
                    new Date(co.updated_at).toLocaleString(),
                  ].map(escapeCSV).join(","));
                });
                const csv = rows.join("\n");
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "custom-orders.csv"; a.click();
              }} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-body text-sm hover:bg-secondary">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {(() => {
              const q = customOrderSearch.toLowerCase();
              const filtered = customOrders
                .filter(co => customOrderFilter === "all" || co.status === customOrderFilter)
                .filter(co => !q || (co.name || "").toLowerCase().includes(q) || (co.email || "").toLowerCase().includes(q) || (co.phone || "").includes(q))
                .sort((a, b) => customOrderSort === "oldest"
                  ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              return filtered.length === 0 ? (
                <p className="text-center py-12 font-body text-sm text-muted-foreground">No custom order requests</p>
              ) : filtered.map(co => (
              <div key={co.id} className="bg-card rounded-xl p-5 border border-border/50">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">{co.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{co.email} • {co.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select value={co.status} onChange={e => updateCustomOrderStatus(co, e.target.value)}
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
            ));
          })()}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-body text-sm text-muted-foreground">{feedbacks.length} feedback submissions</p>
                <p className="font-body text-xs text-muted-foreground/70 mt-0.5">Pin up to 4 reviews to homepage slots 1–4</p>
              </div>
              <button type="button" onClick={exportFeedbackCSV}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-body text-sm hover:bg-secondary">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {/* Homepage slot preview */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(slot => {
                const pinned = feedbacks.find((fb: any) => fb.display_position === slot);
                return (
                  <div key={slot} className={`rounded-xl p-3 border text-center ${pinned ? "bg-primary/5 border-primary/30" : "bg-secondary/20 border-border/50"}`}>
                    <p className="font-body text-[10px] text-muted-foreground mb-1">Slot {slot}</p>
                    <p className="font-body text-xs font-medium text-foreground truncate">{pinned ? pinned.name : "— dummy —"}</p>
                  </div>
                );
              })}
            </div>

            {feedbacks.length === 0 ? (
              <p className="text-center py-12 font-body text-sm text-muted-foreground">No feedback yet</p>
            ) : feedbacks.map((fb: any) => {
              const avg = (((fb.taste_rating || 0) + (fb.presentation_rating || 0) + (fb.service_rating || 0)) / 3).toFixed(1);
              return (
                <div key={fb.id} className="bg-card rounded-xl p-5 border border-border/50">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-foreground">{fb.name}</p>
                      <p className="font-body text-xs text-muted-foreground truncate">{fb.email}{fb.phone ? ` • ${fb.phone}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Position picker */}
                      <div className="flex items-center gap-1">
                        <span className="font-body text-[10px] text-muted-foreground">Slot:</span>
                        {[1, 2, 3, 4].map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setFeedbackPosition(fb.id, fb.display_position === slot ? null : slot)}
                            className={`w-6 h-6 rounded-full font-body text-[10px] font-bold transition-colors ${
                              fb.display_position === slot
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-primary/20"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      <span className="font-body text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</span>
                    </div>
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
                  <div className="flex items-center justify-between gap-2">
                    {fb.comment
                      ? <p className="font-body text-xs text-foreground flex-1">"{fb.comment}"</p>
                      : <span className="flex-1" />
                    }
                    <span className="font-body text-xs font-semibold text-primary shrink-0">avg {avg} ★</span>
                  </div>
                </div>
              );
            })}
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
              <button type="button" onClick={exportUsersCSV}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-body text-sm hover:bg-secondary">
                <Download className="w-4 h-4" /> Export CSV
              </button>
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
                    (p.phone || "").includes(q) ||
                    (p.email || "").toLowerCase().includes(q);
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
                          {p.email || "—"}
                        </p>
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
                        <button type="button" onClick={() => deleteUser(p.user_id, p.full_name || p.user_id)}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors" title="Delete user permanently">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                <h3 className="font-heading text-base font-semibold mb-1">Top Selling Products</h3>
                <p className="font-body text-[10px] text-muted-foreground mb-4">SP = selling price · CP = cost price set on product</p>
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                      <span className="font-body text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <span className="font-body text-sm text-foreground flex-1 truncate">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <span className="font-body text-xs text-muted-foreground">{p.sold} sold</span>
                        {p.revenue > 0 && <span className="font-body text-xs font-semibold text-green-600">₹{p.revenue.toLocaleString()}</span>}
                        {p.cp != null ? (
                          <>
                            <span className="font-body text-[10px] text-muted-foreground">SP ₹{p.sp} / CP ₹{p.cp}</span>
                            <span className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              p.margin! >= 70 ? "bg-purple-100 text-purple-700"
                              : p.margin! >= 50 ? "bg-green-100 text-green-700"
                              : p.margin! >= 30 ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                            }`}>
                              {p.margin! >= 70 ? "🔥" : p.margin! >= 50 ? "🟢" : p.margin! >= 30 ? "🟡" : "🔴"} {p.margin!.toFixed(0)}%
                            </span>
                          </>
                        ) : (
                          <span className="font-body text-[10px] text-muted-foreground/50">no CP set</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-4">No sales data yet</p>}
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
                  {overallMargin != null && overallMargin >= 70 && (
                    <div className="flex gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <span className="text-sm">🔥</span>
                      <p className="font-body text-xs text-purple-700">Profit margin is {overallMargin.toFixed(1)}% — Premium! Excellent pricing. You have room to reinvest in quality or run offers without hurting profitability.</p>
                    </div>
                  )}
                  {overallMargin != null && overallMargin >= 50 && overallMargin < 70 && (
                    <div className="flex gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-green-500 text-sm">🟢</span>
                      <p className="font-body text-xs text-green-700">Profit margin is {overallMargin.toFixed(1)}% — Good. Solid for a bakery in Hyderabad. Keep your CP accurate (include packaging, gas, labor) to stay on track.</p>
                    </div>
                  )}
                  {overallMargin != null && overallMargin >= 30 && overallMargin < 50 && (
                    <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-sm">🟡</span>
                      <p className="font-body text-xs text-amber-700">Profit margin is {overallMargin.toFixed(1)}% — Average. Acceptable but aim for 50%+. Try increasing SP by ₹50–100 on popular products or reduce packaging cost.</p>
                    </div>
                  )}
                  {overallMargin != null && overallMargin < 30 && (
                    <div className="flex gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-sm">🔴</span>
                      <p className="font-body text-xs text-red-700">Profit margin is {overallMargin.toFixed(1)}% — Low. For a Hyderabad home bakery, a healthy margin is 50–70%. Your selling price should be 2x–3x your total cost (ingredients + packaging + labor).</p>
                    </div>
                  )}
                  {topProducts.some(p => p.cp != null && p.margin! < 30) && (
                    <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-amber-500 text-sm">⚠</span>
                      <p className="font-body text-xs text-amber-700">
                        Low margin products: <strong>{topProducts.filter(p => p.cp != null && p.margin! < 30).map(p => p.name).join(", ")}</strong> — margin below 30% (Low zone). Consider repricing to at least 2x CP.
                      </p>
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

        {/* ── Profitability Tab ── */}
        {!dataLoading && tab === "profitability" && (
          <motion.div key="profitability" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* No CP recorded anywhere — soft prompt */}
            {!profitAnyCp && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-body text-sm font-semibold text-amber-800">Add CP to orders to unlock full profitability</p>
                  <p className="font-body text-xs text-amber-700 mt-0.5">
                    Open any order → enter its Cost Price. Revenue (SP) is already shown below from order items.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl p-5 border border-border/50">
              {/* Header + Period filter */}
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <h3 className="font-heading text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Profitability overview
                </h3>
                <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
                  {(["Week", "Month", "Quarter", "Year"] as const).map(p => (
                    <button key={p}
                      onClick={() => { setProfitTabPeriod(p.toLowerCase() as any); setProfitTabDrilldown(null); }}
                      className={`font-body text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        profitTabPeriod === p.toLowerCase()
                          ? "bg-background shadow-sm text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>{p}
                    </button>
                  ))}
                </div>
              </div>

              {profitTabDrilldown ? (
                /* ── DRILL DOWN VIEW ── */
                <>
                  <div className="flex items-center gap-3 mb-5 flex-wrap">
                    <button onClick={() => setProfitTabDrilldown(null)}
                      className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground border border-border/50 rounded-lg px-3 py-1.5 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> All categories
                    </button>
                    <span className="font-body text-sm font-semibold text-foreground">{profitTabDrilldown}</span>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {[
                      { label: "Low <30%", cls: "bg-red-50 border-red-200 text-red-600" },
                      { label: "Healthy 30–50%", cls: "bg-amber-50 border-amber-200 text-amber-600" },
                      { label: "Good 50–70%", cls: "bg-green-50 border-green-200 text-green-600" },
                      { label: "Very high >70%", cls: "bg-blue-50 border-blue-200 text-blue-600" },
                    ].map(t => (
                      <span key={t.label} className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-body font-medium ${t.cls}`}>{t.label}</span>
                    ))}
                  </div>

                  {/* Delivered orders for this category */}
                  <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Delivered orders in this category</p>
                  <p className="font-body text-[11px] text-muted-foreground mb-3">CP is set per-order — open any order to enter its cost price.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full font-body text-xs min-w-[580px]">
                      <thead>
                        <tr className="border-b border-border/50">
                          {["Product / Order", "Qty / Size", "Revenue (SP)", "Cost (CP)", "Profit", "Margin %", "Status"].map(h => (
                            <th key={h} className={`py-2.5 text-muted-foreground font-medium ${h === "Product / Order" ? "text-left pr-3" : "text-right px-2"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {profitTabDrillRows.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-xs">No orders found for this category in the selected period</td></tr>
                        ) : profitTabDrillRows.map(r => {
                          const tc = r.margin != null
                            ? r.margin >= 70 ? "bg-blue-100 text-blue-700" : r.margin >= 50 ? "bg-green-100 text-green-700"
                            : r.margin >= 30 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            : "";
                          return (
                            <tr key={r.orderId} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                              <td className="py-2.5 pr-3 font-medium text-foreground">
                                <div>{r.name}</div>
                                <div className="text-[10px] font-normal text-muted-foreground mt-0.5">{r.customer} · #{r.orderId.slice(0, 8).toUpperCase()}</div>
                              </td>
                              <td className="text-right px-2 text-foreground">{r.qtyLabel}</td>
                              <td className="text-right px-2 text-green-600 font-semibold">{r.totalSp > 0 ? `₹${formatLakh(r.totalSp)}` : "₹0"}</td>
                              <td className="text-right px-2 text-amber-600">
                                {r.cost != null ? `₹${formatLakh(r.cost)}` : <span className="text-[10px] text-amber-500 font-medium">no CP</span>}
                              </td>
                              <td className={`text-right px-2 font-semibold ${r.profit != null ? (r.profit >= 0 ? "text-green-600" : "text-red-500") : "text-muted-foreground"}`}>
                                {r.profit != null ? `₹${formatLakh(r.profit)}` : "—"}
                              </td>
                              <td className="text-right px-2">{r.margin != null ? `${r.margin.toFixed(1)}%` : "—"}</td>
                              <td className="text-right px-2">
                                {r.margin != null
                                  ? <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${tc}`}>{r.margin >= 70 ? "Very high" : r.margin >= 50 ? "Good" : r.margin >= 30 ? "Healthy" : "Low"}</span>
                                  : <span className="text-[10px] text-amber-500 font-medium">no CP</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* ── OVERVIEW ── */
                <>
                  {/* KPI tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                    {/* Total Orders tile */}
                    <div className="bg-secondary/20 rounded-xl p-4 border border-border/30">
                      <p className="font-body text-[10px] font-semibold text-muted-foreground tracking-wide mb-2">TOTAL ORDERS</p>
                      <p className="font-heading text-2xl font-bold text-foreground">{profitPeriodOrders.length}</p>
                      {profitPrevOrders.length > 0 && (() => {
                        const pct = ((profitPeriodOrders.length - profitPrevOrders.length) / profitPrevOrders.length) * 100;
                        return <p className={`font-body text-[10px] font-semibold mt-1 ${pct >= 0 ? "text-green-600" : "text-red-500"}`}>{pct >= 0 ? "+" : ""}{pct.toFixed(0)}% vs prev</p>;
                      })()}
                    </div>
                    {([
                      { label: "TOTAL REVENUE (SP)", val: profitTabStats.totalSp,  change: profitTabSpChg,     hide: false },
                      { label: "TOTAL COST (CP)",    val: profitTabStats.totalCp,  change: profitTabCpChg,     hide: !profitTabStats.hasCp },
                      { label: "TOTAL PROFIT",        val: profitTabStats.profit,   change: profitTabProfitChg, hide: !profitTabStats.hasCp, isProfit: true },
                      { label: "PROFIT MARGIN",       val: null as number | null,   change: null as number | null, hide: false, isMargin: true },
                    ]).map(kpi => (
                      <div key={kpi.label} className="bg-secondary/20 rounded-xl p-4 border border-border/30">
                        <p className="font-body text-[10px] font-semibold text-muted-foreground tracking-wide mb-2">{kpi.label}</p>
                        {(kpi as any).isMargin ? (
                          <>
                            <p className="font-heading text-2xl font-bold text-foreground">
                              {profitTabStats.margin != null ? `${profitTabStats.margin.toFixed(1)}%` : "—"}
                            </p>
                            {profitTabStats.margin != null && (
                              <p className={`font-body text-xs font-semibold mt-1 ${profitTabStats.margin >= 50 ? "text-green-600" : profitTabStats.margin >= 30 ? "text-amber-600" : "text-red-500"}`}>
                                {profitTabStats.margin >= 70 ? "Very High" : profitTabStats.margin >= 50 ? "Good" : profitTabStats.margin >= 30 ? "Healthy" : "Low"}
                              </p>
                            )}
                          </>
                        ) : kpi.hide ? (
                          <p className="font-body text-xs text-muted-foreground mt-1">Add CP to orders</p>
                        ) : (
                          <>
                            <p className={`font-heading text-2xl font-bold ${(kpi as any).isProfit && kpi.val! < 0 ? "text-red-500" : "text-foreground"}`}>
                              ₹{formatLakh(kpi.val!)}
                            </p>
                            {kpi.change != null && (
                              <p className={`font-body text-[10px] font-semibold mt-1 ${kpi.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {kpi.change >= 0 ? "+" : ""}{kpi.change.toFixed(0)}% vs prev
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Insight banner */}
                  {profitTabStats.margin != null && (() => {
                    const m = profitTabStats.margin;
                    const [bg, border, titleCls, bodyCls, title, body] = m >= 70
                      ? ["bg-blue-50","border-blue-100","text-blue-800","text-blue-700","Very high margin this period","Excellent pricing. You have room to reinvest in quality or run promotions."]
                      : m >= 50
                      ? ["bg-green-50","border-green-100","text-green-800","text-green-700","Good margin this period","Solid performance. Keep your cost prices accurate to stay on track."]
                      : m >= 30
                      ? ["bg-amber-50","border-amber-100","text-amber-800","text-amber-700","Healthy margin this period","Profitability is in a good range. Pricing looks stable."]
                      : ["bg-red-50","border-red-100","text-red-800","text-red-700","Low margin — consider repricing or reducing costs","Some orders have low margins. Review pricing or ingredient costs."];
                    return (
                      <div className={`rounded-xl p-3.5 mb-5 border ${bg} ${border}`}>
                        <p className={`font-body text-sm font-semibold ${titleCls}`}>{title}</p>
                        <p className={`font-body text-xs mt-0.5 ${bodyCls}`}>{body}</p>
                      </div>
                    );
                  })()}

                  {/* Legend */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {[
                      { label: "Low <30%", cls: "bg-red-50 border-red-200 text-red-600" },
                      { label: "Healthy 30–50%", cls: "bg-amber-50 border-amber-200 text-amber-600" },
                      { label: "Good 50–70%", cls: "bg-green-50 border-green-200 text-green-600" },
                      { label: "Very high >70%", cls: "bg-blue-50 border-blue-200 text-blue-600" },
                    ].map(t => (
                      <span key={t.label} className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-body font-medium ${t.cls}`}>{t.label}</span>
                    ))}
                  </div>

                  {/* Category table — ALL categories always shown */}
                  <p className="font-heading text-sm font-semibold text-foreground mb-3">Profitability by category</p>
                  <div className="overflow-x-auto">
                    <table className="w-full font-body text-xs min-w-[520px]">
                      <thead>
                        <tr className="border-b border-border/50">
                          {["Category", "Revenue (SP)", "Cost (CP)", "Profit", "Margin %", "Status", "Orders"].map(h => (
                            <th key={h} className={`py-2.5 text-muted-foreground font-medium ${h === "Category" ? "text-left pr-4" : "text-right px-3"}`}>{h}</th>
                          ))}
                          <th className="w-6" />
                        </tr>
                      </thead>
                      <tbody>
                        {profitTabCatStats.map(cat => {
                          const tc = cat.margin != null
                            ? cat.margin >= 70 ? "bg-blue-100 text-blue-700" : cat.margin >= 50 ? "bg-green-100 text-green-700"
                            : cat.margin >= 30 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            : "";
                          return (
                            <tr key={cat.id}
                              className="border-b border-border/30 last:border-0 hover:bg-secondary/20 cursor-pointer transition-colors"
                              onClick={() => setProfitTabDrilldown(cat.name)}>
                              <td className="py-3 pr-4 font-semibold text-foreground">{cat.name}</td>
                              <td className="text-right px-3 text-green-600 font-semibold">{cat.revenue > 0 ? `₹${formatLakh(cat.revenue)}` : "₹0"}</td>
                              <td className="text-right px-3 text-amber-600">{cat.hasCp ? `₹${formatLakh(cat.cost)}` : "—"}</td>
                              <td className={`text-right px-3 font-semibold ${cat.profit != null ? (cat.profit >= 0 ? "text-green-600" : "text-red-500") : "text-muted-foreground"}`}>
                                {cat.profit != null ? `₹${formatLakh(cat.profit)}` : "—"}
                              </td>
                              <td className="text-right px-3">{cat.margin != null ? `${cat.margin.toFixed(1)}%` : "—"}</td>
                              <td className="text-right px-3">
                                {cat.margin != null
                                  ? <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${tc}`}>{cat.margin >= 70 ? "Very high" : cat.margin >= 50 ? "Good" : cat.margin >= 30 ? "Healthy" : "Low"}</span>
                                  : <span className="text-[10px] text-amber-500 font-medium">no CP</span>}
                              </td>
                              <td className="text-right px-3 text-foreground">{cat.orderCount}</td>
                              <td className="pl-1 text-muted-foreground text-sm">›</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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

    {/* ── Add Offline / Walk-in Order Modal ── */}
    <AnimatePresence>
      {showAddOrder && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={resetOfflineOrderForm}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="relative bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-2xl my-6 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border/50">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">Add Offline / Walk-in Order</h3>
                <p className="font-body text-xs text-muted-foreground mt-0.5">Manually record orders placed in person or via phone.</p>
              </div>
              <button type="button" onClick={resetOfflineOrderForm} className="p-2 rounded-lg hover:bg-secondary -mt-1 -mr-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* ── Customer Details ── */}
              <div>
                <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Customer Details</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">First Name *</p>
                    <input placeholder="First name" value={offlineOrderForm.first_name}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, first_name: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Last Name</p>
                    <input placeholder="Last name" value={offlineOrderForm.last_name}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, last_name: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Email</p>
                    <input placeholder="customer@email.com" value={offlineOrderForm.guest_email}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, guest_email: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Phone</p>
                    <input placeholder="+91 98000 00000" value={offlineOrderForm.guest_phone}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, guest_phone: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* ── Order Info ── */}
              <div>
                <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Order Info</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Occasion</p>
                    <select value={offlineOrderForm.occasion}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, occasion: e.target.value }))}
                      className={inputCls}>
                      <option value="">Select occasion</option>
                      {["Birthday", "Anniversary", "Festive", "Wedding", "Baby Shower", "Corporate", "Celebration", "Other"].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Product Type</p>
                    <select value={offlineOrderForm.product_type}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, product_type: e.target.value }))}
                      className={inputCls}>
                      <option value="">Select type</option>
                      {["Cake", "Cupcake", "Brownie", "Cookie", "Cheesecake", "Chocolate", "Tub Dessert", "Custom"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Flavor Preference</p>
                    <input placeholder="e.g. Chocolate, Vanilla, Red Velvet" value={offlineOrderForm.flavor}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, flavor: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Size / Quantity</p>
                    <input placeholder="e.g. 1kg, 12 pieces" value={offlineOrderForm.size_quantity}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, size_quantity: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* ── Items & Pricing ── */}
              <div>
                <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Items & Pricing *</p>
                <div className="space-y-2">
                  {offlineOrderItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input placeholder="Item name (e.g. Chocolate Cake)" value={item.name}
                        onChange={e => setOfflineOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                        className={`${inputCls} flex-[3]`} />
                      <input placeholder="Qty" type="number" min="1" value={item.quantity}
                        onChange={e => setOfflineOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it))}
                        className="w-16 px-3 py-3 bg-secondary/50 border border-border rounded-xl font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 flex-none" />
                      <input placeholder="₹ Price" type="number" min="0" value={item.unit_price}
                        onChange={e => setOfflineOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, unit_price: e.target.value } : it))}
                        className={`${inputCls} flex-1`} />
                      {offlineOrderItems.length > 1 && (
                        <button type="button" onClick={() => setOfflineOrderItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <button type="button"
                      onClick={() => setOfflineOrderItems(prev => [...prev, { name: "", quantity: "1", unit_price: "" }])}
                      className="flex items-center gap-1.5 font-body text-xs text-primary hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Add another item
                    </button>
                    {offlineOrderItems.some(i => i.unit_price) && (
                      <p className="font-body text-sm font-semibold text-foreground">
                        Total: ₹{offlineOrderItems.reduce((s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 1), 0).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Delivery ── */}
              <div>
                <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Delivery</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <p className="font-body text-xs text-muted-foreground mb-1">Delivery Address</p>
                    <input placeholder="Full address" value={offlineOrderForm.delivery_address}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, delivery_address: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Pincode</p>
                    <input placeholder="500001" value={offlineOrderForm.pincode}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, pincode: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Delivery Date</p>
                    <input type="date" value={offlineOrderForm.delivery_date}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, delivery_date: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Status</p>
                    <select value={offlineOrderForm.status}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, status: e.target.value }))}
                      className={inputCls}>
                      {["pending", "confirmed", "preparing", "ready", "delivered"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Special Details ── */}
              <div>
                <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Special Details</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Message on Cake</p>
                    <input placeholder="e.g. Happy Birthday Sarah!" value={offlineOrderForm.cake_message}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, cake_message: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Special Request</p>
                    <textarea placeholder="Any special instructions, design preferences, etc." value={offlineOrderForm.special_request}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, special_request: e.target.value }))}
                      rows={2} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Food Allergies</p>
                    <input placeholder="e.g. Nut-free, Gluten-free, Dairy-free" value={offlineOrderForm.food_allergy}
                      onChange={e => setOfflineOrderForm(f => ({ ...f, food_allergy: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* ── Reference Image ── */}
              <div>
                <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Reference / Sample Image</p>
                <div
                  className="flex items-center gap-4 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors"
                  onClick={() => offlineOrderImageRef.current?.click()}
                >
                  {offlineOrderImagePreview ? (
                    <img src={offlineOrderImagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-body text-sm text-foreground font-medium">
                      {offlineOrderImageFile ? offlineOrderImageFile.name : "Upload reference image"}
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                    {offlineOrderImagePreview && (
                      <button type="button" onClick={e => { e.stopPropagation(); setOfflineOrderImageFile(null); setOfflineOrderImagePreview(null); }}
                        className="font-body text-xs text-destructive hover:underline mt-1">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={offlineOrderImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
                    setOfflineOrderImageFile(file);
                    setOfflineOrderImagePreview(URL.createObjectURL(file));
                  }}
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-secondary/20">
              <button type="button" onClick={resetOfflineOrderForm}
                className="px-5 py-2 bg-secondary text-foreground rounded-lg font-body text-sm hover:bg-secondary/80">
                Cancel
              </button>
              <button type="button" onClick={saveOfflineOrder} disabled={savingOfflineOrder}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
                <Check className="w-4 h-4" /> {savingOfflineOrder ? "Saving..." : "Save Order"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default Admin;
