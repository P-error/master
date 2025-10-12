import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { trans } from "@/lib/motion";
import { ToastProvider } from "@/lib/toast";
import Toaster from "@/components/Toaster";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        <Layout>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={router.asPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: trans(0, 0.35) }}
              exit={{ opacity: 0, y: -8, transition: trans(0, 0.25) }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </Layout>
        <Toaster />
      </ToastProvider>
    </ThemeProvider>
  );
}
