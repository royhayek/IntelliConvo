"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";

interface AnimatedTabContentProps {
  value: string;
  children: ReactNode;
}

export function AnimatedTabContent({ value, children }: AnimatedTabContentProps) {
  return (
    <TabsContent value={value} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </TabsContent>
  );
}
