import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-12 sm:p-16 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to start investing?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
              Join TradeNest today and get access to global markets, instant USDT conversion, and secure payments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 neon-glow group">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/market">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Explore Markets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
