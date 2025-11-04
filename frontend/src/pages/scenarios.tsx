import { ScenarioBuilder } from "@/components/ScenarioBuilder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Save, Trash2 } from "lucide-react";

export default function Scenarios() {
  const savedScenarios = [
    { id: "1", name: "Aggressive Pricing", description: "15% discount, 30% demand increase", revenue: "₹43,53,350", marketShare: "32%", },
    { id: "2", name: "Conservative Growth", description: "5% discount, 10% demand increase", revenue: "₹39,69,006", marketShare: "27%", },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">What-If Scenarios</h1>
        <p className="mt-1 text-muted-foreground">Build and test complex market scenarios</p>
      </div>
      <ScenarioBuilder />
      <Card>
        <CardHeader>
          <CardTitle>Saved Scenarios</CardTitle>
          <CardDescription>Previously saved scenario simulations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedScenarios.map((scenario) => (
            <div key={scenario.id} className="flex items-start justify-between rounded-lg border p-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold">{scenario.name}</h4>
                <p className="mb-2 text-sm text-muted-foreground">{scenario.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">Revenue: {scenario.revenue}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">Share: {scenario.marketShare}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon"><Save className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}