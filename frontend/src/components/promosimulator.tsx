import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
export function PromoSimulator() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Simulation</CardTitle>
                <CardDescription>Define promotional scenarios to see their impact.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Simulator UI for defining discounts and predicting revenue will be here.</p>
            </CardContent>
        </Card>
    );
}