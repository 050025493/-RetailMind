import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Package, AlertCircle, Download } from "lucide-react";
import { productsAPI, importAPI } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch product stats
      const statsResponse = await productsAPI.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Fetch all products
      const productsResponse = await productsAPI.getAll();
      if (productsResponse.success) {
        setProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      const response = await importAPI.seedDemo();
      
      if (response.success) {
        alert('Demo data added successfully! Refreshing...');
        await fetchDashboardData();
      } else {
        alert(response.message || 'Error adding demo data');
      }
    } catch (error) {
      console.error('Error seeding demo:', error);
      alert('Error adding demo data');
    } finally {
      setSeeding(false);
    }
  };

  // Calculate category breakdown from real data
  const categoryData = products.reduce((acc: any[], product: any) => {
    const existing = acc.find(c => c.category === product.category);
    const sales = parseFloat(product.currentPrice) * parseInt(product.stockQuantity || 0);
    
    if (existing) {
      existing.sales += sales;
    } else {
      acc.push({
        category: product.category || 'Uncategorized',
        sales: sales
      });
    }
    return acc;
  }, []).sort((a, b) => b.sales - a.sales).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show seed demo button if no products
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Products Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You don't have any products yet. Get started by adding demo data or importing your products.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleSeedDemo} 
                disabled={seeding}
                className="w-full"
              >
                {seeding ? 'Adding Demo Data...' : '🎯 Add Demo Products'}
              </Button>
              <Button variant="outline" className="w-full">
                📥 Import Products (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = [
    { 
      title: "Total Revenue", 
      value: `₹${Math.round(stats?.total_inventory_value || 0).toLocaleString('en-IN')}`,
      change: "+12.5%",
      icon: DollarSign,
      trend: "up" 
    },
    { 
      title: "Products Tracked", 
      value: stats?.total_products || 0,
      change: `+${products.length}`,
      icon: Package,
      trend: "up" 
    },
    { 
      title: "Avg. Price", 
      value: `₹${Math.round(stats?.avg_price || 0).toLocaleString('en-IN')}`,
      change: "+2.1%",
      icon: TrendingUp,
      trend: "up" 
    },
    { 
      title: "Low Stock Items", 
      value: products.filter(p => p.stockQuantity <= 10).length,
      change: "Needs attention",
      icon: AlertCircle,
      trend: "neutral" 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Real-time pricing insights and performance metrics
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-muted-foreground'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="category" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                  <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products
                .sort((a, b) => (b.currentPrice * b.stockQuantity) - (a.currentPrice * a.stockQuantity))
                .slice(0, 5)
                .map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.stockQuantity} units @ ₹{parseFloat(product.currentPrice).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ₹{(product.currentPrice * product.stockQuantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${product.stockQuantity <= 10 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    <Package className={`h-5 w-5 ${product.stockQuantity <= 10 ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.stockQuantity <= 10 ? 'Low stock alert' : 'Stock level normal'}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {product.stockQuantity} units
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}