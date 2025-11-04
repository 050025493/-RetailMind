import { CompetitorPriceCard } from "@/components/CompetitorPriceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Search, RefreshCw } from "lucide-react";

export default function Competitors() {
  const priceHistoryData = [
    { date: "Jan 1", you: 7469, amazon: 7054, flipkart: 7262, croma: 6639 },
    { date: "Jan 15", you: 7469, amazon: 7220, flipkart: 7304, croma: 6888 },
    { date: "Feb 1", you: 7469, amazon: 7054, flipkart: 7262, croma: 6639 },
    { date: "Feb 15", you: 7469, amazon: 7469, flipkart: 7469, croma: 7054 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Competitor Watch</h1>
          <p className="mt-1 text-muted-foreground">Monitor competitor pricing in real-time</p>
        </div>
        <Button className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Prices
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
      <Card>
        <CardHeader>
          <CardTitle>Price History - Wireless Headphones Pro</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceHistoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[6200, 7900]} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Line type="monotone" dataKey="you" stroke="hsl(var(--chart-1))" name="Your Price" />
              <Line type="monotone" dataKey="amazon" stroke="hsl(var(--chart-2))" name="Amazon" />
              <Line type="monotone" dataKey="flipkart" stroke="hsl(var(--chart-3))" name="Flipkart" />
              <Line type="monotone" dataKey="croma" stroke="hsl(var(--chart-4))" name="Croma" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CompetitorPriceCard productName="Wireless Headphones Pro" yourPrice={7469} competitors={[{ name: "Amazon", price: 7054 }, { name: "Flipkart", price: 7262 },]} status="overpriced"/>
        <CompetitorPriceCard productName="Smart Watch Elite" yourPrice={24817} competitors={[{ name: "Amazon", price: 27389 }, { name: "Tata Cliq", price: 25730 },]} status="underpriced"/>
        <CompetitorPriceCard productName="Gaming Mouse RGB" yourPrice={4149} competitors={[{ name: "Amazon", price: 4398 }, { name: "Croma", price: 4149 },]} status="competitive"/>
      </div>
    </div>
  );
}