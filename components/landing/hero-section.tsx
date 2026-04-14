"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Grid overlay background */}
      <div className="absolute inset-0 grid-overlay" />
      
      {/* Animated candlestick decorations */}
      <div className="absolute left-10 top-1/4 flex gap-2 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 bg-primary rounded-full animate-candlestick"
            style={{
              height: `${40 + Math.random() * 60}px`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute right-10 bottom-1/4 flex gap-2 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 bg-accent rounded-full animate-candlestick"
            style={{
              height: `${40 + Math.random() * 60}px`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Trusted by 50,000+ investors</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="block">Invest in stocks & crypto.</span>
          <span className="block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Convert to USDT instantly.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          The modern investment platform for the next generation of traders.
          Buy stocks, trade crypto, and seamlessly convert your gains to USDT.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6 neon-glow group">
              Start Investing
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/market">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              View Market
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/50 max-w-3xl mx-auto">
          <div className="text-center">
            <p className="font-mono text-3xl sm:text-4xl font-bold text-primary">$2.5B+</p>
            <p className="text-sm text-muted-foreground mt-1">Trading Volume</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-3xl sm:text-4xl font-bold text-primary">50K+</p>
            <p className="text-sm text-muted-foreground mt-1">Active Users</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-3xl sm:text-4xl font-bold text-primary">99.9%</p>
            <p className="text-sm text-muted-foreground mt-1">Uptime</p>
          </div>
        </div>
      </div>
    </section>
  )
}
