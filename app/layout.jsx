import "./globals.css";

export const metadata = {
  title: "AlphaSend — Transactional Email Platform",
  description: "Internal email delivery management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
