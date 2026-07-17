import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { fraunces, literata, jetbrainsMono } from "@/components/Portfolio/fonts"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shijil | Portfolio",
  description: "Junior Full-Stack Developer - Django, Next.js, React Native",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${literata.variable} ${jetbrainsMono.variable}`}
    >
      <body className={inter.className}>{children}</body>
    </html>
  )
}