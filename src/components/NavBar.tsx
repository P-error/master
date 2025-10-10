import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex gap-4 p-4 bg-gray-100 shadow">
      <Link href="/" className="text-blue-600 hover:underline">Home</Link>
      <Link href="/profile" className="text-blue-600 hover:underline">Profile</Link>
      <Link href="/chat" className="text-blue-600 hover:underline">Chat</Link>
      <Link href="/settings" className="text-blue-600 hover:underline">Settings</Link>
      <Link href="/auth" className="text-blue-600 hover:underline">Login / Register</Link>
    </nav>
  );
}
