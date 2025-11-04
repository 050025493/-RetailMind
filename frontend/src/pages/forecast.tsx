import { DemandForecastChart } from "@/components/DemandForecastChart";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Search, Download } from "lucide-react";

export default function Forecast() {
  const products = [
    {
      name: "Wireless Headphones Pro",
      data: [
        { date: "Week 1", demand: 120, predicted: 115 },
        { date: "Week 2", demand: 140, predicted: 138 },
        { date: "Week 3", demand: 160, predicted: 165 },
        { date: "Week 4", demand: 180, predicted: 185 },
        { date: "Week 5", demand: 0, predicted: 205 },
        { date: "Week 6", demand: 0, predicted: 220 },
      ],
    },
    {
      name: "Smart Watch Elite",
      data: [
        { date: "Week 1", demand: 80, predicted: 82 },
        { date: "Week 2", demand: 75, predicted: 76 },
        { date: "Week 3", demand: 70, predicted: 72 },
        { date: "Week 4", demand: 65, predicted: 68 },
        { date: "Week 5", demand: 0, predicted: 64 },
        { date: "Week 6", demand: 0, predicted: 60 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Demand Forecast</h1>
          <p className="mt-1 text-muted-foreground">AI-powered demand predictions for all products</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
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
      <div className="space-y-6">
        {products.map((product) => (
          <DemandForecastChart
            key={product.name}
            title={product.name}
            data={product.data}
            description="6-week forecast with confidence intervals"
          />
        ))}
      </div>
    </div>
  );
}