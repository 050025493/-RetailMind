import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  Download,
  Loader2, // <-- Import loader
} from "lucide-react";
import { dashboardAPI } from "@/lib/api";

// --- PDF/Image Library Imports ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// --- shadcn/ui Dropdown Imports (REMOVED) ---
// We are no longer importing DropdownMenu

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- New state for export buttons ---
  const [isExporting, setIsExporting] = useState(false);

  // --- New Refs for capturing elements ---
  const dashboardContentRef = useRef<HTMLDivElement>(null);
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const categoryChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // ... (Your existing loadDashboardData is perfect)
    try {
      setLoading(true);
      const statsRes = await dashboardAPI.getStats();
      const revenueRes = await dashboardAPI.getRevenueTrend();
      const categoryRes = await dashboardAPI.getCategorySales();
      const alertsRes = await dashboardAPI.getAlerts();
      const topRes = await dashboardAPI.getTopProducts();

      setStats(statsRes.data || {});
      setRevenue(revenueRes.data || []);
      setCategories(categoryRes.data || []);
      setAlerts(alertsRes.data || []);
      setTopProducts(topRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // --- We will keep the "Detailed Report" function ---
  const handleExportDataReport = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      // --- Page 1: Title, Summary Stats, and Top Products ---
      pdf.setFontSize(18);
      pdf.text('Dashboard Report', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

      // Summary Stats (from your statsCards)
      pdf.setFontSize(14);
      pdf.text('Key Performance Indicators', 14, 45);
      pdf.setFontSize(11);
      pdf.text(`- Total Revenue: ${stats?.total_revenue.toLocaleString("en-IN") || 'N/A'}`, 16, 52);
      pdf.text(`- Average Margin: ${stats?.avg_margin || 0}%`, 16, 58);
      pdf.text(`- Total Products: ${stats?.total_products || 0}`, 16, 64);
      pdf.text(`- Low Stock Items: ${stats?.low_stock_count || 0}`, 16, 70);

      // Top Products Table
      const tableData = topProducts.map(p => [
        p.name,
        p.total_units_sold,
        `₹${parseFloat(p.total_revenue).toLocaleString("en-IN")}`
      ]);
      
      autoTable(pdf, {
        head: [['Product Name', 'Units Sold', 'Total Revenue']],
        body: tableData,
        startY: 80,
        headStyles: { fillColor: [30, 58, 138] }, // Dark blue header
      });

      pdf.setFontSize(10);
      pdf.text('Page 1', 105, 287, { align: 'center' });

      // --- Page 2: Charts ---
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Visualizations', 14, 22);

      // We need to make sure the refs are pointing to the right place.
      // The chart elements might not be rendered if loading is slow.
      // Let's add checks.

      if (revenueChartRef.current) {
        revenueChartRef.current.style.backgroundColor = 'white';
        const revenueCanvas = await html2canvas(revenueChartRef.current, { scale: 2 });
        const revenueImgData = revenueCanvas.toDataURL('image/png');
        revenueChartRef.current.style.backgroundColor = '';
        pdf.addImage(revenueImgData, 'PNG', 10, 30, 190, 100); 
      }

      if (categoryChartRef.current) {
        categoryChartRef.current.style.backgroundColor = 'white';
        const categoryCanvas = await html2canvas(categoryChartRef.current, { scale: 2 });
        const categoryImgData = categoryCanvas.toDataURL('image/png');
        categoryChartRef.current.style.backgroundColor = '';
        pdf.addImage(categoryImgData, 'PNG', 10, 140, 190, 100);
      }
      
      pdf.setFontSize(10);
      pdf.text('Page 2', 105, 287, { align: 'center' });

      pdf.save('dashboard-detailed-report.pdf');

    } catch (err) {
      console.error("Error generating data report:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    // ... (Loading UI) ...
    return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
           <p className="text-muted-foreground">Loading dashboard...</p>
         </div>
       </div>
    );
  }

  const statsCards = [
    // ... (statsCards array) ...
    {
      title: "Total Revenue",
      value: `₹${Math.round(stats?.total_revenue || 0).toLocaleString("en-IN")}`,
      change: "+12.3%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Total Products",
      value: stats?.total_products || 0,
      change: "+3",
      icon: Package,
      trend: "up",
    },
    {
      title: "Avg. Margin",
      value: `${stats?.avg_margin || 0}%`,
      change: "+2.1%",
      icon: TrendingUp,
      trend: "up",
    },
    {
      title: "Low Stock Items",
      value: stats?.low_stock_count || 0,
      change: "Needs attention",
      icon: AlertCircle,
      trend: "neutral",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Real-time insights and product performance metrics
          </p>
        </div>

        {/* --- MODIFIED: Reverted to a single Button --- */}
        <Button 
          variant="outline" 
          className="gap-2" 
          disabled={isExporting}
          onClick={handleExportDataReport} // <-- This now calls the data report function
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Report"}
        </Button>
        
      </div>

      
      {/* We are grabbing refs from the charts directly, so this dashboardContentRef is not needed for the data report */}
      <div ref={dashboardContentRef} className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              {/* ... (Card JSX) ... */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs ${
                    stat.trend === "up"
                      ? "text-green-500"
                      : stat.trend === "neutral"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Trend & Category Sales */}
        <div className="grid gap-4 md:grid-cols-2">
          
          <Card ref={revenueChartRef}>
            <CardHeader>
              <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  {/* ... (LineChart JSX) ... */}
                  <LineChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2345eb"
                      strokeWidth={3}
                      dot={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- MODIFIED: Added ref to this Card --- */}
          <Card ref={categoryChartRef}>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  {/* ... (BarChart JSX) ... */}
                  <BarChart data={categories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="category"
                      type="category"
                      width={100}
                      fontSize={12}
                    />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No category sales data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Alerts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* ... (Top Products and Alerts cards) ... */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border-b pb-2 last:border-none"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.total_units_sold} units | ₹
                          {parseFloat(p.current_price).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <p className="font-bold text-primary">
                        ₹{parseFloat(p.total_revenue).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No top products available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className={`p-3 rounded-lg border ${
                        a.severity === "high"
                          ? "border-red-500/40 bg-red-500/10 text-red-600"
                          : "border-blue-500/40 bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="font-medium">{a.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent alerts</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}