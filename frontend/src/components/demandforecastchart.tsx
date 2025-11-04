import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartProps {
  title: string;
  description: string;
  data: { date: string; demand?: number; predicted: number }[];
}

export function DemandForecastChart({ title, description, data }: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false}/>
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="demand" name="Actual Demand" stroke="hsl(var(--chart-1))" />
            <Line type="monotone" dataKey="predicted" name="Predicted Demand" stroke="hsl(var(--chart-2))" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}