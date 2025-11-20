import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, AlertTriangle, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AIChat() {
  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <Card className="max-w-2xl w-full border-none shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6 relative">
            <Bot className="w-10 h-10 text-white" />
            <Lock className="w-8 h-8 text-white absolute -bottom-2 -right-2 bg-slate-700 rounded-full p-1" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">AI Assistant</h1>
          
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <p className="text-amber-900 font-semibold mb-2">AI Features Disabled</p>
            <p className="text-sm text-amber-700">
              AI-powered features have been disabled to eliminate operational costs. This includes chat assistants and WhatsApp agents.
            </p>
          </div>

          <p className="text-slate-600 mb-6">
            All AI-powered assistance features are currently disabled. You can still access all other platform features including courses, groups, community, and more.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-slate-500 font-semibold">Alternative Options:</p>
            
            <Link to={createPageUrl("Community")}>
              <Button variant="outline" className="w-full">
                Ask the Community Forum
              </Button>
            </Link>

            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}