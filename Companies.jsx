
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Search, 
  Briefcase, 
  MapPin,
  ExternalLink,
  Mail,
  CheckCircle,
  Plus,
  Upload,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export default function Companies() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [registrationForm, setRegistrationForm] = useState({
    company_name: "",
    contact_person: "",
    contact_email: "",
    phone: "",
    industry: "",
    description: "",
    website: "",
    logo_url: "",
    location: "",
    opportunities: []
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
    initialData: [],
  });

  const registerCompanyMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyRegistration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyRegistrations'] });
      setShowRegisterDialog(false);
      setRegistrationForm({
        company_name: "",
        contact_person: "",
        contact_email: "",
        phone: "",
        industry: "",
        description: "",
        website: "",
        logo_url: "",
        location: "",
        opportunities: []
      });
      alert("✅ Registration submitted! We'll review and approve your company soon.");
    },
  });

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setRegistrationForm({ ...registrationForm, logo_url: response.file_url });
      alert('✅ Logo uploaded!');
    } catch (error) {
      alert('❌ Upload failed');
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleRegisterCompany = () => {
    if (!registrationForm.company_name || !registrationForm.contact_person || !registrationForm.contact_email || !registrationForm.industry || !registrationForm.description) {
      alert("Please fill in all required fields");
      return;
    }
    registerCompanyMutation.mutate(registrationForm);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === "all" || company.industry?.toLowerCase().includes(industryFilter.toLowerCase());
    return matchesSearch && matchesIndustry;
  });

  const industries = ["all", ...new Set(companies.map(c => c.industry).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 space-y-8">
        {/* Premium Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-blue-400 to-purple-400">
                    Company Portal
                  </h1>
                  <p className="text-blue-200 text-lg">Explore opportunities • Connect with industry leaders</p>
                </div>
              </div>
              
              <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105">
                    <Plus className="w-5 h-5 mr-2" />
                    Register Company
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border border-white/10 rounded-lg">
                  <DialogHeader>
                    <DialogTitle>Register Your Company</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Company Name *</Label>
                        <Input
                          value={registrationForm.company_name}
                          onChange={(e) => setRegistrationForm({...registrationForm, company_name: e.target.value})}
                          placeholder="Your company name"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Industry *</Label>
                        <Input
                          value={registrationForm.industry}
                          onChange={(e) => setRegistrationForm({...registrationForm, industry: e.target.value})}
                          placeholder="e.g., Technology, Finance"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Description *</Label>
                      <Textarea
                        value={registrationForm.description}
                        onChange={(e) => setRegistrationForm({...registrationForm, description: e.target.value})}
                        placeholder="Tell us about your company..."
                        rows={4}
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Contact Person *</Label>
                        <Input
                          value={registrationForm.contact_person}
                          onChange={(e) => setRegistrationForm({...registrationForm, contact_person: e.target.value})}
                          placeholder="Your name"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Contact Email *</Label>
                        <Input
                          type="email"
                          value={registrationForm.contact_email}
                          onChange={(e) => setRegistrationForm({...registrationForm, contact_email: e.target.value})}
                          placeholder="email@company.com"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Phone</Label>
                        <Input
                          value={registrationForm.phone}
                          onChange={(e) => setRegistrationForm({...registrationForm, phone: e.target.value})}
                          placeholder="+1234567890"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Website</Label>
                        <Input
                          value={registrationForm.website}
                          onChange={(e) => setRegistrationForm({...registrationForm, website: e.target.value})}
                          placeholder="https://yourcompany.com"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Location</Label>
                      <Input
                        value={registrationForm.location}
                        onChange={(e) => setRegistrationForm({...registrationForm, location: e.target.value})}
                        placeholder="City, Country"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Company Logo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={registrationForm.logo_url}
                          onChange={(e) => setRegistrationForm({...registrationForm, logo_url: e.target.value})}
                          placeholder="Or paste logo URL..."
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                          disabled={uploadingLogo}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingLogo}
                          onClick={() => document.getElementById('logo-upload').click()}
                          className="border-slate-700 text-white hover:bg-slate-700"
                        >
                          {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                      </div>
                      {registrationForm.logo_url && (
                        <img src={registrationForm.logo_url} className="w-32 h-32 object-contain mt-2 border border-slate-700 rounded" alt="Company Logo Preview"/>
                      )}
                    </div>

                    <Button 
                      onClick={handleRegisterCompany}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      disabled={registerCompanyMutation.isPending}
                    >
                      {registerCompanyMutation.isPending ? "Submitting..." : "Submit Registration"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-slate-900/50 backdrop-blur-xl border-white/10 rounded-2xl text-white placeholder:text-slate-500 shadow-xl"
            />
          </div>

          <Tabs value={industryFilter} onValueChange={setIndustryFilter}>
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-slate-900/50 backdrop-blur-xl p-2 rounded-2xl">
              {industries.map(industry => (
                <TabsTrigger 
                  key={industry} 
                  value={industry}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl text-slate-300 capitalize"
                >
                  {industry === 'all' ? 'All Industries' : industry}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
              <Card className="relative border border-white/10 shadow-2xl hover:shadow-orange-500/20 transition-all bg-slate-900/80 backdrop-blur-xl overflow-hidden transform group-hover:scale-105 group-hover:-translate-y-1 rounded-2xl">
                <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-6">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="max-h-20 max-w-full object-contain" />
                  ) : (
                    <Building2 className="w-16 h-16 text-slate-600" />
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-300 bg-orange-500/10">
                      {company.industry}
                    </Badge>
                    {company.verified && (
                      <Badge className="bg-green-500/20 border-green-500 text-green-300 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl text-white">{company.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-sm line-clamp-3">
                    {company.description}
                  </p>
                  
                  {company.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 rounded-lg p-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span>{company.location}</span>
                    </div>
                  )}

                  {company.opportunities && company.opportunities.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-400" />
                        Open Opportunities
                      </h4>
                      {company.opportunities.slice(0, 2).map((opp, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-sm text-white">{opp.title}</p>
                            <Badge className="text-xs bg-blue-500/20 border-blue-500 text-blue-300">
                              {opp.type}
                            </Badge>
                          </div>
                          {opp.application_deadline && (
                            <p className="text-xs text-slate-400">
                              Deadline: {format(new Date(opp.application_deadline), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      ))}
                      {company.opportunities.length > 2 && (
                        <p className="text-xs text-slate-400">
                          +{company.opportunities.length - 2} more opportunities
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    {company.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/10 text-white hover:bg-orange-500/10"
                        onClick={() => window.open(company.website, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Website
                      </Button>
                    )}
                    {company.contact_email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/10 text-white hover:bg-blue-500/10"
                        onClick={() => window.location.href = `mailto:${company.contact_email}`}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <Card className="border border-white/10 shadow-2xl bg-slate-900/80 backdrop-blur-xl rounded-2xl">
            <CardContent className="p-16 text-center">
              <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No companies found</h3>
              <p className="text-slate-400">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
