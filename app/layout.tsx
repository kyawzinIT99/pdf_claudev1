import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./pdf-shell.css";
import "./admin-shell.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "PDF — Community Relief for Myanmar";
  const description =
    "A civilian humanitarian platform supporting people affected by Myanmar’s military coup through verified stories, giving, events and community care.";

  return {
    metadataBase: base,
    title: {
      default: title,
      template: "%s | PDF",
    },
    description,
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: base,
      images: [
        {
          url: new URL("/og-australian-spirit.png", base).toString(),
          width: 1674,
          height: 942,
          alt: "PDF community relief",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [new URL("/og-australian-spirit.png", base).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
