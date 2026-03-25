import { useState, useEffect, useRef } from "react";
import { Menu, ShoppingBag, User, Heart, LogIn, LogOut, Shield, UserCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

interface NavbarProps {
  onMenuOpen: () => void;
  isHomePage?: boolean;
  heroVisible?: boolean;
}

const Navbar = ({ onMenuOpen, isHomePage = false, heroVisible = false }: NavbarProps) => {
  const { setIsOpen, itemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const [pastHero, setPastHero] = useState(!isHomePage);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHomePage) {
      setPastHero(true);
      return;
    }

    const onScroll = () => {
      const heroEl = document.getElementById("hero-section");
      if (heroEl) {
        const heroBottom = heroEl.getBoundingClientRect().bottom;
        setPastHero(heroBottom <= 72);
      } else {
        setPastHero(window.scrollY > 10);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const wishlistCount = wishlistItems.length;
  const topClass = isHomePage && heroVisible ? "top-6" : "top-0";

  return (
    <nav
      className={`fixed left-0 right-0 z-40 transition-all duration-500 ease-in-out ${topClass} ${
        pastHero
          ? "bg-background/92 backdrop-blur-lg border-b border-border/30 shadow-sm"
          : "bg-transparent border-transparent shadow-none"
      }`}
    >
      <div className="container flex items-center justify-between h-14">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open menu"
          className={`p-2 rounded-lg transition-colors ${pastHero ? "hover:bg-secondary" : "hover:bg-white/20"}`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              navigate("/");
            }
          }}
          aria-label="Go to homepage"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <img
            src={logo}
            alt="Echo Treats"
            className={`h-7 transition-all duration-500 ${
              pastHero ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            }`}
          />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Open wishlist"
            onClick={() =>
              navigate("/profile", {
                state: { activeTab: "wishlist", wishlistOnly: true },
              })
            }
            className={`p-2 relative rounded-lg transition-colors ${
              pastHero ? "hover:bg-secondary" : "hover:bg-white/20"
            }`}
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-rose text-white w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="Open cart"
            onClick={() => setIsOpen(true)}
            className={`p-2 relative rounded-lg transition-colors ${
              pastHero ? "hover:bg-secondary" : "hover:bg-white/20"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              aria-label="Open account menu"
              onClick={() => setProfileOpen((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors ${pastHero ? "hover:bg-secondary" : "hover:bg-white/20"}`}
            >
              <User className="w-5 h-5" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-md overflow-hidden z-50">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-secondary transition-colors"
                    >
                      <UserCircle className="inline w-4 mr-2" />
                      My Account
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/admin");
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-secondary transition-colors"
                      >
                        <Shield className="inline w-4 mr-2" />
                        Admin
                      </button>
                    )}

                    <div className="border-t border-border" />

                    <button
                      type="button"
                      onClick={async () => {
                        setProfileOpen(false);
                        await signOut();
                      }}
                      className="w-full px-4 py-2.5 text-left text-red-500 hover:bg-secondary transition-colors"
                    >
                      <LogOut className="inline w-4 mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/auth");
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-secondary transition-colors"
                  >
                    <LogIn className="inline w-4 mr-2" />
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
