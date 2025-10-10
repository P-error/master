import Layout from "../components/Layout";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import "@/styles/globals.css"; // обязательно!


export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
