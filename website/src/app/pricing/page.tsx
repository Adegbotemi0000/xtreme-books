import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PricingPlans } from "@/components/PricingPlans";

export const metadata: Metadata = {
  title: "Pricing — Kora",
  description:
    "One price by team size, every module included on every plan. Start your free trial of Kora today.",
};

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="flex-1 pt-32">
        <PricingPlans />
      </main>
      <Footer />
    </div>
  );
}
