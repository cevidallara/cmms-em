"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`space-y-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
