import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

interface Competitor { name: string; price: number; }
interface CardProps {
  productName: string;
  yourPrice: number;
  competitors: Competitor[];
  status: 'overpriced' | 'underpriced' | 'competitive';
}

export function CompetitorPriceCard({ productName, yourPrice, competitors, status }: CardProps) {
  const statusConfig = {
    overpriced: { text: "Overpriced", color: "text-red-500" },
    underpriced: { text: "Underpriced", color: "text-green-500" },
    competitive: { text: "Competitive", color: "text-yellow-500" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{productName}</CardTitle>
        <p className={`text-sm font-bold ${statusConfig[status].color}`}>{statusConfig[status].text}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><strong>Your Price:</strong> ₹{yourPrice.toLocaleString('en-IN')}</p>
        <div className="text-muted-foreground">
          {competitors.map(c => <p key={c.name}>{c.name}: ₹{c.price.toLocaleString('en-IN')}</p>)}
        </div>
      </CardContent>
    </Card>
  );
}