import { X, LogIn, LogOut, UserCircle, ShoppingBag, Heart, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const shopItems = [
  { label: "Shop All", href: "#products" },
  { label: "Cakes", href: "#cakes" },
  { label: "Brownies", href: "#brownies" },
  { label: "Chocolates", href: "#chocolates" },
  { label: "Cupcakes", href: "#cupcakes" },
  { label: "Tub Desserts", href: "#tubs" },
  { label: "Cheesecakes", href: "#cheesecakes" },
  { label: "Biscuits & Cookies", href: "#cookies" },
  { label: "Custom Orders", href: "#custom" },
  { label: "Contact Us", href: "#contact" },
  { label: "Our Story", href: "#story" },
];

const SlideMenu = ({ isOpen, onClose }: SlideMenuProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleClick = (href: string) => {
    onClose();
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleAuth = () => {
    onClose();
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background z-50 flex flex-col shadow-hover"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <img src={logo} alt="Echo Treats" className="h-10 w-auto object-contain" />
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {/* Account section */}
              {user && (
                <div className="px-4 mb-3">
                  <p className="px-2 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
                  <button
                    onClick={() => handleNav("/profile")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-body font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-muted-foreground" /> My Account
                  </button>
                  <button
                    onClick={() => handleNav("/profile")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-body font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-muted-foreground" /> Orders
                  </button>
                  <button
                    onClick={() => handleNav("/profile")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-body font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Heart className="w-4 h-4 text-muted-foreground" /> Wishlist
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleNav("/admin")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-body font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Shield className="w-4 h-4 text-muted-foreground" /> Admin
                    </button>
                  )}
                  <div className="border-b border-border mt-3" />
                </div>
              )}

              {/* Shop section */}
              <div className="px-4">
                <p className="px-2 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shop</p>
                {shopItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleClick(item.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-body font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-border">
              <button
                onClick={handleAuth}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-body font-medium text-sm hover:opacity-90 transition-opacity"
              >
                {user ? <><LogOut className="w-4 h-4" /> Sign Out</> : <><LogIn className="w-4 h-4" /> Login / Sign Up</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SlideMenu;
