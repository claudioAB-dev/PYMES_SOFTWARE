import { Navbar } from "@/components/landing/Navbar";
import { LaunchBanner } from "@/components/landing/LaunchBanner";
import { Hero } from "@/components/landing/Hero";
import { BuiltDifferent } from "@/components/landing/BuiltDifferent";
import { EcosystemTabs } from "@/components/landing/EcosystemTabs";
import { ManufacturingSection } from "@/components/landing/ManufacturingSection";
import { AccountantBanner } from "@/components/landing/AccountantBanner";
import { Pricing } from "@/components/landing/Pricing";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { CTAFinal } from "@/components/landing/CTAFinal";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[--background]">
      <LaunchBanner />
      <Navbar />
      <main>
        <Hero />
        <BuiltDifferent />
        <EcosystemTabs />
        <ManufacturingSection />
        <AccountantBanner />
        <Pricing />
        <TrustBadges />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  );
}
