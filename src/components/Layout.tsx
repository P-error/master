import { ReactNode } from "react";
import Link from "next/link";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div>
      <nav className="flex gap-4 bg-gray-200 p-4">
        <Link href="/">Home</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/chat">Chat</Link>
        <Link href="/test">Test</Link>
        <Link href="/subjects">Subjects</Link>
        <Link href="/statistics">Statistics</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
