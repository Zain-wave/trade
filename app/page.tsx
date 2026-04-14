import { Header } from "@/components/landing/header"
import { TickerTape } from "@/components/landing/ticker-tape"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { MarketPreview } from "@/components/landing/market-preview"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <TickerTape />
      </div>
      <HeroSection />
      <FeaturesSection />
      <MarketPreview />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
