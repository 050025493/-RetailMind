// frontend/src/pages/Promo.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  TrendingUp,
  Calendar,
} from "lucide-react";

const API_URL = 'http://localhost:4000/api';
const getAuthToken = () => localStorage.getItem("token");

export default function Promo() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/promo/campaigns?status=completed`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Promotions</h1>
          <p className="mt-1 text-muted-foreground">
            View historical performance of previous campaigns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Past Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Past Promotions</CardTitle>
            <CardDescription>Historical performance of previous campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{campaign.campaignName}</h4>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{campaign.discountValue}% off</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{campaign.durationDays} days</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      ₹{parseFloat(campaign.actualRevenue || campaign.predictedRevenue || 0).toLocaleString('en-IN')}
                    </p>
                    {campaign.actualDemandLift && (
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-medium text-green-500">+{campaign.actualDemandLift}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No past promotions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
