import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Search, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

export default function Pricing() {
  const products = [
    {
      id: 1,
      name: "Wireless Headphones Pro",
      currentPrice: 7469,
      suggestedPrice: 6999,
      change: -6.3,
      reason: "Competitor pricing + demand increase",
      confidence: 92,
    },
    {
      id: 2,
      name: "Smart Watch Elite",
      currentPrice: 24817,
      suggestedPrice: 26299,
      change: +6.0,
      reason: "Low stock + high demand",
      confidence: 88,
    },
    {
      id: 3,
      name: "Gaming Mouse RGB",
      currentPrice: 4149,
      suggestedPrice: 4149,
      change: 0,
      reason: "Optimal price point",
      confidence: 95,
    },
    {
      id: 4,
      name: "Mechanical Keyboard",
      currentPrice: 8999,
      suggestedPrice: 9499,
      change: +5.6,
      reason: "Premium demand + limited competition",
      confidence: 85,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Smart Pricing</h1>
          <p className="mt-1 text-muted-foreground">AI-powered pricing recommendations</p>
        </div>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Apply All Suggestions
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{product.reason}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                  <Sparkles className="h-3 w-3" />
                  <span className="font-medium">{product.confidence}% confidence</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-2xl font-bold">₹{product.currentPrice.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Suggested Price</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">₹{product.suggestedPrice.toLocaleString('en-IN')}</p>
                      {product.change !== 0 && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${product.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {product.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span>{Math.abs(product.change).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Dismiss</Button>
                  <Button disabled={product.change === 0}>Apply Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Optimal pricing window detected</p>
                <p className="text-sm text-muted-foreground">
                  4 products can increase prices by 5-8% with minimal demand impact
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <TrendingDown className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">Competitive pressure identified</p>
                <p className="text-sm text-muted-foreground">
                  2 products facing aggressive competitor pricing, recommend price adjustments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}