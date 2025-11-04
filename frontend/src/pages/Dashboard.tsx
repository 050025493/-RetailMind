import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Package, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { title: "Total Revenue", value: "₹43,53,350", change: "+12.5%", icon: DollarSign, trend: "up" },
    { title: "Products Tracked", value: "156", change: "+8", icon: Package, trend: "up" },
    { title: "Avg. Margin", value: "24.3%", change: "+2.1%", icon: TrendingUp, trend: "up" },
    { title: "Price Alerts", value: "7", change: "3 new", icon: AlertCircle, trend: "neutral" },
  ];

  const revenueData = [
    { month: "Jan", revenue: 3500000, target: 3200000 },
    { month: "Feb", revenue: 3800000, target: 3500000 },
    { month: "Mar", revenue: 4100000, target: 3800000 },
    { month: "Apr", revenue: 3900000, target: 4000000 },
    { month: "May", revenue: 4200000, target: 4200000 },
    { month: "Jun", revenue: 4353350, target: 4300000 },
  ];

  const categoryData = [
    { category: "Electronics", sales: 12500000 },
    { category: "Accessories", sales: 8200000 },
    { category: "Gaming", sales: 6800000 },
    { category: "Audio", sales: 5500000 },
    { category: "Mobile", sales: 4300000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your pricing performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-muted-foreground'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" name="Revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="hsl(var(--chart-2))" name="Target" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="category" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Price Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { product: "Wireless Headphones Pro", status: "Competitor price drop", severity: "high" },
              { product: "Smart Watch Elite", status: "Low stock alert", severity: "medium" },
              { product: "Gaming Mouse RGB", status: "Margin below target", severity: "medium" },
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className={`h-5 w-5 ${alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="font-medium">{alert.product}</p>
                    <p className="text-sm text-muted-foreground">{alert.status}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}