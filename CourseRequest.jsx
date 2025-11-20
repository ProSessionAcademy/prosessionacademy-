
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Lightbulb, 
  Send, 
  ThumbsUp, 
  CheckCircle, 
  Clock,
  AlertCircle,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function CourseRequest() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    course_title: "",
    course_description: "",
    category: "self_development",
    level: "beginner",
    reason: "",
    urgency: "medium"
  });

  useEffect(() => {
    const fetchUser = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    };
    fetchUser();
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['courseRequests'],
    queryFn: () => base44.entities.CourseRequest.list('-created_date'),
    initialData: [],
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseRequests'] });
      setFormData({
        course_title: "",
        course_description: "",
        category: "self_development",
        level: "beginner",
        reason: "",
        urgency: "medium"
      });
      alert('✅ Course request submitted successfully!');
    },
  });

  const voteRequestMutation = useMutation({
    mutationFn: ({ id, voters, votes }) => 
      base44.entities.CourseRequest.update(id, { voters, votes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseRequests'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }

    createRequestMutation.mutate({
      ...formData,
      user_email: user.email,
      user_name: user.full_name || user.email
    });
  };

  const handleVote = (request) => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }

    const hasVoted = request.voters?.includes(user.email);
    
    if (hasVoted) {
      // Remove vote
      voteRequestMutation.mutate({
        id: request.id,
        voters: request.voters.filter(email => email !== user.email),
        votes: (request.votes || 0) - 1
      });
    } else {
      // Add vote
      voteRequestMutation.mutate({
        id: request.id,
        voters: [...(request.voters || []), user.email],
        votes: (request.votes || 0) + 1
      });
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    reviewing: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    completed: "bg-purple-100 text-purple-700",
    rejected: "bg-red-100 text-red-700"
  };

  const statusIcons = {
    pending: Clock,
    reviewing: AlertCircle,
    approved: CheckCircle,
    completed: CheckCircle,
    rejected: AlertCircle
  };

  const urgencyColors = {
    low: "border-green-200 bg-green-50",
    medium: "border-yellow-200 bg-yellow-50",
    high: "border-red-200 bg-red-50"
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 space-y-8">
        {/* Premium Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Lightbulb className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
                  Course Requests
                </h1>
                <p className="text-blue-200 text-lg">Suggest courses • Vote for ideas • Shape the platform</p>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-300 text-sm">
                  <button onClick={() => base44.auth.redirectToLogin()} className="underline font-semibold">Login</button> to submit requests or vote
                </p>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-2xl p-2">
            <TabsTrigger value="request" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-xl text-slate-300">
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-xl text-slate-300">
              <TrendingUp className="w-4 h-4 mr-2" />
              Browse Requests
            </TabsTrigger>
          </TabsList>

          {/* Submit Request Tab */}
          <TabsContent value="request">
            <Card className="border border-white/10 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  Request a New Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-slate-300 mb-2">Course Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Advanced Negotiation Strategies"
                      value={formData.course_title}
                      onChange={(e) => setFormData({...formData, course_title: e.target.value})}
                      required
                      className="bg-slate-800 text-white border-white/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-slate-300 mb-2">Course Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="What should this course cover? Be specific about topics, skills, or outcomes you expect..."
                      value={formData.course_description}
                      onChange={(e) => setFormData({...formData, course_description: e.target.value})}
                      rows={5}
                      required
                      className="bg-slate-800 text-white border-white/20"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-slate-300 mb-2">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger className="bg-slate-800 text-white border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self_development">Self Development</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="study_skills">Study Skills</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="level" className="text-slate-300 mb-2">Difficulty Level *</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => setFormData({...formData, level: value})}
                      >
                        <SelectTrigger className="bg-slate-800 text-white border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason" className="text-slate-300 mb-2">Why do you need this course? *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Explain why this course would be valuable to you and other learners..."
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      rows={3}
                      required
                      className="bg-slate-800 text-white border-white/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="urgency" className="text-slate-300 mb-2">Urgency</Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => setFormData({...formData, urgency: value})}
                    >
                      <SelectTrigger className="bg-slate-800 text-white border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Nice to have</SelectItem>
                        <SelectItem value="medium">Medium - Would be helpful</SelectItem>
                        <SelectItem value="high">High - Really need it</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={!isAuthenticated}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Course Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browse Requests Tab */}
          <TabsContent value="browse">
            <div className="space-y-4">
              {requests.length > 0 ? (
                requests.map((request) => {
                  const StatusIcon = statusIcons[request.status] || Clock;
                  const hasVoted = isAuthenticated && request.voters?.includes(user?.email);

                  return (
                    <div key={request.id} className="group relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
                      <Card className="relative border border-white/10 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-white">{request.course_title}</h3>
                                <Badge className={statusColors[request.status]}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400 mb-3">{request.course_description}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                                <Badge variant="outline" className="border-white/20 text-slate-300">{request.category?.replace(/_/g, ' ')}</Badge>
                                <Badge variant="outline" className="border-white/20 text-slate-300">{request.level}</Badge>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(request.created_date).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="p-3 bg-slate-800 rounded-lg border border-white/10">
                                <p className="text-sm text-slate-300"><span className="font-semibold">Why needed:</span> {request.reason}</p>
                              </div>
                            </div>

                            {/* Vote Button */}
                            <div className="ml-6 text-center">
                              <Button
                                onClick={() => handleVote(request)}
                                variant={hasVoted ? "default" : "outline"}
                                className={`flex flex-col h-auto py-3 px-6 text-white ${hasVoted ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' : 'bg-slate-800 border-white/20 hover:bg-slate-700'}`}
                                disabled={!isAuthenticated}
                              >
                                <ThumbsUp className={`w-6 h-6 mb-1 ${hasVoted ? 'fill-current' : 'text-slate-300'}`} />
                                <span className="text-2xl font-bold">{request.votes || 0}</span>
                                <span className="text-xs">votes</span>
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                            <p className="text-xs text-slate-400">
                              Requested by <span className="font-semibold">{request.user_name}</span>
                            </p>
                            {request.urgency === 'high' && (
                              <Badge className="bg-red-100 text-red-700">
                                🔥 High Priority
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              ) : (
                <Card className="border border-white/10 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
                  <CardContent className="p-16 text-center">
                    <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No requests yet</h3>
                    <p className="text-slate-400 mb-4">Be the first to request a course!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
