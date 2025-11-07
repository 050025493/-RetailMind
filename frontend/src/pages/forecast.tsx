import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/buttonVariants";
import { DemandForecastChart } from "@/components/DemandForecastChart";

interface Product {
  id: number;
  name: string;
  category?: string;
}

const API_URL = 'http://localhost:4000/api';

const getAuthToken = () => localStorage.getItem("token");

export default function Forecast() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/products`, {
        headers: { 
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }

      const json = await res.json();
      console.log('Products response:', json);

      if (json.success) {
        setProducts(json.data);
      } else {
        setError(json.message || 'Failed to load products');
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || 'Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Demand Forecast</h1>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Demand Forecast</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No products found. Please add products first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Demand Forecast</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered demand predictions for {products.length} products
          </p>
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
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No products match your search.</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <DemandForecastChart
              key={product.id}
              productId={product.id}
              productName={product.name}
            />
          ))
        )}
      </div>
    </div>
  );
}