import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  Wand2,
  FileText,
  RotateCcw,
  ImageIcon,
  Sliders,
  ChevronDown,
  Gamepad2,
  Upload,
  Save,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Eye,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AIChapterBuilder() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [step, setStep] = useState('setup');

  const [aiForm, setAiForm] = useState({
    courseInfo: '',
    numQuizzes: 3,
    numFlipCards: 5,
    numImages: 2,
    numSliders: 0,
    numExpandables: 2,
    numTextBlocks: 3
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedChapters, setGeneratedChapters] = useState([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
    initialData: []
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseIdFromUrl = urlParams.get('courseId');

    if (courseIdFromUrl && courses.length > 0 && !selectedCourse) {
      const course = courses.find(c => c.id === courseIdFromUrl);
      if (course) {
        setSelectedCourse(course);
        const autoInfo = `Course: ${course.title}

Description: ${course.description || ''}

Category: ${course.category?.replace(/_/g, ' ') || ''}
Level: ${course.level || ''}
${course.instructor ? `Instructor: ${course.instructor}` : ''}`;

        setAiForm(prev => ({
          ...prev,
          courseInfo: autoInfo
        }));
      }
    }
  }, [courses, selectedCourse]);

  const createChaptersMutation = useMutation({
    mutationFn: async (chapters) => {
      const results = [];
      for (const chapter of chapters) {
        const created = await base44.entities.Chapter.create(chapter);
        results.push(created);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseChapters'] });
      setStep('done');
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const fileUrls = [];
      for (let file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrls.push({ name: file.name, url: file_url });
      }
      setUploadedFiles([...uploadedFiles, ...fileUrls]);
      alert(`✅ ${files.length} bestand(en) geüpload!`);
    } catch (error) {
      alert('❌ Upload mislukt: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const validateGeneration = (chapters) => {
    const errors = [];

    let totalQuizzes = 0;
    let totalFlipCards = 0;
    let totalImages = 0;
    let totalSliders = 0;
    let totalExpandables = 0;
    let totalTextBlocks = 0;

    chapters.forEach((chapter) => {
      if (!chapter.content_blocks || !Array.isArray(chapter.content_blocks)) {
        return;
      }

      chapter.content_blocks.forEach(block => {
        if (block.type === 'quiz') totalQuizzes++;
        else if (block.type === 'flip_cards') {
          const cards = block.data?.cards || [];
          totalFlipCards += cards.length;
        }
        else if (block.type === 'image') totalImages++;
        else if (block.type === 'slider') totalSliders++;
        else if (block.type === 'expandable') totalExpandables++;
        else if (block.type === 'text') totalTextBlocks++;
      });
    });

    if (totalQuizzes !== aiForm.numQuizzes) {
      errors.push(`❌ Quizzes: gevraagd ${aiForm.numQuizzes}, gekregen ${totalQuizzes}`);
    }
    if (totalFlipCards !== aiForm.numFlipCards) {
      errors.push(`❌ Flip Cards: gevraagd ${aiForm.numFlipCards}, gekregen ${totalFlipCards}`);
    }
    if (totalImages !== aiForm.numImages) {
      errors.push(`❌ Images: gevraagd ${aiForm.numImages}, gekregen ${totalImages}`);
    }
    if (totalSliders !== aiForm.numSliders) {
      errors.push(`❌ Sliders: gevraagd ${aiForm.numSliders}, gekregen ${totalSliders}`);
    }
    if (totalExpandables !== aiForm.numExpandables) {
      errors.push(`❌ Expandables: gevraagd ${aiForm.numExpandables}, gekregen ${totalExpandables}`);
    }
    if (totalTextBlocks !== aiForm.numTextBlocks) {
      errors.push(`❌ Text Blocks: gevraagd ${aiForm.numTextBlocks}, gekregen ${totalTextBlocks}`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const generateChapters = async () => {
    if (!selectedCourse) {
      alert('⚠️ Selecteer eerst een course!');
      return;
    }

    if (!aiForm.courseInfo.trim() && uploadedFiles.length === 0) {
      alert('⚠️ Vul course info in OF upload bestanden!');
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('🚀 AI wordt voorbereid...');
    setStep('generating');
    setValidationErrors([]);

    try {
      const totalItems = aiForm.numQuizzes + aiForm.numFlipCards + aiForm.numImages + 
                        aiForm.numSliders + aiForm.numExpandables + aiForm.numTextBlocks;
      const numChapters = Math.min(5, Math.max(3, Math.ceil(totalItems / 8)));

      setGenerationProgress(10);
      setGenerationStatus(`📊 ${numChapters} chapters met ${totalItems} items...`);

      // 🔥 SIMPLIFIED PROMPT - NO POST-PROCESSING, AI MUST DO EVERYTHING
      const prompt = `Create ${numChapters} educational chapters for: "${selectedCourse.title}"

${uploadedFiles.length > 0 ? `📁 FILES: ${uploadedFiles.map(f => f.name).join(', ')}` : ''}
📝 COURSE: ${aiForm.courseInfo}

🎯 EXACT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━
YOU MUST CREATE:
✓ ${aiForm.numQuizzes} quiz blocks (multiple choice questions with REAL content)
✓ ${aiForm.numFlipCards} flip cards (terms/definitions, group 2-4 per flip_cards block)
✓ ${aiForm.numImages} image blocks (Unsplash URLs)
✓ ${aiForm.numSliders} slider blocks (factual questions)
✓ ${aiForm.numExpandables} expandable sections
✓ ${aiForm.numTextBlocks} text paragraphs

⚠️ CRITICAL: CREATE REAL EDUCATIONAL CONTENT!
❌ NO placeholders like "Definition for term 1"
❌ NO generic content like "Additional question"
✅ REAL course-specific content ONLY

FORMATS:
quiz: {"type":"quiz","order":1,"data":{"question":"[REAL QUESTION]","options":["A","B","C","D"],"correct_answer":0,"explanation":"[WHY]"}}
flip_cards: {"type":"flip_cards","order":2,"data":{"cards":[{"frontText":"[TERM]","backText":"[DEFINITION]","frontImage":"","backImage":""}]}}
image: {"type":"image","order":3,"data":{"url":"https://source.unsplash.com/1200x800/?[TOPIC]","caption":"[DESC]"}}
slider: {"type":"slider","order":4,"data":{"question":"[FACTUAL QUESTION]","minValue":0,"maxValue":100,"correctAnswer":50,"unit":"%"}}
expandable: {"type":"expandable","order":5,"data":{"title":"[TOPIC]","content":"[DETAILED EXPLANATION]"}}
text: {"type":"text","order":6,"data":{"content":"[EDUCATIONAL PARAGRAPH]"}}

Distribute items evenly across ${numChapters} chapters. Make content engaging and educational.`;

      setGenerationProgress(40);
      setGenerationStatus('🤖 AI genereert content...');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            chapters: {
              type: "array",
              minItems: numChapters,
              maxItems: numChapters,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  duration_minutes: { type: "number", minimum: 15, maximum: 90 },
                  content_blocks: {
                    type: "array",
                    minItems: Math.max(1, Math.floor(totalItems / numChapters) - 1),
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["text", "quiz", "flip_cards", "image", "slider", "expandable"] },
                        order: { type: "number" },
                        data: { 
                          type: "object",
                          additionalProperties: true
                        }
                      },
                      required: ["type", "order", "data"]
                    }
                  }
                },
                required: ["title", "content_blocks"]
              }
            }
          },
          required: ["chapters"]
        }
      });

      setGenerationProgress(90);
      setGenerationStatus('✅ Valideren...');

      if (!result.chapters || result.chapters.length === 0) {
        throw new Error('AI genereerde geen chapters!');
      }

      validateGeneration(result.chapters);

      setGenerationProgress(100);
      setGenerationStatus('🎉 Klaar!');

      setGeneratedChapters(result.chapters);
      setStep('preview');

    } catch (error) {
      console.error('Generation error:', error);
      alert('❌ Error: ' + error.message);
      setStep('setup');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveChapters = async () => {
    if (generatedChapters.length === 0) return;

    const chaptersToSave = generatedChapters.map((chapter, idx) => ({
      course_id: selectedCourse.id,
      title: chapter.title,
      description: chapter.description || '',
      order: idx + 1,
      duration_minutes: chapter.duration_minutes || 30,
      content_blocks: chapter.content_blocks || []
    }));

    try {
      await createChaptersMutation.mutateAsync(chaptersToSave);
      alert(`✅ ${chaptersToSave.length} chapters opgeslagen!`);
    } catch (error) {
      alert('❌ Fout: ' + error.message);
    }
  };

  const resetAll = () => {
    setStep('setup');
    setGeneratedChapters([]);
    setValidationErrors([]);
    setUploadedFiles([]);
    setAiForm({
      courseInfo: '',
      numQuizzes: 3,
      numFlipCards: 5,
      numImages: 2,
      numSliders: 0,
      numExpandables: 2,
      numTextBlocks: 3
    });
  };

  // Setup screen
  if (step === 'setup') {
    const urlParams = new URLSearchParams(window.location.search);
    const courseIdFromUrl = urlParams.get('courseId');
    const isAutoSelected = !!courseIdFromUrl && !!selectedCourse && selectedCourse.id === courseIdFromUrl;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Chapter Builder</h1>
            <p className="text-xl text-slate-600">Maak interactive chapters met AI</p>
          </div>

          <Card className="border-none shadow-2xl bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="text-2xl">Setup</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Course Selection */}
              {isAutoSelected ? (
                <div>
                  <Label className="text-lg font-bold mb-3 block text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    ✅ Course Automatisch Geselecteerd
                  </Label>
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-400">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-green-900 text-2xl mb-1">{selectedCourse.title}</p>
                          <p className="text-green-700 text-sm">{selectedCourse.description}</p>
                          <Badge className="mt-2 bg-green-600 text-white">
                            {selectedCourse.category?.replace(/_/g, ' ')} • {selectedCourse.level}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div>
                  <Label className="text-lg font-bold mb-2 block">Selecteer Course *</Label>
                  <Select value={selectedCourse?.id || ''} onValueChange={(id) => {
                    const course = courses.find(c => c.id === id);
                    setSelectedCourse(course);
                    if (course) {
                      setAiForm(prev => ({
                        ...prev,
                        courseInfo: `Course: ${course.title}\n\n${course.description || ''}`
                      }));
                    }
                  }}>
                    <SelectTrigger className="border-2 h-14 text-lg">
                      <SelectValue placeholder="Kies een course..." />
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

              {/* Course Info */}
              <div>
                <Label className="text-lg font-bold mb-2 block">Course Details</Label>
                <Textarea
                  value={aiForm.courseInfo}
                  onChange={(e) => setAiForm({ ...aiForm, courseInfo: e.target.value })}
                  placeholder="Beschrijf de course..."
                  rows={6}
                  className="text-base"
                />
              </div>

              {/* File Upload */}
              <Card className="bg-blue-50 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">📁 Upload Studiemateriaal (Optioneel)</CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`block border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      uploading ? 'opacity-50' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-100'
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-semibold">Klik om te uploaden</p>
                      </>
                    )}
                  </label>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                          <span className="text-sm">{file.name}</span>
                          <Button onClick={() => removeFile(idx)} variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Config */}
              <Card className="bg-purple-50 border-2 border-purple-300">
                <CardHeader>
                  <CardTitle>Content Configuratie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Quizzes</Label>
                      <Input
                        type="number"
                        min="0"
                        value={aiForm.numQuizzes}
                        onChange={(e) => setAiForm({ ...aiForm, numQuizzes: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div>
                      <Label>Flip Cards</Label>
                      <Input
                        type="number"
                        min="0"
                        value={aiForm.numFlipCards}
                        onChange={(e) => setAiForm({ ...aiForm, numFlipCards: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div>
                      <Label>Images</Label>
                      <Input
                        type="number"
                        min="0"
                        value={aiForm.numImages}
                        onChange={(e) => setAiForm({ ...aiForm, numImages: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div>
                      <Label>Sliders</Label>
                      <Input
                        type="number"
                        min="0"
                        value={aiForm.numSliders}
                        onChange={(e) => setAiForm({ ...aiForm, numSliders: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div>
                      <Label>Expandables</Label>
                      <Input
                        type="number"
                        min="0"
                        value={aiForm.numExpandables}
                        onChange={(e) => setAiForm({ ...aiForm, numExpandables: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div>
                      <Label>Text Blocks</Label>
                      <Input
                        type="number"
                        min="0"
                        value={aiForm.numTextBlocks}
                        onChange={(e) => setAiForm({ ...aiForm, numTextBlocks: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={generateChapters}
                disabled={!selectedCourse || (!aiForm.courseInfo.trim() && uploadedFiles.length === 0)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-8 text-2xl font-bold"
                size="lg"
              >
                <Sparkles className="w-8 h-8 mr-3" />
                Genereer Chapters
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <Card className="max-w-xl w-full">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-20 h-20 text-purple-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-3xl font-bold mb-4">{generationStatus}</h2>
            <Progress value={generationProgress} className="h-4 mb-4" />
            <p className="text-2xl font-bold text-purple-600">{generationProgress}%</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-none shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="text-3xl">
                <Eye className="w-8 h-8 inline mr-3" />
                Preview - {generatedChapters.length} Chapters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {validationErrors.length > 0 ? (
                <Alert className="mb-6 bg-orange-50 border-2 border-orange-500">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <AlertDescription>
                    <p className="font-bold text-orange-900 mb-2">⚠️ AI heeft niet exact geleverd:</p>
                    {validationErrors.map((err, idx) => (
                      <p key={idx} className="text-orange-800">{err}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-6 bg-green-50 border-2 border-green-500">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <AlertDescription className="text-green-900 font-bold text-lg">
                    ✅ Perfect! Alle aantallen kloppen!
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 mb-8">
                {generatedChapters.map((chapter, idx) => (
                  <Card key={idx} className="border-2">
                    <CardHeader className="bg-slate-50">
                      <CardTitle>Chapter {idx + 1}: {chapter.title}</CardTitle>
                      <p className="text-sm text-slate-600">{chapter.description}</p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex gap-2 flex-wrap">
                        {chapter.content_blocks?.map((block, blockIdx) => (
                          <Badge key={blockIdx} variant="outline">
                            {block.type}
                            {block.type === 'flip_cards' && ` (${block.data?.cards?.length || 0})`}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 mt-3">
                        {chapter.content_blocks?.length || 0} blocks • {chapter.duration_minutes || 30} min
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4">
                <Button onClick={resetAll} variant="outline" className="flex-1 py-6 text-lg">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Opnieuw
                </Button>
                <Button
                  onClick={handleSaveChapters}
                  className="flex-1 bg-green-600 py-6 text-lg font-bold"
                  disabled={createChaptersMutation.isPending}
                >
                  {createChaptersMutation.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-24 h-24 text-green-600 mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-slate-900 mb-4">✅ Klaar!</h1>
            <p className="text-2xl text-slate-600 mb-8">
              {generatedChapters.length} chapters opgeslagen!
            </p>
            <div className="flex gap-4">
              <Button onClick={resetAll} variant="outline" className="flex-1 py-6">
                Nog Een Maken
              </Button>
              <Link to={createPageUrl("CourseAdmin")} className="flex-1">
                <Button className="w-full bg-green-600 py-6">
                  Naar Course Admin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}