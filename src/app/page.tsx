import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ValueProposition } from "@/components/landing/ValueProposition";
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
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
