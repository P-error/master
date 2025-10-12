// src/pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" className="scroll-smooth">
        <Head>
          <meta name="theme-color" content="#4f46e5" />
          <meta name="color-scheme" content="light dark" />
        </Head>
        <body className="min-h-dvh bg-bg text-fg">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
