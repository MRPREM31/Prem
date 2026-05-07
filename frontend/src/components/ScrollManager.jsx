import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollManager = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // 1. Save scroll position on every scroll
    const handleScroll = () => {
      // We only save if we are on a page (not in a modal, though this works for both)
      sessionStorage.setItem(`scroll_pos_${pathname}`, window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // 2. Restore scroll position
    const savedPosition = sessionStorage.getItem(`scroll_pos_${pathname}`);

    if (navigationType === "POP") {
      // If it's a BACK/FORWARD navigation, restore position
      if (savedPosition) {
        // Small timeout to ensure DOM is rendered (especially for dynamic content)
        const timeoutId = setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: "instant"
          });
        }, 10);
        return () => clearTimeout(timeoutId);
      }
    } else {
      // If it's a NEW navigation (PUSH/REPLACE), scroll to top
      window.scrollTo(0, 0);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, navigationType]);

  return null;
};

export default ScrollManager;
