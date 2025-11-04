import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/buttonVariants";
import { Input } from "./ui/Input";
import { Play } from "lucide-react";

export function ScenarioBuilder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Scenario</CardTitle>
        <CardDescription>Define market conditions and pricing strategies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Scenario Name</label>
            <Input placeholder="e.g., Holiday Season 2024" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period</label>
            <Input type="number" placeholder="Days" defaultValue="30" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Price Change (%)</label>
            <Input type="number" placeholder="e.g., -15" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Demand Lift (%)</label>
            <Input type="number" placeholder="e.g., 30" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Competition Factor</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Parameters</label>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="stock" className="h-4 w-4" />
              <label htmlFor="stock" className="text-sm">Include stock constraints</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="seasonal" className="h-4 w-4" />
              <label htmlFor="seasonal" className="text-sm">Apply seasonal factors</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="bundle" className="h-4 w-4" />
              <label htmlFor="bundle" className="text-sm">Consider bundle deals</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="loyalty" className="h-4 w-4" />
              <label htmlFor="loyalty" className="text-sm">Factor in loyalty programs</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline">Reset</Button>
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Run Simulation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}