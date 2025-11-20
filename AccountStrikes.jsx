
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Shield,
  AlertTriangle,
  User,
  Calendar,
  Image as ImageIcon,
  FileText,
  Ban,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Unlock
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEVERITY_COLORS = {
  low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  medium: 'bg-orange-100 text-orange-800 border-orange-300',
  high: 'bg-red-100 text-red-800 border-red-300',
  extreme: 'bg-red-900 text-white border-red-900'
};

const ACTION_COLORS = {
  none: 'bg-slate-100 text-slate-700',
  warning: 'bg-yellow-500 text-white',
  temp_ban: 'bg-orange-600 text-white',
  permanent_ban: 'bg-red-700 text-white'
};

export default function AccountStrikes() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedStrike, setSelectedStrike] = useState(null);
  const [reviewAction, setReviewAction] = useState('none');
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser.role === 'admin');
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: strikes = [], isLoading } = useQuery({
    queryKey: ['contentStrikes'],
    queryFn: () => base44.entities.ContentStrike.list('-created_date'),
    initialData: []
  });

  // Fetch all users to check blocked status
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
    initialData: []
  });

  const updateStrikeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentStrike.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentStrikes'] });
      setSelectedStrike(null);
      setReviewAction('none');
      setReviewNotes('');
    }
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userEmail) => {
      // 1. Unblock user
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, { image_generation_blocked: false });
      }
      
      // 2. DELETE ALL STRIKES for this user (fresh start!)
      const userStrikes = await base44.entities.ContentStrike.filter({ user_email: userEmail });
      for (const strike of userStrikes) {
        await base44.entities.ContentStrike.delete(strike.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentStrikes'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      alert('✅ User unblocked & all strikes cleared!');
    }
  });

  const handleReview = async () => {
    if (!selectedStrike) return;

    await updateStrikeMutation.mutateAsync({
      id: selectedStrike.id,
      data: {
        action_taken: reviewAction,
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
        notes: reviewNotes
      }
    });

    alert('✅ Strike reviewed!');
  };

  const handleUnblock = async (userEmail, userName) => {
    if (confirm(`🔓 UNBLOCK ${userName || userEmail}?\n\nThis will:\n✅ Restore image generation access\n✅ DELETE ALL strikes (fresh start)\n\nContinue?`)) {
      await unblockUserMutation.mutateAsync(userEmail);
    }
  };

  const filteredStrikes = strikes.filter(strike => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return !strike.action_taken || strike.action_taken === 'none';
    if (filterStatus === 'reviewed') return strike.action_taken && strike.action_taken !== 'none';
    return true;
  });

  // Group by user
  const strikesByUser = filteredStrikes.reduce((acc, strike) => {
    if (!acc[strike.user_email]) {
      acc[strike.user_email] = {
        email: strike.user_email,
        name: strike.user_name,
        strikes: []
      };
    }
    acc[strike.user_email].strikes.push(strike);
    return acc;
  }, {});

  const sortedUsers = Object.values(strikesByUser).sort((a, b) => b.strikes.length - a.strikes.length);

  // Helper to check if user is blocked
  const isUserBlocked = (email) => {
    const userRecord = allUsers.find(u => u.email === email);
    return userRecord?.image_generation_blocked === true;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Ban className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-2">Admin Only</h3>
            <p className="text-slate-600">This page is restricted to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-none shadow-xl bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black mb-1">🚨 Account Strikes</h1>
                  <p className="text-red-100">Content moderation & violation tracking</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black">{strikes.length}</div>
                <div className="text-sm text-red-100">Total Strikes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-3xl font-bold">{strikes.filter(s => !s.action_taken || s.action_taken === 'none').length}</p>
                  <p className="text-sm text-slate-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold">{strikes.filter(s => s.action_taken && s.action_taken !== 'none').length}</p>
                  <p className="text-sm text-slate-600">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold">{sortedUsers.length}</p>
                  <p className="text-sm text-slate-600">Flagged Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-3xl font-bold">{sortedUsers.filter(u => u.strikes.length >= 3).length}</p>
                  <p className="text-sm text-slate-600">High Risk (3+ strikes)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Label className="font-semibold">Filter:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strikes</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users with Strikes */}
        <div className="space-y-4">
          {sortedUsers.map((userGroup) => {
            const blocked = isUserBlocked(userGroup.email);
            
            return (
              <Card key={userGroup.email} className={`border-2 shadow-xl ${
                blocked ? 'border-red-600 bg-red-50' : 
                userGroup.strikes.length >= 3 ? 'border-orange-500 bg-orange-50' : 
                'border-slate-200'
              }`}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        blocked ? 'bg-red-700' :
                        userGroup.strikes.length >= 3 ? 'bg-orange-600' : 
                        'bg-gradient-to-br from-blue-600 to-purple-600'
                      }`}>
                        {userGroup.name?.charAt(0) || userGroup.email?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{userGroup.name}</CardTitle>
                          {blocked && (
                            <Badge className="bg-red-700 text-white">
                              🔒 BLOCKED
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{userGroup.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={`text-lg px-4 py-2 ${
                          blocked ? 'bg-red-700 text-white' :
                          userGroup.strikes.length >= 3 ? 'bg-orange-600 text-white' : 
                          'bg-yellow-600 text-white'
                        }`}>
                          {userGroup.strikes.length} Strike{userGroup.strikes.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {blocked && (
                        <Button
                          onClick={() => handleUnblock(userGroup.email, userGroup.name)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold"
                          size="sm"
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Unblock User
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {userGroup.strikes.map((strike) => (
                      <div
                        key={strike.id}
                        className="p-4 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={`${SEVERITY_COLORS[strike.severity || 'medium']} border-2`}>
                                {strike.severity || 'medium'} severity
                              </Badge>
                              {strike.action_taken && strike.action_taken !== 'none' && (
                                <Badge className={ACTION_COLORS[strike.action_taken]}>
                                  {strike.action_taken.replace('_', ' ')}
                                </Badge>
                              )}
                              <span className="text-xs text-slate-500">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(strike.created_date).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3 mb-3">
                              <p className="text-xs font-bold text-slate-500 mb-1">Prompt Used:</p>
                              <p className="text-sm text-slate-900 font-mono">{strike.prompt}</p>
                            </div>
                            
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                              <p className="text-xs font-bold text-red-700 mb-1">AI Analysis:</p>
                              <p className="text-sm text-red-900">{strike.ai_analysis}</p>
                            </div>

                            {strike.notes && (
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
                                <p className="text-xs font-bold text-blue-700 mb-1">Admin Notes:</p>
                                <p className="text-sm text-blue-900">{strike.notes}</p>
                                <p className="text-xs text-blue-600 mt-2">
                                  Reviewed by: {strike.reviewed_by} on {new Date(strike.reviewed_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => setSelectedStrike(strike)}
                              size="sm"
                              variant="outline"
                              className="whitespace-nowrap"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            {strike.image_url && (
                              <Button
                                onClick={() => window.open(strike.image_url, '_blank')}
                                size="sm"
                                variant="outline"
                                className="whitespace-nowrap"
                              >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                View Image
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedUsers.length === 0 && (
          <Card className="border-none shadow-xl">
            <CardContent className="p-16 text-center">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No Strikes! 🎉</h3>
              <p className="text-slate-600">All users are following content guidelines.</p>
            </CardContent>
          </Card>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedStrike} onOpenChange={() => setSelectedStrike(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Review Strike</DialogTitle>
            </DialogHeader>

            {selectedStrike && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-600 mb-1">User</p>
                    <p className="text-lg font-semibold">{selectedStrike.user_name}</p>
                    <p className="text-sm text-slate-500">{selectedStrike.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-600 mb-1">Date</p>
                    <p className="text-sm">{new Date(selectedStrike.created_date).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-bold mb-2 block">Prompt Used</Label>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="font-mono text-sm">{selectedStrike.prompt}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-bold mb-2 block">AI Analysis</Label>
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <p className="text-red-900">{selectedStrike.ai_analysis}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-bold mb-2 block">Severity</Label>
                  <Badge className={`${SEVERITY_COLORS[selectedStrike.severity || 'medium']} text-lg px-4 py-2`}>
                    {selectedStrike.severity || 'medium'}
                  </Badge>
                </div>

                {selectedStrike.image_url && (
                  <div>
                    <Label className="font-bold mb-2 block">Flagged Image</Label>
                    <div className="bg-slate-900 rounded-xl p-4">
                      <img 
                        src={selectedStrike.image_url} 
                        alt="Flagged content" 
                        className="w-full rounded-lg border-4 border-red-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="font-bold mb-2 block">Action</Label>
                  <Select value={reviewAction} onValueChange={setReviewAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Action</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="temp_ban">🚫 Temporary Ban</SelectItem>
                      <SelectItem value="permanent_ban">⛔ Permanent Ban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-bold mb-2 block">Admin Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Your notes on this case..."
                    rows={4}
                  />
                </div>

                <Button onClick={handleReview} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 text-lg font-bold">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Save Review
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
