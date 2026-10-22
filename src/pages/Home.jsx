import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import ScannerDashboard from "./Scanner";

export default function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash !== "#scanner") return undefined;

    const scrollToScanner = () => {
      const scanner = document.getElementById("scanner");
      if (!scanner) return false;
      scanner.scrollIntoView({ behavior: "smooth" });
      return true;
    };

    if (scrollToScanner()) return undefined;

    const observer = new MutationObserver(() => {
      if (scrollToScanner()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [hash]);

  return (
    <Dashboard interactiveSection={<ScannerDashboard />} />
  );
}
