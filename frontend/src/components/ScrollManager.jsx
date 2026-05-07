import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ScrollManager: A professional, industry-standard scroll restoration system.
 * This component ensures that the application behaves like a modern SPA by preserving 
 * and restoring scroll positions across different routes and navigation types.
 */
const ScrollManager = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const lastScrollPos = useRef({});

  // 1. Save scroll position on every scroll (debounced for performance)
  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const y = window.scrollY;
        lastScrollPos.current[key] = y;
        
        // Persist to sessionStorage for hard refreshes or back button precision
        sessionStorage.setItem(`scroll_pos_${pathname}_${key}`, y.toString());
        // General path fallback
        sessionStorage.setItem(`scroll_pos_${pathname}`, y.toString());
      }, 100); // 100ms debounce
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname, key]);

  // 2. Restore scroll position or handle new navigation
  useLayoutEffect(() => {
    // Disable browser's native scroll restoration to take full control
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // A: Handle Hash Navigation (#skills, #projects, etc.)
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Precise offset for fixed navigation headers
        const offset = 85; 
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
        return;
      }
    }

    // B: Handle Back/Forward Navigation (POP)
    if (navigationType === "POP") {
      const savedY = sessionStorage.getItem(`scroll_pos_${pathname}_${key}`) || 
                    sessionStorage.getItem(`scroll_pos_${pathname}`);
      
      if (savedY) {
        const targetY = parseInt(savedY, 10);
        
        // Multi-stage restoration to handle dynamically loaded content or slow images
        let attempts = 0;
        const maxAttempts = 25;
        
        const restoreScroll = () => {
          window.scrollTo(0, targetY);
          
          // If the page isn't long enough to reach targetY yet, keep trying
          if (Math.abs(window.scrollY - targetY) > 5 && attempts < maxAttempts) {
            attempts++;
            requestAnimationFrame(restoreScroll);
          }
        };

        // Execution chain: instant -> animation frame -> delayed fallbacks
        restoreScroll();
        setTimeout(restoreScroll, 50);
        setTimeout(restoreScroll, 200);
        setTimeout(restoreScroll, 500);
        return;
      }
    }

    // C: Default - New Navigation (PUSH/REPLACE)
    // Ensure all new pages start at the very top instantly
    window.scrollTo({ top: 0, behavior: "instant" });
    
  }, [pathname, hash, key, navigationType]);

  return null;
};

export default ScrollManager;
