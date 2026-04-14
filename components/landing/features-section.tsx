import { BarChart3, RefreshCw, Shield } from "lucide-react"

const features = [
  {
    icon: BarChart3,
    title: "Buy Stocks",
    description:
      "Access global markets and invest in top-performing stocks from major exchanges worldwide. Real-time pricing and instant execution.",
  },
  {
    icon: RefreshCw,
    title: "Auto-convert to USDT",
    description:
      "Seamlessly convert your profits to USDT with our integrated Binance connection. Lock in your gains with stable value.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description:
      "Bank-grade security with Stripe and MercadoPago integration. Your funds are protected with multi-layer encryption.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to trade
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete trading ecosystem designed for modern investors
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card p-8 hover:bg-white/10 transition-all duration-300 group"
            >
              <div
                className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
