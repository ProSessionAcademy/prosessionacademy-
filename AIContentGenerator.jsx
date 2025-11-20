import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function AIContentGenerator() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser.role === 'admin');
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full border-none shadow-2xl">
        <CardContent className="p-12 text-center">
          <Lock className="w-20 h-20 text-slate-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">AI Content Generator</h2>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <p className="text-amber-900 font-semibold mb-2">Feature Temporarily Disabled</p>
            <p className="text-sm text-amber-700">
              AI content generation has been disabled to reduce operational costs. This feature uses expensive AI APIs.
            </p>
          </div>
          <p className="text-slate-600 mb-6">
            The AI Content Generator previously allowed automated course creation and content generation. 
            This feature may return in a future premium tier.
          </p>
          {isAdmin && (
            <Link to={createPageUrl("CourseAdmin")}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Go to Course Admin (Manual Creation)
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}