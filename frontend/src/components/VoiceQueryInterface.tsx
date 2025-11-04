import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/buttonVariants";
import { Mic } from "lucide-react";

export function VoiceQueryInterface() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Voice Query</CardTitle>
                <CardDescription>Use your voice to query prices.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
                <p className="text-sm text-muted-foreground">"What's the price of headphones?"</p>
                <Button size="icon" className="h-16 w-16 rounded-full">
                    <Mic className="h-8 w-8" />
                </Button>
            </CardContent>
        </Card>
    )
}