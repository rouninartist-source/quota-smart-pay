import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/quota/Nav";
import { Hero } from "@/components/quota/Hero";
import { LogoStrip } from "@/components/quota/LogoStrip";
import { Problems } from "@/components/quota/Problems";
import { ProductSection } from "@/components/quota/ProductSection";
import { HowItWorks } from "@/components/quota/HowItWorks";
import { WhatsAppSection } from "@/components/quota/WhatsAppSection";
import { WhyQuota } from "@/components/quota/WhyQuota";
import { Trust } from "@/components/quota/Trust";
import { Pricing } from "@/components/quota/Pricing";
import { FAQ } from "@/components/quota/FAQ";
import { CTA } from "@/components/quota/CTA";
import { Footer } from "@/components/quota/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quota · Cotações, facturas e recibos em Moçambique" },
      {
        name: "description",
        content:
          "Crie cotações, facturas e recibos com IVA, NUIT e os seus dados de pagamento (banco, M-Pesa ou e-Mola) impressos no documento.",
      },
      { property: "og:title", content: "Quota · Cotações, facturas e recibos em Moçambique" },
      {
        property: "og:description",
        content:
          "Crie cotações, facturas e recibos com IVA, NUIT e os seus dados de pagamento (banco, M-Pesa ou e-Mola) impressos no documento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <LogoStrip />
      <Problems />
      <ProductSection />
      <HowItWorks />
      <WhatsAppSection />
      <WhyQuota />
      <Trust />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
