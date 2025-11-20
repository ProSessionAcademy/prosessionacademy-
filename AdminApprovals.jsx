
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  GraduationCap,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Users,
  AlertCircle,
  User,
  Crown
} from "lucide-react";
import { format } from 'date-fns'; // Added for formatting job application deadline

export default function AdminApprovals() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        // In case of an error fetching user (e.g., not logged in), still set loading to false
        // The access check below will then handle the unauthorized state
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const isTopTierAdmin = user?.admin_level === 'top_tier_admin';

  const { data: companyRegistrations = [] } = useQuery({
    queryKey: ['companyRegistrations'],
    queryFn: () => base44.entities.CompanyRegistration.list('-created_date'),
    initialData: [],
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list('-created_date'),
    initialData: [],
  });

  // NEW: Query for all groups to get pending requests
  const { data: groups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
    initialData: [],
  });

  // ✅ NEW: Query for pending job applications
  const { data: jobApplications = [] } = useQuery({
    queryKey: ['jobApplicationsPending'],
    queryFn: () => base44.entities.JobApplication.list('-created_date'),
    initialData: [],
  });

  const approveCompanyMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyRegistration.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyRegistrations'] });
      alert('✅ Company approved!');
    },
  });

  const rejectCompanyMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyRegistration.update(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyRegistrations'] });
      alert('Company rejected.');
    },
  });

  const approveTeacherMutation = useMutation({
    mutationFn: (id) => base44.entities.Teacher.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      alert('✅ Teacher approved!');
    },
  });

  const rejectTeacherMutation = useMutation({
    mutationFn: (id) => base44.entities.Teacher.update(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      alert('Teacher rejected.');
    },
  });

  // NEW: Mutations for group join requests
  const approveGroupJoinMutation = useMutation({
    mutationFn: async ({ groupId, requestEmail }) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error("Group not found");

      const request = group.pending_requests.find(r => r.user_email === requestEmail);
      if (!request) throw new Error("Pending request not found");

      const newMember = {
        user_email: request.user_email,
        full_name: request.full_name,
        employee_number: request.employee_number,
        joined_date: new Date().toISOString(),
        role: 'member',
        points: 0,
        badges: []
      };

      const updatedRequests = (group.pending_requests || []).map(r =>
        r.user_email === requestEmail ? { ...r, status: 'approved' } : r
      );

      return base44.entities.Group.update(groupId, {
        members: [...(group.members || []), newMember],
        pending_requests: updatedRequests
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
      alert('✅ Member approved!');
    },
    onError: (error) => {
      console.error("Error approving group member:", error);
      alert(`Failed to approve member: ${error.message}`);
    }
  });

  const rejectGroupJoinMutation = useMutation({
    mutationFn: async ({ groupId, requestEmail }) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error("Group not found");

      const updatedRequests = (group.pending_requests || []).map(r =>
        r.user_email === requestEmail ? { ...r, status: 'rejected' } : r
      );

      return base44.entities.Group.update(groupId, {
        pending_requests: updatedRequests
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
      alert('Request rejected.');
    },
    onError: (error) => {
      console.error("Error rejecting group member:", error);
      alert(`Failed to reject member: ${error.message}`);
    }
  });

  // ✅ NEW: Mutations for job applications
  const approveJobMutation = useMutation({
    mutationFn: (id) => base44.entities.JobApplication.update(id, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplicationsPending'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      alert('✅ Job approved!');
    },
  });

  const rejectJobMutation = useMutation({
    mutationFn: (id) => base44.entities.JobApplication.update(id, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplicationsPending'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      alert('Job rejected.');
    },
  });

  const pendingCompanies = companyRegistrations.filter(c => c.status === 'pending');
  const pendingTeachers = teachers.filter(t => t.status === 'pending');

  // NEW: Get all pending group join requests across all groups
  const allPendingGroupRequests = groups.flatMap(group =>
    (group.pending_requests || [])
      .filter(r => r.status === 'pending')
      .map(request => ({ ...request, groupId: group.id, groupName: group.name }))
  );

  // ✅ NEW: Get pending job applications
  const pendingJobs = jobApplications.filter(j => j.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading and checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isTopTierAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-slate-600">Only Top Tier Admins can access this page.</p>
            <Button onClick={() => window.location.href = '/dashboard'} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Approval Center</h1>
              <p className="text-slate-600">Review and approve pending registrations</p>
            </div>
          </div>

          {/* Top Tier Admin Badge */}
          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl shadow-lg">
            <Crown className="w-5 h-5" />
            <span className="font-bold">Top Tier Admin - Ultimate Access</span>
          </div>
          <p className="text-sm text-slate-600 mt-2">You have complete authority to approve or deny all requests.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8"> {/* Changed to grid-cols-4 */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Company Registrations</p>
                  <p className="text-3xl font-bold text-slate-900">{pendingCompanies.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending approval</p>
                </div>
                <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Teacher Applications</p>
                  <p className="text-3xl font-bold text-slate-900">{pendingTeachers.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending approval</p>
                </div>
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NEW CARD */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Group Join Requests</p>
                  <p className="text-3xl font-bold text-slate-900">{allPendingGroupRequests.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending approval</p>
                </div>
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ✅ NEW: Job Applications Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Job Applications</p>
                  <p className="text-3xl font-bold text-slate-900">{pendingJobs.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending approval</p>
                </div>
                <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg p-2"> {/* Changed to grid-cols-4 */}
            <TabsTrigger value="companies" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white">
              <Building2 className="w-4 h-4 mr-2" />
              Companies
              {pendingCompanies.length > 0 && (
                <Badge className="ml-2 bg-orange-600">{pendingCompanies.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teachers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4 mr-2" />
              Teachers
              {pendingTeachers.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{pendingTeachers.length}</Badge>
              )}
            </TabsTrigger>
            {/* NEW TAB */}
            <TabsTrigger value="groups" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Groups
              {allPendingGroupRequests.length > 0 && (
                <Badge className="ml-2 bg-purple-600">{allPendingGroupRequests.length}</Badge>
              )}
            </TabsTrigger>
            {/* ✅ NEW: Jobs Tab */}
            <TabsTrigger value="jobs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />
              Jobs
              {pendingJobs.length > 0 && (
                <Badge className="ml-2 bg-green-600">{pendingJobs.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-4 mt-6">
            {pendingCompanies.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No pending company registrations</h3>
                  <p className="text-slate-500">All company registrations have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              pendingCompanies.map((company) => (
                <Card key={company.id} className="border-none shadow-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {company.logo_url && (
                          <img src={company.logo_url} alt={company.company_name} className="w-16 h-16 rounded-lg object-cover shadow-md" />
                        )}
                        <div>
                          <CardTitle className="text-2xl text-slate-900">{company.company_name}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800">{company.industry}</Badge>
                            <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 mt-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">Description:</p>
                        <p className="text-slate-600 text-sm">{company.description}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-1">Contact Person:</p>
                          <p className="text-slate-600 flex items-center gap-2"><User className="w-4 h-4" />{company.contact_person}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-1">Email:</p>
                          <p className="text-slate-600 flex items-center gap-2"><Mail className="w-4 h-4" />{company.contact_email}</p>
                        </div>
                        {company.phone && (
                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">Phone:</p>
                            <p className="text-slate-600 flex items-center gap-2"><Phone className="w-4 h-4" />{company.phone}</p>
                          </div>
                        )}
                        {company.website && (
                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">Website:</p>
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                              <Globe className="w-4 h-4" />{company.website}
                            </a>
                          </div>
                        )}
                         {company.location && (
                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">Location:</p>
                            <p className="text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4" />{company.location}</p>
                          </div>
                        )}
                      </div>

                      {company.opportunities && company.opportunities.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">Opportunities ({company.opportunities.length}):</p>
                          <div className="space-y-2">
                            {company.opportunities.map((opp, idx) => (
                              <div key={idx} className="bg-slate-50 p-3 rounded-lg flex items-start gap-3 shadow-sm">
                                <Briefcase className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{opp.type}</Badge>
                                    <p className="font-semibold text-slate-800">{opp.title}</p>
                                  </div>
                                  <p className="text-sm text-slate-600">{opp.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => approveCompanyMutation.mutate(company.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-xl"
                          size="lg"
                        >
                          <CheckCircle className="w-6 h-6 mr-2" />
                          APPROVE
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm(`Are you sure you want to reject ${company.company_name}'s registration?`)) {
                              rejectCompanyMutation.mutate(company.id);
                            }
                          }}
                          variant="outline"
                          className="flex-1 border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-6 text-lg font-bold"
                          size="lg"
                        >
                          <XCircle className="w-6 h-6 mr-2" />
                          REJECT
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4 mt-6">
            {pendingTeachers.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No pending teacher applications</h3>
                  <p className="text-slate-500">All teacher applications have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              pendingTeachers.map((teacher) => (
                <Card key={teacher.id} className="border-none shadow-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {teacher.profile_picture && (
                          <img src={teacher.profile_picture} alt={teacher.full_name} className="w-16 h-16 rounded-full object-cover shadow-md" />
                        )}
                        <div>
                          <CardTitle className="text-2xl text-slate-900">
                            {teacher.title && `${teacher.title} `}{teacher.full_name}
                          </CardTitle>
                          <p className="text-slate-600 text-sm flex items-center gap-2"><Mail className="w-4 h-4" />{teacher.user_email}</p>
                          <div className="flex gap-2 mt-2">
                            {teacher.specialization && <Badge variant="outline" className="bg-blue-100 text-blue-800">{teacher.specialization}</Badge>}
                            <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 mt-6">
                      {teacher.bio && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-1">Bio:</p>
                          <p className="text-slate-600 text-sm">{teacher.bio}</p>
                        </div>
                      )}

                      {teacher.subjects && teacher.subjects.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">Subjects:</p>
                          <div className="flex gap-2 flex-wrap">
                            {teacher.subjects.map((subject, idx) => (
                              <Badge key={idx} variant="outline" className="bg-green-50 text-green-800 border-green-200">{subject}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {teacher.office_hours && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-1">Office Hours:</p>
                          <p className="text-slate-600 text-sm">{teacher.office_hours}</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => approveTeacherMutation.mutate(teacher.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-xl"
                          size="lg"
                        >
                          <CheckCircle className="w-6 h-6 mr-2" />
                          APPROVE
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm(`Are you sure you want to reject ${teacher.full_name}'s application?`)) {
                              rejectTeacherMutation.mutate(teacher.id);
                            }
                          }}
                          variant="outline"
                          className="flex-1 border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-6 text-lg font-bold"
                          size="lg"
                        >
                          <XCircle className="w-6 h-6 mr-2" />
                          REJECT
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* NEW TAB CONTENT */}
          <TabsContent value="groups" className="space-y-6">
            {allPendingGroupRequests.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No pending group join requests</h3>
                  <p className="text-slate-500">All group join requests have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allPendingGroupRequests.map((request) => (
                  <Card key={`${request.groupId}-${request.user_email}`} className="border-none shadow-xl hover:shadow-2xl transition-all">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-6 flex-1">
                          {/* Profile Picture Placeholder */}
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                            {request.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>

                          {/* Request Details */}
                          <div className="flex-1">
                            <div className="mb-4">
                              <h3 className="text-2xl font-bold text-slate-900 mb-1">{request.full_name}</h3>
                              <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <Mail className="w-4 h-4" />
                                <span>{request.user_email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <User className="w-4 h-4" />
                                <span>Employee/Student ID: <strong>{request.employee_number}</strong></span>
                              </div>
                              <div className="flex items-center gap-2 text-purple-600 font-semibold mt-3">
                                <Users className="w-4 h-4" />
                                <span>Wants to join: <strong>{request.groupName}</strong></span>
                              </div>
                            </div>

                            <div className="flex gap-3 text-sm text-slate-500">
                              <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700">
                                Requested: {new Date(request.request_date).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 ml-6">
                          <Button
                            onClick={() => approveGroupJoinMutation.mutate({
                              groupId: request.groupId,
                              requestEmail: request.user_email
                            })}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-xl"
                            size="lg"
                          >
                            <CheckCircle className="w-6 h-6 mr-2" />
                            APPROVE
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm(`Are you sure you want to reject ${request.full_name}'s request to join ${request.groupName}?`)) {
                                rejectGroupJoinMutation.mutate({
                                  groupId: request.groupId,
                                  requestEmail: request.user_email
                                });
                              }
                            }}
                            variant="outline"
                            className="border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-6 text-lg font-bold"
                            size="lg"
                          >
                            <XCircle className="w-6 h-6 mr-2" />
                            REJECT
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ✅ NEW: Jobs Tab Content */}
          <TabsContent value="jobs" className="space-y-6">
            {pendingJobs.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No pending job applications</h3>
                  <p className="text-slate-500">All job postings have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingJobs.map((job) => (
                  <Card key={job.id} className="border-none shadow-xl hover:shadow-2xl transition-all">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Briefcase className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-slate-900 mb-1">{job.job_title}</h3>
                              <p className="text-lg text-slate-600">{job.company_name}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge className="bg-green-100 text-green-800 capitalize">{job.job_type.replace('_', ' ')}</Badge>
                                <Badge variant="outline" className="capitalize">{job.category}</Badge>
                                <Badge variant="outline" className="capitalize">{job.experience_level}</Badge>
                                {job.remote_option && <Badge className="bg-blue-100 text-blue-800">Remote</Badge>}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-1">Description:</p>
                              <p className="text-slate-600 text-sm">{job.description}</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">Location:</p>
                                <p className="text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4" />{job.location}</p>
                              </div>
                              {job.salary_range && (
                                <div>
                                  <p className="text-sm font-semibold text-slate-700 mb-1">Salary:</p>
                                  <p className="text-slate-600">{job.salary_range}</p>
                                </div>
                              )}
                              {job.application_deadline && (
                                <div>
                                  <p className="text-sm font-semibold text-slate-700 mb-1">Deadline:</p>
                                  <p className="text-slate-600">{format(new Date(job.application_deadline), 'MMM d, yyyy')}</p>
                                </div>
                              )}
                            </div>

                            {job.contact_email && (
                              <div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">Contact:</p>
                                <p className="text-slate-600 flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {job.contact_email}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-6 mt-6 border-t">
                        <Button
                          onClick={() => approveJobMutation.mutate(job.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-xl"
                          size="lg"
                        >
                          <CheckCircle className="w-6 h-6 mr-2" />
                          APPROVE
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm(`Are you sure you want to reject this job posting?`)) {
                              rejectJobMutation.mutate(job.id);
                            }
                          }}
                          variant="outline"
                          className="flex-1 border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-6 text-lg font-bold"
                          size="lg"
                        >
                          <XCircle className="w-6 h-6 mr-2" />
                          REJECT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
