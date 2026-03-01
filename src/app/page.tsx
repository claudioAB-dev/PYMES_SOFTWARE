import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ValueProposition } from "@/components/landing/ValueProposition";
import { AccountantBanner } from "@/components/landing/AccountantBanner";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ValueProposition />
        <AccountantBanner />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
