import { PromoSimulator } from "@/components/PromoSimulator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp } from "lucide-react";

export default function Promo() {
  const pastPromos = [
    { id: "1", name: "Summer Sale 2024", discount: 20, duration: "14 days", revenue: 4353350, impact: "+15.9%" },
    { id: "2", name: "Black Friday", discount: 30, duration: "3 days", revenue: 6493089, impact: "+73.2%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Promo Impact Simulator</h1>
        <p className="mt-1 text-muted-foreground">Test discount strategies before implementation</p>
      </div>
      <PromoSimulator />
      <Card>
        <CardHeader>
          <CardTitle>Past Promotions</CardTitle>
          <CardDescription>Historical performance of previous campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pastPromos.map((promo) => (
            <div key={promo.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">{promo.name}</h4>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{promo.discount}% off</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{promo.duration}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">₹{promo.revenue.toLocaleString('en-IN')}</p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-sm font-medium text-green-500">{promo.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}