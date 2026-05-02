"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { PublicHeader } from "@/components/layout/public-header";

const ORDER = ["/terms", "/privacy", "/mentions-legales"];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevIdx = useRef(ORDER.indexOf(pathname));
  const curIdx  = ORDER.indexOf(pathname);
  const dir     = curIdx >= prevIdx.current ? 1 : -1;
  prevIdx.current = curIdx;

  return (
    <>
      <PublicHeader />
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={pathname}
          custom={dir}
          initial={{ opacity: 0, x: dir * 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -48 }}
          transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
          style={{ minHeight: "100vh" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
