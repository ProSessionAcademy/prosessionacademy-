import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Sparkles,
  Download,
  CheckCircle2,
  BookOpen,
  Route,
  Upload
} from 'lucide-react';

const DESIGN_TEMPLATES = [
  { value: 'professional', label: 'Professional', bg: 'from-blue-600 to-indigo-600' },
  { value: 'modern', label: 'Modern', bg: 'from-purple-600 to-pink-600' },
  { value: 'elegant', label: 'Elegant', bg: 'from-slate-800 to-slate-600' },
  { value: 'creative', label: 'Creative', bg: 'from-orange-500 to-red-500' },
  { value: 'minimalist', label: 'Minimalist', bg: 'from-emerald-500 to-teal-500' }
];

export default function Certificates() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_type: 'course_completion',
    linked_course_id: '',
    linked_pathway_id: '',
    design_template: 'professional',
    primary_color: '#2563eb',
    secondary_color: '#8b5cf6',
    custom_message: '',
    signature_name: '',
    signature_title: '',
    logo_url: '',
    requirements: {
      min_score: 70,
      all_chapters: true,
      all_quizzes: true
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const { data: certificates = [] } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => base44.entities.Certificate.list('-created_date'),
    initialData: []
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
    initialData: []
  });

  const { data: pathways = [] } = useQuery({
    queryKey: ['pathways'],
    queryFn: () => base44.entities.Pathway.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Certificate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setShowDialog(false);
      resetForm();
      alert('✅ Certificaat aangemaakt!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Certificate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setShowDialog(false);
      resetForm();
      alert('✅ Certificaat bijgewerkt!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Certificate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      alert('✅ Certificaat verwijderd!');
    }
  });

  const handleGenerateAIMessage = async () => {
    const linkedItem = formData.template_type === 'course_completion' 
      ? courses.find(c => c.id === formData.linked_course_id)
      : pathways.find(p => p.id === formData.linked_pathway_id);

    if (!linkedItem) {
      alert('⚠️ Selecteer eerst een course of pathway!');
      return;
    }

    setGeneratingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Schrijf een professioneel, inspirerend certificaat bericht voor het voltooien van:

${formData.template_type === 'course_completion' ? 'COURSE' : 'PATHWAY'}: "${linkedItem.title}"
${linkedItem.description ? `Beschrijving: ${linkedItem.description}` : ''}

Schrijf een warm, motiverend bericht dat:
- De student feliciteert met hun prestatie
- De waarde van wat ze geleerd hebben benadrukt
- Hen motiveert om door te gaan met leren

Maximaal 60 woorden, professioneel en inspirerend.`
      });

      setFormData(prev => ({ ...prev, custom_message: result }));
    } catch (error) {
      alert('❌ AI generatie mislukt: ' + error.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
      alert('✅ Logo geüpload!');
    } catch (error) {
      alert('❌ Upload mislukt: ' + error.message);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('⚠️ Voer een titel in!');
      return;
    }

    if (editingCert) {
      updateMutation.mutate({ id: editingCert.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cert) => {
    setEditingCert(cert);
    setFormData(cert);
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingCert(null);
    setFormData({
      title: '',
      description: '',
      template_type: 'course_completion',
      linked_course_id: '',
      linked_pathway_id: '',
      design_template: 'professional',
      primary_color: '#2563eb',
      secondary_color: '#8b5cf6',
      custom_message: '',
      signature_name: '',
      signature_title: '',
      logo_url: '',
      requirements: {
        min_score: 70,
        all_chapters: true,
        all_quizzes: true
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Admin Toegang Vereist</h3>
            <p className="text-slate-600">Alleen admins kunnen certificaten beheren</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🏆 Certificaten Beheer
            </h1>
            <p className="text-lg text-slate-600">Maak AI-gegenereerde certificaten voor courses en pathways</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nieuw Certificaat
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => {
            const linkedItem = cert.template_type === 'course_completion'
              ? courses.find(c => c.id === cert.linked_course_id)
              : pathways.find(p => p.id === cert.linked_pathway_id);

            return (
              <Card key={cert.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className={`h-32 rounded-lg bg-gradient-to-br ${DESIGN_TEMPLATES.find(t => t.value === cert.design_template)?.bg || 'from-blue-600 to-purple-600'} flex items-center justify-center mb-4`}>
                    <Award className="w-16 h-16 text-white" />
                  </div>

                  <h3 className="font-bold text-xl mb-2">{cert.title}</h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{cert.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">
                      {cert.template_type === 'course_completion' ? (
                        <><BookOpen className="w-3 h-3 mr-1" />Course</>
                      ) : (
                        <><Route className="w-3 h-3 mr-1" />Pathway</>
                      )}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700">
                      {cert.issued_count || 0} uitgegeven
                    </Badge>
                  </div>

                  {linkedItem && (
                    <p className="text-xs text-slate-500 mb-4">
                      Gekoppeld aan: <span className="font-semibold">{linkedItem.title}</span>
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPreviewCert(cert)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => handleEdit(cert)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('Certificaat verwijderen?')) {
                          deleteMutation.mutate(cert.id);
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {certificates.length === 0 && (
          <Card className="border-none shadow-xl">
            <CardContent className="p-16 text-center">
              <Award className="w-20 h-20 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Geen certificaten</h3>
              <p className="text-slate-600 mb-6">Maak je eerste certificaat om te beginnen</p>
              <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-5 h-5 mr-2" />
                Certificaat Maken
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                {editingCert ? 'Certificaat Bewerken' : 'Nieuw Certificaat'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Titel *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="b.v. Marketing Excellence Certificaat"
                  />
                </div>

                <div>
                  <Label>Type *</Label>
                  <Select
                    value={formData.template_type}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      template_type: value,
                      linked_course_id: '',
                      linked_pathway_id: ''
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course_completion">Course Voltooiing</SelectItem>
                      <SelectItem value="pathway_completion">Pathway Voltooiing</SelectItem>
                      <SelectItem value="achievement">Prestatie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Beschrijving</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Waar is dit certificaat voor..."
                  rows={2}
                />
              </div>

              {formData.template_type === 'course_completion' && (
                <div>
                  <Label>Koppel aan Course *</Label>
                  <Select
                    value={formData.linked_course_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, linked_course_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.template_type === 'pathway_completion' && (
                <div>
                  <Label>Koppel aan Pathway *</Label>
                  <Select
                    value={formData.linked_pathway_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, linked_pathway_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer pathway..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pathways.map(pathway => (
                        <SelectItem key={pathway.id} value={pathway.id}>
                          {pathway.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Design Template</Label>
                  <Select
                    value={formData.design_template}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, design_template: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGN_TEMPLATES.map(template => (
                        <SelectItem key={template.value} value={template.value}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Primaire Kleur</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Aangepast Bericht</Label>
                  <Button
                    onClick={handleGenerateAIMessage}
                    disabled={generatingAI || (!formData.linked_course_id && !formData.linked_pathway_id)}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {generatingAI ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Genereren...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-1" />AI Genereren</>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={formData.custom_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_message: e.target.value }))}
                  placeholder="Felicitatie bericht op certificaat..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Handtekening Naam</Label>
                  <Input
                    value={formData.signature_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, signature_name: e.target.value }))}
                    placeholder="b.v. Dr. Jan Jansen"
                  />
                </div>

                <div>
                  <Label>Handtekening Titel</Label>
                  <Input
                    value={formData.signature_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, signature_title: e.target.value }))}
                    placeholder="b.v. Directeur Opleidingen"
                  />
                </div>
              </div>

              <div>
                <Label>Logo Upload</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button variant="outline" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </span>
                    </Button>
                  </label>
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Logo" className="h-12 w-12 object-contain border rounded" />
                  )}
                </div>
              </div>

              <Card className="bg-purple-50 border-2 border-purple-200">
                <CardContent className="p-4">
                  <h4 className="font-bold text-purple-900 mb-3">Vereisten</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Minimum Score (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.requirements.min_score}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, min_score: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requirements.all_chapters}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, all_chapters: e.target.checked }
                        }))}
                        className="w-4 h-4"
                      />
                      <Label className="text-sm">Alle hoofdstukken voltooien</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requirements.all_quizzes}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, all_quizzes: e.target.checked }
                        }))}
                        className="w-4 h-4"
                      />
                      <Label className="text-sm">Alle quizzen voltooien</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {editingCert ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewCert} onOpenChange={() => setPreviewCert(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Certificaat Preview</DialogTitle>
            </DialogHeader>
            {previewCert && (
              <div className={`aspect-[1.4/1] rounded-xl bg-gradient-to-br ${DESIGN_TEMPLATES.find(t => t.value === previewCert.design_template)?.bg || 'from-blue-600 to-purple-600'} p-12 text-white relative`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
                </div>

                <div className="relative text-center">
                  {previewCert.logo_url && (
                    <img src={previewCert.logo_url} alt="Logo" className="h-16 mx-auto mb-6" />
                  )}
                  
                  <h2 className="text-5xl font-black mb-8">CERTIFICAAT</h2>
                  <p className="text-xl mb-8 opacity-90">Dit certificeert dat</p>
                  <h3 className="text-4xl font-bold mb-8">[Student Naam]</h3>
                  <p className="text-xl mb-4 opacity-90">succesvol heeft voltooid</p>
                  <h4 className="text-3xl font-bold mb-8">{previewCert.title}</h4>
                  
                  {previewCert.custom_message && (
                    <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90 italic">
                      "{previewCert.custom_message}"
                    </p>
                  )}

                  <div className="mt-12 flex justify-around items-end">
                    {previewCert.signature_name && (
                      <div>
                        <div className="border-t-2 border-white w-48 mb-2"></div>
                        <p className="font-bold">{previewCert.signature_name}</p>
                        {previewCert.signature_title && (
                          <p className="text-sm opacity-80">{previewCert.signature_title}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="border-t-2 border-white w-48 mb-2"></div>
                      <p className="font-bold">Datum</p>
                      <p className="text-sm opacity-80">{new Date().toLocaleDateString('nl-NL')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}