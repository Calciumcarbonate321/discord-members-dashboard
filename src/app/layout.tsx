import "~/styles/globals.css";

import { NextAuthProvider } from "~/components/providers";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Toaster } from "~/components/ui/toaster"

export const metadata: Metadata = {
  title: "IEEECS VITC Members List",
  description: "Created for internal management purposes",
  icons: [{ rel: "favicon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextAuthProvider>
      <html lang="en" className={`${GeistSans.variable}`}>
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </NextAuthProvider>
  );
}
