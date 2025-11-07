import { useState, useEffect } from "react";
import { Button } from "@/components/ui/buttonVariants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";

interface DemandForecastChartProps {
  productId: number;
  productName: string;
}

interface HistoryItem {
  date: string;
  quantity_sold: number;
}

interface ForecastItem {
  date: string;
  predicted_quantity: number;
}

interface ChartDataItem {
  date: string;
  demand: number | null;
  predicted: number | null;
}

const API_URL = 'http://localhost:4000/api';
const getAuthToken = () => localStorage.getItem("token");

const formatChartData = (
  history: HistoryItem[],
  forecast: ForecastItem[]
): ChartDataItem[] => {
  const dataMap = new Map<string, ChartDataItem>();

  // Add historical data
  history.forEach(item => {
    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dataMap.set(date, { date, demand: item.quantity_sold, predicted: null });
  });

  // Add forecast data
  forecast.forEach(item => {
    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dataMap.has(date)) {
      const existing = dataMap.get(date)!;
      existing.predicted = item.predicted_quantity;
    } else {
      dataMap.set(date, { date, demand: null, predicted: item.predicted_quantity });
    }
  });
  
  return Array.from(dataMap.values());
};

export const DemandForecastChart = ({ productId, productName }: DemandForecastChartProps) => {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [historyCount, setHistoryCount] = useState(0);
  const [forecastCount, setForecastCount] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const token = getAuthToken();
      
      // Fetch history and forecast
      const [historyRes, forecastRes] = await Promise.all([
        fetch(`${API_URL}/products/${productId}/history`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }),
        fetch(`${API_URL}/forecast/${productId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }),
      ]);

      const historyJson = await historyRes.json();
      const forecastJson = await forecastRes.json();

      console.log(`Product ${productId} history:`, historyJson);
      console.log(`Product ${productId} forecast:`, forecastJson);

      if (historyJson.success && forecastJson.success) {
        const history: HistoryItem[] = historyJson.data || [];
        const forecast: ForecastItem[] = forecastJson.data || [];
        
        setHistoryCount(history.length);
        setForecastCount(forecast.length);

        if (history.length > 0 || forecast.length > 0) {
          const formattedData = formatChartData(history, forecast);
          setChartData(formattedData);
        }
      } else {
        setError(forecastJson.message || historyJson.message || 'Failed to load data');
      }
    } catch (err: any) {
      console.error("Error fetching chart data:", err);
      setError(err.message || 'Error loading chart data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const handleGenerateForecast = async () => {
    setIsGenerating(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/forecast/${productId}`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
      });
      
      const json = await res.json();
      console.log('Generate forecast response:', json);
      
      if (json.success) {
        alert(`✅ ${json.message}`);
        await fetchData(); // Refresh the chart
      } else {
        alert(`❌ Error: ${json.message}`);
      }
    } catch (err: any) {
      console.error("Error generating forecast:", err);
      alert(`❌ An error occurred: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{productName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading forecast data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{productName}</CardTitle>
            <CardDescription className="mt-2">
              {historyCount > 0 && `${historyCount} days of sales history`}
              {historyCount > 0 && forecastCount > 0 && ' • '}
              {forecastCount > 0 && `${forecastCount} days forecasted`}
              {historyCount === 0 && forecastCount === 0 && 'No data available'}
            </CardDescription>
          </div>
          <Button 
            onClick={handleGenerateForecast} 
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? "Generating..." : "Generate Forecast"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-900/10">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {chartData.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No forecast data available for this product.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Need at least 30 days of sales history to generate a forecast.
            </p>
            <Button onClick={handleGenerateForecast} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Try Generate Forecast"}
            </Button>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Units', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="demand" 
                  stroke="hsl(var(--chart-1))" 
                  name="Historical Sales"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="hsl(var(--chart-2))" 
                  name="AI Forecast" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>

            {chartData.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Historical Days</p>
                  <p className="text-xl font-bold mt-1">{historyCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Forecasted Days</p>
                  <p className="text-xl font-bold mt-1">{forecastCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Data Points</p>
                  <p className="text-xl font-bold mt-1">{chartData.length}</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};