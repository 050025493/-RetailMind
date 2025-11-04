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
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">Overview of your pricing performance</p>
      </div>

      {/* Stats Grid with enhanced styling */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title}
            className="stat-card overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center gap-1 mt-1 ${
                stat.trend === 'up' ? 'text-green-500' : 'text-muted-foreground'
              }`}>
                {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-1))" 
                    name="Revenue" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--chart-2))" 
                    name="Target" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary/50 to-transparent">
            <CardTitle className="text-lg">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    type="number" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    width={100} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="hsl(var(--chart-1))" 
                    radius={[0, 8, 8, 0]}
                    className="hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardTitle className="text-lg">Recent Price Alerts</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[
              { product: "Wireless Headphones Pro", status: "Competitor price drop", severity: "high" },
              { product: "Smart Watch Elite", status: "Low stock alert", severity: "medium" },
              { product: "Gaming Mouse RGB", status: "Margin below target", severity: "medium" },
            ].map((alert, i) => (
              <div 
                key={i} 
                className="group flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-muted/50 hover:border-primary/50 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'high' 
                      ? 'bg-red-500/10' 
                      : 'bg-yellow-500/10'
                  }`}>
                    <AlertCircle className={`h-5 w-5 ${
                      alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {alert.product}
                    </p>
                    <p className="text-sm text-muted-foreground">{alert.status}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  alert.severity === 'high' 
                    ? 'bg-red-500/10 text-red-500' 
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}>
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