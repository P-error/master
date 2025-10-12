// src/components/FeatureGrid.tsx
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeVariants, scaleTap } from "@/lib/motion";

type FeatureItem = {
  title: string;
  desc: string;
  href: string;
  cta: string;
};

export default function FeatureGrid({ items }: { items: FeatureItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it, i) => (
        <motion.div
          key={it.title}
          variants={fadeVariants(i * 0.03)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            variants={scaleTap}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="h-full rounded-2xl bg-white/70 p-4 shadow-soft transition dark:bg-white/5"
          >
            <div className="text-base font-semibold">{it.title}</div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{it.desc}</p>
            <Link
              href={it.href}
              className="mt-3 inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-sm font-medium text-gray-900 transition hover:shadow-ring dark:bg-white/5 dark:text-gray-200"
            >
              {it.cta}
            </Link>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
