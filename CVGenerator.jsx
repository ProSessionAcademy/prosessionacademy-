
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Plus,
  X,
  Camera,
  ArrowLeft,
  Loader2,
  Sparkles,
  Palette,
  Eye,
  Wand2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CV_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Blue',
    gradient: 'from-blue-600 to-cyan-500',
    preview: '💼',
    colors: { primary: '#2563eb', secondary: '#0891b2', accent: '#06b6d4' }
  },
  {
    id: 'elegant',
    name: 'Elegant Purple',
    gradient: 'from-purple-600 to-pink-500',
    preview: '👔',
    colors: { primary: '#9333ea', secondary: '#ec4899', accent: '#f97316' }
  },
  {
    id: 'professional',
    name: 'Professional Dark',
    gradient: 'from-slate-800 to-slate-600',
    preview: '🎯',
    colors: { primary: '#1e293b', secondary: '#475569', accent: '#64748b' }
  },
  {
    id: 'creative',
    name: 'Creative Orange',
    gradient: 'from-orange-500 to-red-500',
    preview: '🎨',
    colors: { primary: '#f97316', secondary: '#ef4444', accent: '#dc2626' }
  },
  {
    id: 'minimal',
    name: 'Minimal Green',
    gradient: 'from-emerald-500 to-teal-500',
    preview: '🌿',
    colors: { primary: '#10b981', secondary: '#14b8a6', accent: '#059669' }
  },
  {
    id: 'tech',
    name: 'Tech Gradient',
    gradient: 'from-indigo-600 to-purple-600',
    preview: '💻',
    colors: { primary: '#4f46e5', secondary: '#7c3aed', accent: '#6366f1' }
  }
];

