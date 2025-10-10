import type { AppProps } from "next/app";
import "@/styles/globals.css"; // обязательно!

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
