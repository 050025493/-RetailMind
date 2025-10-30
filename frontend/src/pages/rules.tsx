import { VoiceQueryInterface } from "@/components/VoiceQueryInterface";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Rules() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Auto-Pricing Rules</h1>
        <p className="mt-1 text-muted-foreground">Create automated pricing rules and voice queries</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Rule Builder</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">A UI for building rule-based overrides for AI decisions will be here.</p></CardContent>
        </Card>
        <div>
          <VoiceQueryInterface />
        </div>
      </div>
    </div>
  );
}