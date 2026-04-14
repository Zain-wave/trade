"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"

const marketData = [
  { symbol: "BTC", name: "Bitcoin", price: 67842.50, change: 2.34, type: "crypto", icon: "₿" },
  { symbol: "ETH", name: "Ethereum", price: 3456.78, change: 1.89, type: "crypto", icon: "Ξ" },
  { symbol: "AAPL", name: "Apple Inc.", price: 178.32, change: -0.45, type: "stock", icon: "" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 245.67, change: 3.21, type: "stock", icon: "" },
  { symbol: "SOL", name: "Solana", price: 145.23, change: 5.67, type: "crypto", icon: "◎" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.80, change: -0.23, type: "stock", icon: "" },
]

export function MarketPreview() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Live Market</h2>
            <p className="text-muted-foreground">
              Real-time prices from global markets
            </p>
          </div>
          <Link href="/market">
            <Button variant="outline" className="group">
              View All Markets
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Market table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Asset
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    24h Change
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {marketData.map((asset, index) => (
                  <tr
                    key={asset.symbol}
                    className={`border-b border-border/50 hover:bg-white/5 transition-colors ${
                      index % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          {asset.icon ? (
                            <span className="text-lg">{asset.icon}</span>
                          ) : (
                            <span className="font-mono text-xs font-bold">
                              {asset.symbol.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{asset.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono font-medium">
                        ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-sm ${
                          asset.change >= 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {asset.change >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {asset.change >= 0 ? "+" : ""}
                        {asset.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href="/register">
                        <Button size="sm" variant="secondary">
                          Trade
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
