import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isHomeSectionPathname } from "@/lib/homeSections";

const scrollKey = (path: string) => `scrollPos:${path}`;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const mounted = useRef(false);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // Save scroll position before browser refresh/close
  useEffect(() => {
    const save = () => sessionStorage.setItem(scrollKey(pathname), String(window.scrollY));
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, [pathname]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previousPathname.current = pathname;
      return;
    }

    const cameFromHomeSection = isHomeSectionPathname(previousPathname.current);
    const goingToHomeSection = isHomeSectionPathname(pathname);
    previousPathname.current = pathname;

    if (cameFromHomeSection && goingToHomeSection) {
      return;
    }

    // SPA navigation: clear any saved position for this route and scroll to top
    sessionStorage.removeItem(scrollKey(pathname));
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
