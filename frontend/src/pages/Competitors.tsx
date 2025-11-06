import { useEffect, useState } from "react";
import { CompetitorPriceCard } from "@/components/CompetitorPriceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Search, RefreshCw } from "lucide-react";
import { productsAPI } from "@/lib/api";

export default function Competitors() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock competitor data generation (you'll replace this with real API later)
  const generateCompetitorData = (product: any) => {
    const basePrice = parseFloat(product.currentPrice);
    return [
      {
        name: "Amazon",
        price: Math.round(basePrice * (0.85 + Math.random() * 0.2))
      },
      {
        name: "Flipkart",
        price: Math.round(basePrice * (0.90 + Math.random() * 0.15))
      },
      {
        name: "Croma",
        price: Math.round(basePrice * (0.88 + Math.random() * 0.18))
      }
    ];
  };

  const getCompetitorStatus = (yourPrice: number, competitors: any[]) => {
    const avgCompPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    const diff = ((yourPrice - avgCompPrice) / avgCompPrice) * 100;
    
    if (diff > 10) return 'overpriced';
    if (diff < -10) return 'underpriced';
    return 'competitive';
  };

  // Generate price history data for first product
  const priceHistoryData = products.length > 0 ? Array.from({ length: 6 }, (_, i) => {
    const basePrice = parseFloat(products[0]?.currentPrice || 7000);
    return {
      date: `Week ${i + 1}`,
      you: Math.round(basePrice * (0.95 + Math.random() * 0.1)),
      amazon: Math.round(basePrice * (0.85 + Math.random() * 0.15)),
      flipkart: Math.round(basePrice * (0.88 + Math.random() * 0.12)),
      croma: Math.round(basePrice * (0.82 + Math.random() * 0.18)),
    };
  }) : [];

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading competitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Competitor Watch</h1>
          <p className="mt-1 text-muted-foreground">Monitor competitor pricing in real-time</p>
        </div>
        <Button className="gap-2" onClick={fetchProducts}>
          <RefreshCw className="h-4 w-4" />
          Refresh Prices
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Price History - {products[0].name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceHistoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Line type="monotone" dataKey="you" stroke="hsl(var(--chart-1))" name="Your Price" strokeWidth={2} />
                <Line type="monotone" dataKey="amazon" stroke="hsl(var(--chart-2))" name="Amazon" strokeWidth={2} />
                <Line type="monotone" dataKey="flipkart" stroke="hsl(var(--chart-3))" name="Flipkart" strokeWidth={2} />
                <Line type="monotone" dataKey="croma" stroke="hsl(var(--chart-4))" name="Croma" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const competitors = generateCompetitorData(product);
            const status = getCompetitorStatus(parseFloat(product.currentPrice), competitors);
            
            return (
              <CompetitorPriceCard
                key={product.id}
                productName={product.name}
                yourPrice={parseFloat(product.currentPrice)}
                competitors={competitors}
                status={status}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">No products found</p>
              {search && (
                <Button 
                  variant="link" 
                  onClick={() => setSearch("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}