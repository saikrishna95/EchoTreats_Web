import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Package, Heart, LogOut, ArrowLeft, Trash2, Pencil, Check, X } from "lucide-react";
import SignOutModal from "@/components/SignOutModal";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type ProfileType = Database["public"]["Tables"]["profiles"]["Row"];
type TabKey = "profile" | "orders" | "wishlist";

const Profile = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab = (location.state?.activeTab as TabKey) || "profile";
  const wishlistOnly = Boolean(location.state?.wishlistOnly);

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  const { wishlistItems, loading: wishlistLoading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const canCancel = (order: Order) => {
    const nonCancellableStatuses = ["cancelled", "delivered"];
    if (nonCancellableStatuses.includes(order.status)) return false;
    const hoursSince = (Date.now() - new Date(order.created_at).getTime()) / 36e5;
    return hoursSince <= 24;
  };

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    if (error) { toast.error("Failed to cancel order"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    toast.success("Order cancelled successfully");
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      const [profileRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setEditName(profileRes.data.full_name || "");
        setEditPhone(profileRes.data.phone || "");
      }
      if (ordersRes.data) {
        setOrders(ordersRes.data);
        if (ordersRes.data.length > 0) {
          const orderIds = ordersRes.data.map((o) => o.id);
          const { data: items } = await supabase
            .from("order_items")
            .select("order_id, product_name, quantity, unit_price")
            .in("order_id", orderIds);
          if (items) {
            const grouped: Record<string, any[]> = {};
            items.forEach((item) => {
              if (!grouped[item.order_id]) grouped[item.order_id] = [];
              grouped[item.order_id].push(item);
            });
            setOrderItems(grouped);
          }
        }
      }
    };

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab as TabKey);
    }
  }, [location.state]);

  const handleSignOut = () => setShowSignOut(true);

  const handleRemoveWishlist = async (productId: string, name: string) => {
    await toggleWishlist(productId);
    toast.success(`${name} removed from wishlist`);
  };

  const handleMoveToCart = async (productId: string, name: string) => {
    await addToCart(productId);
    await toggleWishlist(productId);
    toast.success(`${name} moved to cart`);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert(
      { user_id: user.id, full_name: editName.trim(), phone: editPhone.trim(), updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) {
      toast.error("Failed to save profile");
    } else {
      setProfile((prev) => prev ? { ...prev, full_name: editName.trim(), phone: editPhone.trim() } : prev);
      setEditing(false);
      toast.success("Profile updated");
    }
    setSaving(false);
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    delivered: "bg-green-200 text-green-900",
    cancelled: "bg-red-100 text-red-800",
  };

  const renderWishlist = () => {
    if (wishlistLoading) {
      return <div className="text-center py-12 font-body text-sm text-muted-foreground">Loading...</div>;
    }

    if (wishlistItems.length === 0) {
      return (
        <div className="text-center py-12 bg-card rounded-2xl shadow-card border border-border/50">
          <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-body text-sm text-muted-foreground">Your wishlist is empty</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm hover:opacity-90"
          >
            Browse Products
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {wishlistItems.map((item) => {
          const p = item.product;
          if (!p) return null;

          return (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50 shadow-card"
            >
              <img
                src={p.image_url || "/placeholder.svg"}
                alt={p.name}
                className="w-16 h-16 rounded-lg object-cover bg-secondary/30"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-sm font-semibold text-foreground truncate">{p.name}</h3>
                <p className="font-body text-xs text-muted-foreground truncate">{p.description}</p>
                <p className="font-body text-sm font-semibold text-foreground mt-1">
                  ₹{Number(p.price).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveToCart(p.id, p.name)}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-body text-xs hover:opacity-90"
                >
                  Move to Cart
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveWishlist(p.id, p.name)}
                  className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                  aria-label={`Remove ${p.name} from wishlist`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (wishlistOnly) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-3xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </button>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-2xl font-semibold text-foreground">My Wishlist</h1>
                <p className="font-body text-sm text-muted-foreground">
                  {wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {renderWishlist()}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </button>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">My Account</h1>
              <p className="font-body text-sm text-muted-foreground">{user?.email}</p>
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="px-4 py-2 bg-secondary text-foreground rounded-lg font-body text-sm hover:bg-secondary/80"
                >
                  Admin
                </button>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-body text-sm hover:bg-destructive/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="flex gap-1 mb-6 bg-secondary/50 rounded-xl p-1">
            {[
              { key: "profile" as const, label: "Profile", icon: User },
              { key: "orders" as const, label: "Orders", icon: Package },
              { key: "wishlist" as const, label: "Wishlist", icon: Heart },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-background shadow-card text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === "wishlist" && wishlistItems.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Profile Details</h2>
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => { setEditName(profile?.full_name || ""); setEditPhone(profile?.phone || ""); setEditing(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg font-body text-xs text-foreground hover:bg-secondary/80"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-body text-xs hover:opacity-90 disabled:opacity-60"
                    >
                      <Check className="w-3 h-3" /> {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg font-body text-xs hover:bg-secondary/80"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-4 font-body text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Name</p>
                  {editing ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Your name"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.full_name || "Not set"}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Email</p>
                  <p className="text-foreground">{user?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Phone</p>
                  {editing ? (
                    <input
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Your phone number"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.phone || "Not set"}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Member since</p>
                  <p className="text-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl shadow-card border border-border/50">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-body text-sm text-muted-foreground">No orders yet</p>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm hover:opacity-90"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                orders.map((order) => {
                  const items = orderItems[order.id] || [];
                  return (
                    <div key={order.id} className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-body text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusColor[order.status] || ""}`}>
                          {order.status}
                        </span>
                      </div>
                      {items.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {items.map((item, i) => (
                            <div key={i} className="flex justify-between font-body text-sm">
                              <span className="text-foreground font-medium">
                                {item.product_name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                              </span>
                              <span className="text-muted-foreground">₹{Number(item.unit_price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="font-body text-xs text-muted-foreground mb-2">
                        Ordered: {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <div className="flex justify-between font-body text-sm border-t border-border/40 pt-2">
                        <span className="text-foreground font-semibold">Total: ₹{Number(order.total).toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs">
                          Status updated: {new Date(order.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {order.status !== "cancelled" && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          {canCancel(order) ? (
                            <div className="flex items-center gap-3 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg font-body text-xs hover:bg-destructive/20 transition-colors"
                              >
                                <X className="w-3 h-3" /> Cancel Order
                              </button>
                              <p className="font-body text-[11px] text-muted-foreground">
                                Orders can only be cancelled within 24 hours of placing.
                              </p>
                            </div>
                          ) : (
                            <p className="font-body text-xs text-muted-foreground">
                              ⚠️ Cannot cancel — 24-hour window has passed.{" "}
                              <a href="tel:+919000000000" className="text-primary underline">Contact us</a> for help.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "wishlist" && renderWishlist()}
        </motion.div>
      </div>
    </div>

    <SignOutModal
      open={showSignOut}
      onCancel={() => setShowSignOut(false)}
      onConfirm={async () => { setShowSignOut(false); await signOut(); toast.success("Signed out successfully"); navigate("/"); }}
    />
    </>
  );
};

export default Profile;
