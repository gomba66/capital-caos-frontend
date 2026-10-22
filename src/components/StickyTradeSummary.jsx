import { useContext, useEffect, useRef, useState } from "react";
import { SidebarContext } from "../contexts/AppContexts";

export default function StickyTradeSummary({
  anchorRef,
  expanded,
  label,
  onVisibilityChange,
  children,
}) {
  const { sidebarWidth } = useContext(SidebarContext);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const visibilityChangeRef = useRef(onVisibilityChange);
  visibilityChangeRef.current = onVisibilityChange;

  useEffect(() => {
    const publishVisibility = (nextVisible) => {
      if (visibleRef.current === nextVisible) return;
      visibleRef.current = nextVisible;
      setVisible(nextVisible);
      visibilityChangeRef.current?.(nextVisible);
    };
    const updateVisibility = () => {
      const anchor = anchorRef.current;
      const header = document.querySelector(".platform-header");
      if (!anchor || !header || expanded) {
        publishVisibility(false);
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const headerBottom = header.getBoundingClientRect().bottom;
      publishVisibility(anchorRect.height > 0 && anchorRect.bottom <= headerBottom);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      publishVisibility(false);
    };
  }, [anchorRef, expanded]);

  if (!visible || expanded) return null;

  return (
    <div
      className="trade-summary-subheader"
      style={{ "--trade-summary-left": `${sidebarWidth}px` }}
      aria-label={label}
      role="region"
    >
      <span className="trade-summary-subheader__content">
        {children}
      </span>
    </div>
  );
}
