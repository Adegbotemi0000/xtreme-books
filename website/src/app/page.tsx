import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Features } from "@/components/Features";
import { ComplianceSpotlight } from "@/components/ComplianceSpotlight";
import { Pricing } from "@/components/Pricing";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <ComplianceSpotlight />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
