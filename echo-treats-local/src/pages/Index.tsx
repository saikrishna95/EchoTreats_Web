import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import SlideMenu from "@/components/SlideMenu";
import HeroSection from "@/components/HeroSection";
import ProductSection from "@/components/ProductSection";
import OccasionSection from "@/components/OccasionSection";
import WhatsNewSection from "@/components/WhatsNewSection";
import CustomOrderSection from "@/components/CustomOrderSection";
import ReviewsSection from "@/components/ReviewsSection";
import InstagramSection from "@/components/InstagramSection";
import StorySection from "@/components/StorySection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

import { useProducts } from "@/hooks/useProducts";
import { mapDbProduct } from "@/lib/productMapper";

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  const { getProductsByCategory, loading } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sectionId = location.state?.scrollToSection || location.hash.replace("#", "");
    if (!sectionId || loading) return;

    const el = document.getElementById(sectionId);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "auto", block: "start" });

        if (location.state?.scrollToSection) {
          navigate(location.pathname, { replace: true, state: null });
        }
      });
    }
  }, [loading, location, navigate]);

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

  const cakesRaw = getProductsByCategory("cakes");
  const cupcakesRaw = getProductsByCategory("cupcakes");
  const cookiesRaw = getProductsByCategory("cookies");
  const chocolatesRaw = getProductsByCategory("chocolates");
  const cheesecakesRaw = getProductsByCategory("cheesecakes");
  const tubsRaw = getProductsByCategory("tubs");
  const browniesRaw = getProductsByCategory("brownies");

  const cakes = cakesRaw.map(mapDbProduct);
  const cupcakes = cupcakesRaw.slice(0, 4).map(mapDbProduct);
  const cookies = cookiesRaw.map(mapDbProduct);
  const chocolates = chocolatesRaw.map(mapDbProduct);
  const cheesecakes = cheesecakesRaw.map(mapDbProduct);
  const tubs = tubsRaw.map(mapDbProduct);
  const brownies = browniesRaw.map(mapDbProduct);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
        <CustomOrderSection />
        <ReviewsSection />
        <InstagramSection />
        <StorySection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
