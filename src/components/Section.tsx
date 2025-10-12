// src/components/Section.tsx
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeVariants } from "@/lib/motion";

export default function Section({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      {(title || subtitle) && (
        <motion.div
          variants={fadeVariants(0)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-6"
        >
          {title && (
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          )}
        </motion.div>
      )}
      {children}
    </section>
  );
}