const CVPreview = ({ data, template, photoUrl }) => {
  const colors = CV_TEMPLATES.find(t => t.id === template)?.colors || CV_TEMPLATES[0].colors;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full bg-white shadow-2xl rounded-xl overflow-hidden"
      style={{ minHeight: '1100px' }}
    >
      <div
        className="text-white p-10 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative flex items-start gap-6">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-xl">
              <Camera className="w-12 h-12 text-white/50" />
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-4xl font-black mb-2">
              {data.personal.fullName || 'Your Name'}
            </h1>
            <p className="text-xl text-white/90 mb-4">
              {data.personal.title || 'Your Professional Title'}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              {data.personal.email && <span>📧 {data.personal.email}</span>}
              {data.personal.phone && <span>📱 {data.personal.phone}</span>}
              {data.personal.location && <span>📍 {data.personal.location}</span>}
            </div>
            {(data.personal.linkedin || data.personal.website) && (
              <div className="flex flex-wrap gap-4 text-sm mt-2">
                {data.personal.linkedin && <span>💼 {data.personal.linkedin}</span>}
                {data.personal.website && <span>🌐 {data.personal.website}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-10 space-y-8">
        {data.personal.summary && (
          <div>
            <div className="text-2xl font-bold mb-3 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
              Professional Summary
            </div>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{data.personal.summary}</p>
          </div>
        )}

        {data.experience.length > 0 && (
          <div>
            <div className="text-2xl font-bold mb-4 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
              💼 Work Experience
            </div>
            <div className="space-y-6">
              {data.experience.map((exp, idx) => (
                <div key={idx} className="relative pl-6 border-l-2" style={{ borderColor: colors.accent }}>
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full" style={{ background: colors.primary }}></div>
                  <h3 className="text-xl font-bold text-slate-900">{exp.title || 'Position Title'}</h3>
                  <p className="text-slate-600 font-semibold">
                    {exp.company || 'Company Name'} {exp.location && `• ${exp.location}`}
                  </p>
                  <p className="text-sm text-slate-500 mb-2">
                    {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                  </p>
                  {exp.description && (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education.length > 0 && (
          <div>
            <div className="text-2xl font-bold mb-4 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
              🎓 Education
            </div>
            <div className="space-y-4">
              {data.education.map((edu, idx) => (
                <div key={idx} className="relative pl-6 border-l-2" style={{ borderColor: colors.accent }}>
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full" style={{ background: colors.primary }}></div>
                  <h3 className="text-xl font-bold text-slate-900">{edu.degree || 'Degree'}</h3>
                  <p className="text-slate-600 font-semibold">
                    {edu.institution || 'Institution'} {edu.location && `• ${edu.location}`}
                  </p>
                  <p className="text-sm text-slate-500">
                    {edu.year || 'Year'} {edu.gpa && `• GPA: ${edu.gpa}`}
                  </p>
                  {edu.description && (
                    <p className="text-slate-700 mt-1 whitespace-pre-line">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(data.skills.length > 0 || data.languages.length > 0) && (
          <div className="grid md:grid-cols-2 gap-8">
            {data.skills.length > 0 && (
              <div>
                <div className="text-2xl font-bold mb-4 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
                  ⚡ Skills
                </div>
                <div className="space-y-3">
                  {data.skills.map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-slate-900">{skill.name || 'Skill'}</span>
                        <span className="text-slate-600 capitalize">{skill.level}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: skill.level === 'advanced' ? '90%' : skill.level === 'intermediate' ? '60%' : '30%',
                            background: colors.primary
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.languages.length > 0 && (
              <div>
                <div className="text-2xl font-bold mb-4 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
                  🌍 Languages
                </div>
                <div className="space-y-2">
                  {data.languages.map((lang, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">{lang.name || 'Language'}</span>
                      <Badge className="capitalize" style={{ background: colors.secondary, color: 'white' }}>
                        {lang.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {data.certifications.length > 0 && (
          <div>
            <div className="text-2xl font-bold mb-4 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
              🏆 Certifications
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {data.certifications.map((cert, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-4 border-l-4" style={{ borderColor: colors.primary }}>
                  <h4 className="font-bold text-slate-900">{cert.name || 'Certification'}</h4>
                  <p className="text-sm text-slate-600">{cert.issuer || 'Issuer'}</p>
                  <p className="text-xs text-slate-500 mt-1">{cert.date || 'Date'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function CVGenerator() {
  const [user, setUser] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiField, setAiField] = useState(null);
  const [aiBulletPoints, setAiBulletPoints] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [cvData, setCvData] = useState({
    personal: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      summary: ''
    },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: []
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        setCvData(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            fullName: currentUser.full_name || '',
            email: currentUser.email || ''
          }
        }));
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchUser();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const openAIAssistant = (section, id, field) => {
    setAiField({ section, id, field });
    setAiBulletPoints('');
    setShowAIDialog(true);
  };

  const generateAIText = async () => {
    if (!aiBulletPoints.trim()) {
      alert('⚠️ Please enter bullet points!');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional CV writer. Convert these bullet points into a compelling, professional description for a CV/resume.

Bullet points:
${aiBulletPoints}

Write a polished, professional paragraph (2-4 sentences) that highlights achievements and skills. Use action verbs and quantify results where possible. Make it impressive but honest.`
      });

      if (aiField.section === 'personal' && aiField.field === 'summary') {
        setCvData(prev => ({
          ...prev,
          personal: { ...prev.personal, summary: result }
        }));
      } else {
        updateItem(aiField.section, aiField.id, aiField.field, result);
      }

      setShowAIDialog(false);
      setAiBulletPoints('');
      
    } catch (error) {
      alert('AI generation failed: ' + error.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now(),
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    }));
  };

  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now(),
        degree: '',
        institution: '',
        location: '',
        year: '',
        gpa: '',
        description: ''
      }]
    }));
  };

  const addSkill = () => {
    setCvData(prev => ({
      ...prev,
      skills: [...prev.skills, { id: Date.now(), name: '', level: 'intermediate' }]
    }));
  };

  const addLanguage = () => {
    setCvData(prev => ({
      ...prev,
      languages: [...prev.languages, { id: Date.now(), name: '', level: 'intermediate' }]
    }));
  };

  const addCertification = () => {
    setCvData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        id: Date.now(),
        name: '',
        issuer: '',
        date: ''
      }]
    }));
  };

  const removeItem = (section, id) => {
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const updateItem = (section, id, field, value) => {
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const generatePDF = async () => {
    if (!cvData.personal.fullName || !cvData.personal.title) {
      alert('⚠️ Please fill in at least your name and title!');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateCVPDF', {
        cvData: cvData,
        template: selectedTemplate,
        photoUrl: photoUrl
      });

      if (response.data.success && response.data.pdfBase64) {
        const binary = atob(response.data.pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.data.filename || 'CV.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        alert('✅ CV PDF Downloaded!');
      } else {
        throw new Error('PDF generation failed');
      }
      
    } catch (error) {
      console.error('❌ CV Error:', error);
      alert('❌ Failed: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6 flex items-center justify-center">
        <Card className="max-w-md border-none shadow-2xl">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">Login Required</h3>
            <Button onClick={() => base44.auth.redirectToLogin()} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Wand2 className="w-6 h-6 text-purple-600" />
              ✨ AI Writing Assistant
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-purple-50 border-2 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm text-purple-900 font-semibold">
                  💡 Enter your achievements as simple bullet points - AI will transform them into impressive professional text!
                </p>
              </CardContent>
            </Card>

            <div>
              <Label className="text-base font-bold mb-2 block">Your Bullet Points:</Label>
              <Textarea
                value={aiBulletPoints}
                onChange={(e) => setAiBulletPoints(e.target.value)}
                placeholder="Examples:&#10;• Managed team of 10 developers&#10;• Increased revenue by 40% in 6 months&#10;• Led 5 major projects from start to finish&#10;• Implemented new CRM system&#10;• Reduced costs by $100K annually"
                rows={10}
                className="text-base font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowAIDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={generateAIText}
                disabled={isGeneratingAI || !aiBulletPoints.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI is Writing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Professional Text
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => window.history.back()} variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">CV Generator Pro</h1>
                <p className="text-xs text-blue-200">Live Preview • PDF Download • AI Writing</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={generatePDF}
            disabled={isGenerating || !cvData.personal.fullName}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-green-500/50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-6 h-6 text-purple-600" />
              <Label className="text-xl font-bold">Choose Your Template</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {CV_TEMPLATES.map(template => (
                <motion.button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-600 shadow-xl bg-blue-50 ring-4 ring-blue-200'
                      : 'border-slate-200 hover:border-blue-400 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{template.preview}</div>
                  <div className={`h-3 rounded-full bg-gradient-to-r ${template.gradient} mb-2 shadow-md`}></div>
                  <div className="text-sm font-bold text-slate-900">{template.name}</div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          
          <div className="space-y-6 h-fit">
            
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xl font-bold">👤 Personal Information</Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button variant="outline" size="sm" disabled={isUploading} asChild>
                        <span className="cursor-pointer">
                          {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                          Upload Photo
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">Full Name *</Label>
                    <Input
                      value={cvData.personal.fullName}
                      onChange={(e) => setCvData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, fullName: e.target.value }
                      }))}
                      placeholder="John Doe"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Professional Title *</Label>
                    <Input
                      value={cvData.personal.title}
                      onChange={(e) => setCvData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, title: e.target.value }
                      }))}
                      placeholder="Software Engineer"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Email</Label>
                    <Input
                      value={cvData.personal.email}
                      onChange={(e) => setCvData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, email: e.target.value }
                      }))}
                      placeholder="john@example.com"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Phone</Label>
                    <Input
                      value={cvData.personal.phone}
                      onChange={(e) => setCvData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, phone: e.target.value }
                      }))}
                      placeholder="+1 234 567 8900"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Location</Label>
                    <Input
                      value={cvData.personal.location}
                      onChange={(e) => setCvData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, location: e.target.value }
                      }))}
                      placeholder="New York, USA"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Website</Label>
                    <Input
                      value={cvData.personal.website}
                      onChange={(e) => setCvData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, website: e.target.value }
                      }))}
                      placeholder="www.johndoe.com"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-semibold">LinkedIn</Label>
                    <Input
                      value={cvData.personal.linkedin}
                      onChange={(e) => setCvData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, linkedin: e.target.value }
                      }))}
                      placeholder="linkedin.com/in/johndoe"
                      className="h-11"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Professional Summary</Label>
                    <Button
                      onClick={() => openAIAssistant('personal', null, 'summary')}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                      <Wand2 className="w-4 h-4 mr-1" />
                      AI Write
                    </Button>
                  </div>
                  <Textarea
                    value={cvData.personal.summary}
                    onChange={(e) => setCvData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, summary: e.target.value }
                    }))}
                    placeholder="Brief professional summary..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xl font-bold">💼 Work Experience</Label>
                  <Button onClick={addExperience} size="sm" className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {cvData.experience.map((exp) => (
                  <Card key={exp.id} className="bg-slate-50 border-2 border-slate-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => removeItem('experience', exp.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2">
                        <Input
                          placeholder="Job Title"
                          value={exp.title}
                          onChange={(e) => updateItem('experience', exp.id, 'title', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Location"
                          value={exp.location}
                          onChange={(e) => updateItem('experience', exp.id, 'location', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateItem('experience', exp.id, 'startDate', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          type="month"
                          value={exp.endDate}
                          onChange={(e) => updateItem('experience', exp.id, 'endDate', e.target.value)}
                          disabled={exp.current}
                          className="h-10"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateItem('experience', exp.id, 'current', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Currently working</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Description</Label>
                          <Button
                            onClick={() => openAIAssistant('experience', exp.id, 'description')}
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white h-8"
                          >
                            <Wand2 className="w-3 h-3 mr-1" />
                            AI Write
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Key achievements..."
                          value={exp.description}
                          onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xl font-bold">🎓 Education</Label>
                  <Button onClick={addEducation} size="sm" className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {cvData.education.map((edu) => (
                  <Card key={edu.id} className="bg-slate-50 border-2 border-slate-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => removeItem('education', edu.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2">
                        <Input
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => updateItem('education', edu.id, 'institution', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Location"
                          value={edu.location}
                          onChange={(e) => updateItem('education', edu.id, 'location', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Year"
                          value={edu.year}
                          onChange={(e) => updateItem('education', edu.id, 'year', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="GPA"
                          value={edu.gpa}
                          onChange={(e) => updateItem('education', edu.id, 'gpa', e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Achievements</Label>
                          <Button
                            onClick={() => openAIAssistant('education', edu.id, 'description')}
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white h-8"
                          >
                            <Wand2 className="w-3 h-3 mr-1" />
                            AI Write
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Honors, coursework..."
                          value={edu.description}
                          onChange={(e) => updateItem('education', edu.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-2xl bg-white/95 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold">⚡ Skills</Label>
                    <Button onClick={addSkill} size="sm" className="bg-blue-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {cvData.skills.map((skill) => (
                    <div key={skill.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Skill"
                        value={skill.name}
                        onChange={(e) => updateItem('skills', skill.id, 'name', e.target.value)}
                        className="h-10"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => updateItem('skills', skill.id, 'level', e.target.value)}
                        className="border rounded px-2 py-2 h-10 text-sm min-w-[120px]"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <Button
                        onClick={() => removeItem('skills', skill.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl bg-white/95 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold">🌍 Languages</Label>
                    <Button onClick={addLanguage} size="sm" className="bg-blue-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {cvData.languages.map((lang) => (
                    <div key={lang.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Language"
                        value={lang.name}
                        onChange={(e) => updateItem('languages', lang.id, 'name', e.target.value)}
                        className="h-10"
                      />
                      <select
                        value={lang.level}
                        onChange={(e) => updateItem('languages', lang.id, 'level', e.target.value)}
                        className="border rounded px-2 py-2 h-10 text-sm min-w-[120px]"
                      >
                        <option value="basic">Basic</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="fluent">Fluent</option>
                        <option value="native">Native</option>
                      </select>
                      <Button
                        onClick={() => removeItem('languages', lang.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xl font-bold">🏆 Certifications</Label>
                  <Button onClick={addCertification} size="sm" className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {cvData.certifications.map((cert) => (
                  <Card key={cert.id} className="bg-slate-50 border-2 border-slate-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => removeItem('certifications', cert.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        <Input
                          placeholder="Certification Name"
                          value={cert.name}
                          onChange={(e) => updateItem('certifications', cert.id, 'name', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Issuing Organization"
                          value={cert.issuer}
                          onChange={(e) => updateItem('certifications', cert.id, 'issuer', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Date (e.g., Jan 2024)"
                          value={cert.date}
                          onChange={(e) => updateItem('certifications', cert.id, 'date', e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="border-none shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="font-bold">Live Preview</span>
                <Badge className="bg-white/20 text-white ml-auto">Updates as you type</Badge>
              </div>
              <div className="p-4 bg-slate-100 max-h-[800px] overflow-y-auto">
                <div className="transform scale-[0.5] origin-top-left" style={{ width: '200%' }}>
                  <CVPreview data={cvData} template={selectedTemplate} photoUrl={photoUrl} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
