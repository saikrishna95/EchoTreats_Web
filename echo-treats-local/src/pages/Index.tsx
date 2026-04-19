import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import SlideMenu from "@/components/SlideMenu";
import HeroSection from "@/components/HeroSection";
import ProductSection from "@/components/ProductSection";
import OccasionSection from "@/components/OccasionSection";
import WhatsNewSection from "@/components/WhatsNewSection";
import GiftSection from "@/components/GiftSection";
import CustomOrderSection from "@/components/CustomOrderSection";
import ReviewsSection from "@/components/ReviewsSection";
import InstagramSection from "@/components/InstagramSection";
import StorySection from "@/components/StorySection";
import SustainabilitySection from "@/components/SustainabilitySection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

import { useProducts } from "@/hooks/useProducts";
import { mapDbProduct } from "@/lib/productMapper";
import { supabase } from "@/integrations/supabase/client";
import { getHomeSectionFromPathname, homeSectionIds, homeSectionPath } from "@/lib/homeSections";

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  const { getProductsByCategory, getFeaturedSlotsByCategory, loading } = useProducts();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }, []);

  // Track page visit
  useEffect(() => {
    supabase.from("site_visits" as any).insert({ visited_at: new Date().toISOString(), referrer: document.referrer || null, user_agent: navigator.userAgent }).then(() => {});
  }, []);
  const location = useLocation();
  const routeSectionId = getHomeSectionFromPathname(location.pathname);
  const releaseInitialPageHide = () => {
    document.documentElement.removeAttribute("data-initial-route-hide");
  };

  // Hide the page until an initial section route is restored.
  const needsRestore = useRef(Boolean(routeSectionId));
  const [pageVisible, setPageVisible] = useState(!needsRestore.current);
  const lastNavigatedSection = useRef<string | null>(routeSectionId);

  // Restore scroll position after products load — skip if there's a hash target
  useLayoutEffect(() => {
    if (loading) return;
    if (!needsRestore.current) {
      releaseInitialPageHide();
      setPageVisible(true);
      return;
    }

    if (routeSectionId) {
      document.getElementById(routeSectionId)?.scrollIntoView({ behavior: "instant", block: "start" });
    }

    lastNavigatedSection.current = routeSectionId;
    needsRestore.current = false;
    releaseInitialPageHide();
    setPageVisible(true);
  }, [loading, routeSectionId]);

  // Update the URL path as the user scrolls through homepage sections.
  useEffect(() => {
    if (loading) return;
    const onScroll = () => {
      let current = "";
      for (const id of homeSectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
      }
      const nextPath = homeSectionPath(current || null);
      if (window.location.pathname !== nextPath) {
        window.history.replaceState(null, "", nextPath);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading]);

  useLayoutEffect(() => {
    const sectionId = routeSectionId;
    if (!sectionId || loading || needsRestore.current || lastNavigatedSection.current === sectionId) return;

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
      lastNavigatedSection.current = sectionId;
    }
  }, [loading, routeSectionId]);

  useEffect(() => {
    if (!routeSectionId) {
      releaseInitialPageHide();
    }
  }, [routeSectionId]);

  useEffect(() => {
    const heroEl = document.getElementById("hero-section");
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  // rawProducts = full category list (used by modal click handler)
  // featured = up to 6 admin-selected (or first 6 by sort_order) for home display
  const cakesRaw = getProductsByCategory("cakes");
  const cupcakesRaw = getProductsByCategory("cupcakes");
  const cookiesRaw = getProductsByCategory("cookies");
  const chocolatesRaw = getProductsByCategory("chocolates");
  const cheesecakesRaw = getProductsByCategory("cheesecakes");
  const tubsRaw = getProductsByCategory("tubs");
  const browniesRaw = getProductsByCategory("brownies");

  const cakes = getFeaturedSlotsByCategory("cakes").map(mapDbProduct);
  const cupcakes = getFeaturedSlotsByCategory("cupcakes").map(mapDbProduct);
  const cookies = getFeaturedSlotsByCategory("cookies").map(mapDbProduct);
  const chocolates = getFeaturedSlotsByCategory("chocolates").map(mapDbProduct);
  const cheesecakes = getFeaturedSlotsByCategory("cheesecakes").map(mapDbProduct);
  const tubs = getFeaturedSlotsByCategory("tubs").map(mapDbProduct);
  const brownies = getFeaturedSlotsByCategory("brownies").map(mapDbProduct);

  return (
    <div
      className={`min-h-screen bg-background overflow-x-hidden transition-opacity duration-150 ${
        pageVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ visibility: pageVisible ? "visible" : "hidden" }}
    >
      <AnnouncementBar visible={heroVisible} />

      <Navbar onMenuOpen={() => setMenuOpen(true)} isHomePage heroVisible={heroVisible} />

      <SlideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <CartDrawer />

      <main>
        <HeroSection />

        {loading ? (
          <div className="py-20 text-center font-body text-muted-foreground">Loading products...</div>
        ) : (
          <>
            <div id="products">
              <ProductSection
                id="cakes"
                title="Cakes"
                subtitle="Handcrafted cakes for every celebration"
                products={cakes}
                rawProducts={cakesRaw}
                categorySlug="cakes"
              />

              <ProductSection
                id="brownies"
                title="Brownies"
                subtitle="Rich, fudgy brownies baked to perfection"
                products={brownies}
                rawProducts={browniesRaw}
                categorySlug="brownies"
                accent
              />

              <ProductSection
                id="chocolates"
                title="Chocolates"
                subtitle="Handcrafted luxury chocolate collections"
                products={chocolates}
                rawProducts={chocolatesRaw}
                categorySlug="chocolates"
              />

              <ProductSection
                id="cupcakes"
                title="Cupcakes"
                subtitle="Beautifully decorated cupcakes for every occasion"
                products={cupcakes}
                rawProducts={cupcakesRaw}
                categorySlug="cupcakes"
                accent
              />
            </div>

            <ProductSection
              id="tubs"
              title="Tub Desserts"
              subtitle="Layered indulgence in every jar"
              products={tubs}
              rawProducts={tubsRaw}
              categorySlug="tubs"
              accent
            />

            <ProductSection
              id="cheesecakes"
              title="Cheesecakes"
              subtitle="Creamy, dreamy, irresistible"
              products={cheesecakes}
              rawProducts={cheesecakesRaw}
              categorySlug="cheesecakes"
            />

            <ProductSection
              id="cookies"
              title="Biscuits & Cookies"
              subtitle="Artisan cookies baked with love"
              products={cookies}
              rawProducts={cookiesRaw}
              categorySlug="cookies"
              accent
            />
          </>
        )}

        <WhatsNewSection />
        <OccasionSection />
        <GiftSection />
        <CustomOrderSection />
        <ReviewsSection />
        <InstagramSection />
        <StorySection />
        <SustainabilitySection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
