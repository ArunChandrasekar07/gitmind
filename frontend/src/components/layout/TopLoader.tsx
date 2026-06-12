"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function TopLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(15);
    const t1 = setTimeout(() => setProgress(60), 150);
    const t2 = setTimeout(() => setProgress(88), 400);
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setLoading(false), 220);
    }, 550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] h-[2px] origin-left"
          style={{
            /* amber → soft gold shimmer */
            background:
              "linear-gradient(90deg, hsl(38 92% 54%), hsl(45 95% 68%), hsl(38 92% 54%))",
          }}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: progress / 100 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}