
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  ChevronRight,
  Save,
  Volume2,
  Mic,
  ArrowLeft,
  FileText,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Video,
  RotateCcw,
  ChevronDown,
  Sliders,
  Gamepad2,
  Shield,
  AlertTriangle,
  Building2,
  Globe,
  Crown,
  Sparkles,
  Loader2,
  Wand2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CourseAdmin() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourseForChapters, setSelectedCourseForChapters] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'self_development',
    level: 'beginner',
    thumbnail_url: '',
    instructor: '',
    duration_hours: 0,
    published: true,
    is_student_course: false,
    voice_intro_url: '',
    group_id: null,
    is_group_course: false
  });
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    order: 1,
    duration_minutes: 30,
    content_blocks: []
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Allow super_admin, supervisor_admin, AND top_tier_admin
        if (currentUser.admin_level !== 'super_admin' && 
            currentUser.admin_level !== 'supervisor_admin' && 
            currentUser.admin_level !== 'top_tier_admin') {
          alert("⛔ Access denied! You need admin permissions.");
          window.location.href = createPageUrl("Dashboard");
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        window.location.href = createPageUrl("Dashboard");
      }
    };
    fetchUser();
  }, []);

  const canDelete = user?.admin_level === 'super_admin' || user?.admin_level === 'top_tier_admin';
  const isSupervisorAdmin = user?.admin_level === 'supervisor_admin';
  const isSuperAdmin = user?.admin_level === 'super_admin';
  const isTopTierAdmin = user?.admin_level === 'top_tier_admin';

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['allCourses'],
    queryFn: async () => {
      const allCourses = await base44.entities.Course.list('-created_date');
      
      // Filter based on admin level
      if (isSupervisorAdmin) {
        // Supervisor admins can VIEW all courses, but only EDIT their assigned group courses
        // We'll show all courses, but disable edit for non-assigned groups
        return allCourses;
      } else if (isSuperAdmin || isTopTierAdmin) {
        if (user.can_access_all_groups || isTopTierAdmin) {
          return allCourses; 
        } else {
          const assignedGroups = user.assigned_groups || [];
          return allCourses.filter(c => {
            return !c.is_group_course || assignedGroups.includes(c.group_id);
          });
        }
      }
      return allCourses;
    },
    initialData: [],
    enabled: !!user
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['courseChapters', selectedCourseForChapters?.id],
    queryFn: async () => {
      if (!selectedCourseForChapters?.id) return [];
      const result = await base44.entities.Chapter.filter({ course_id: selectedCourseForChapters.id }, 'order');
      return result || [];
    },
    enabled: !!selectedCourseForChapters?.id,
    initialData: []
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const allGroups = await base44.entities.Group.list();
      
      // Filter groups based on admin's assigned groups
      if (isSupervisorAdmin) {
        // Supervisors can only create courses in their assigned groups
        const assignedGroups = user.assigned_groups || [];
        return allGroups.filter(g => assignedGroups.includes(g.id));
      } else if ((isSuperAdmin || isTopTierAdmin) && !user.can_access_all_groups) {
        const assignedGroups = user.assigned_groups || [];
        return allGroups.filter(g => assignedGroups.includes(g.id));
      }
      return allGroups;
    },
    initialData: [],
    enabled: !!user
  });

  const createCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
      setShowCourseDialog(false);
      resetCourseForm();
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
      setShowCourseDialog(false);
      resetCourseForm();
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => {
      if (!canDelete) {
        throw new Error("Only Super Admins or Top Tier Admins can delete courses");
      }
      return base44.entities.Course.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: (data) => base44.entities.Chapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseChapters'] });
      setShowChapterDialog(false);
      resetChapterForm();
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id) => base44.entities.Chapter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseChapters'] });
    },
  });

  const resetCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({
      title: '',
      description: '',
      category: 'self_development',
      level: 'beginner',
      thumbnail_url: '',
      instructor: '',
      duration_hours: 0,
      published: true,
      is_student_course: false,
      voice_intro_url: '',
      group_id: null,
      is_group_course: false
    });
  };

  const resetChapterForm = () => {
    setChapterForm({
      title: '',
      description: '',
      order: chapters.length + 1,
      duration_minutes: 30,
      content_blocks: []
    });
  };

  const handleSaveCourse = () => {
    // Validate for Supervisor Admins
    if (isSupervisorAdmin) {
      if (!courseForm.is_group_course || !courseForm.group_id) {
        alert('⛔ As a Supervisor Admin, you must assign courses to one of your groups!\n\nYou cannot create global courses.');
        return;
      }
      
      const assignedGroups = user.assigned_groups || [];
      if (!assignedGroups.includes(courseForm.group_id)) {
        alert('⛔ You can only create courses in your assigned groups!');
        return;
      }
    }

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };

  const handleSaveChapter = () => {
    const chapterData = {
      ...chapterForm,
      course_id: selectedCourseForChapters.id
    };
    createChapterMutation.mutate(chapterData);
  };

  const handleEditCourse = (course) => {
    // Check if supervisor can edit this course
    if (isSupervisorAdmin) {
      const assignedGroups = user.assigned_groups || [];
      if (!course.is_group_course) {
        alert('⛔ As a Supervisor Admin, you can only edit group-specific courses, not global courses!');
        return;
      }
      if (!assignedGroups.includes(course.group_id)) {
        alert('⛔ As a Supervisor Admin, you can only edit courses in your assigned groups!');
        return;
      }
    }
    
    setEditingCourse(course);
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'self_development',
      level: course.level || 'beginner',
      thumbnail_url: course.thumbnail_url || '',
      instructor: course.instructor || '',
      duration_hours: course.duration_hours || 0,
      published: course.published !== undefined ? course.published : true,
      is_student_course: course.is_student_course || false,
      voice_intro_url: course.voice_intro_url || '',
      group_id: course.group_id || null,
      is_group_course: course.is_group_course || false
    });
    setShowCourseDialog(true);
  };

  const handleDeleteCourse = (id) => {
    if (!canDelete) {
      alert('⛔ Only Super Admins or Top Tier Admins can delete courses!');
      return;
    }
    // Additional check for supervisor if they were allowed to delete their own, but currently they can't delete anything anyway
    // If we wanted to allow supervisors to delete courses they can edit:
    // const courseToDelete = courses.find(c => c.id === id);
    // const canEditThisCourse = isSupervisorAdmin ? 
    //   (courseToDelete?.is_group_course && user.assigned_groups?.includes(courseToDelete.group_id)) : 
    //   true;
    // if (!canEditThisCourse) {
    //   alert('⛔ You can only delete courses in your assigned groups!');
    //   return;
    // }

    if (confirm('Are you sure you want to delete this course?')) {
      deleteCourseMutation.mutate(id);
    }
  };

  const handleDeleteChapter = (chapterId) => {
    if (confirm("Are you sure you want to delete this chapter?")) {
      deleteChapterMutation.mutate(chapterId);
    }
  };

  const handleUploadVoice = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCourseForm({ ...courseForm, voice_intro_url: file_url });
      alert('✅ Voice file uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload voice file');
    }
  };

  // CONTENT BLOCK FUNCTIONS
  const getDefaultDataForType = (type) => {
    switch(type) {
      case 'text':
        return { content: '' };
      case 'video':
        return { url: '' };
      case 'flip_cards':
        return { cards: [{ frontText: '', backText: '', frontImage: '', backImage: '' }] };
      case 'expandable':
        return { title: '', content: '', image: '' };
      case 'image':
        return { url: '', caption: '' };
      case 'slider':
        return { question: '', minValue: 0, maxValue: 100, correctAnswer: 50, unit: '' };
      case 'quiz':
        return { question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' };
      default:
        return {};
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      type,
      order: chapterForm.content_blocks.length + 1,
      data: getDefaultDataForType(type)
    };
    setChapterForm({
      ...chapterForm,
      content_blocks: [...chapterForm.content_blocks, newBlock]
    });
  };

  const updateBlock = (index, field, value) => {
    const updated = [...chapterForm.content_blocks];
    updated[index].data[field] = value;
    setChapterForm({ ...chapterForm, content_blocks: updated });
  };

  const deleteBlock = (index) => {
    setChapterForm({
      ...chapterForm,
      content_blocks: chapterForm.content_blocks.filter((_, i) => i !== index)
    });
  };

  const moveBlock = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= chapterForm.content_blocks.length) return;
    
    const updated = [...chapterForm.content_blocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setChapterForm({ ...chapterForm, content_blocks: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If viewing chapters for a specific course
  if (selectedCourseForChapters) {
    return (
      <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="ghost"
                onClick={() => setSelectedCourseForChapters(null)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
              <h1 className="text-3xl font-bold text-slate-900">{selectedCourseForChapters.title}</h1>
              <p className="text-slate-600 mt-1">Manage course chapters</p>
            </div>
            <div className="flex gap-3">
              <a href={`${createPageUrl("AIChapterBuilder")}?courseId=${selectedCourseForChapters.id}`}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </a>
              <Button
                onClick={() => {
                  resetChapterForm();
                  setShowChapterDialog(true);
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Chapter
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {chapters.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No chapters yet. Click "Add Chapter" to create your first chapter!</p>
                </CardContent>
              </Card>
            ) : (
              chapters.map((chapter, idx) => (
                <Card key={chapter.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {chapter.order || idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">{chapter.title}</h3>
                        <p className="text-slate-600 text-sm">{chapter.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{chapter.duration_minutes || 0} min</Badge>
                          <Badge variant="outline">{chapter.content_blocks?.length || 0} blocks</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`ChapterBuilder?chapterId=${chapter.id}&courseId=${selectedCourseForChapters.id}`)}>
                          <Button variant="outline" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* FULL CHAPTER BUILDER DIALOG */}
        <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Chapter</DialogTitle>
              <DialogDescription>
                Create chapter with title, description, and content blocks (text, flip cards, quizzes, etc.)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <Card className="bg-slate-50">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Chapter Title</Label>
                    <Input
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                      placeholder="e.g., Introduction to Sales"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={chapterForm.description}
                      onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                      placeholder="Brief description..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Chapter Order</Label>
                      <Input
                        type="number"
                        value={chapterForm.order}
                        onChange={(e) => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>

                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={chapterForm.duration_minutes}
                        onChange={(e) => setChapterForm({ ...chapterForm, duration_minutes: parseInt(e.target.value) || 30 })}
                        min="1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Content Blocks */}
              <Card className="bg-blue-50 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">Add Content Blocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button onClick={() => addBlock('text')} variant="outline" className="h-20 flex flex-col gap-2">
                      <FileText className="w-6 h-6" />
                      Text
                    </Button>
                    <Button onClick={() => addBlock('flip_cards')} variant="outline" className="h-20 flex flex-col gap-2">
                      <RotateCcw className="w-6 h-6" />
                      Flip Cards
                    </Button>
                    <Button onClick={() => addBlock('expandable')} variant="outline" className="h-20 flex flex-col gap-2">
                      <ChevronDown className="w-6 h-6" />
                      Expandable
                    </Button>
                    <Button onClick={() => addBlock('image')} variant="outline" className="h-20 flex flex-col gap-2">
                      <ImageIcon className="w-6 h-6" />
                      Image
                    </Button>
                    <Button onClick={() => addBlock('video')} variant="outline" className="h-20 flex flex-col gap-2">
                      <Video className="w-6 h-6" />
                      Video
                    </Button>
                    <Button onClick={() => addBlock('slider')} variant="outline" className="h-20 flex flex-col gap-2">
                      <Sliders className="w-6 h-6" />
                      Slider Quiz
                    </Button>
                    <Button onClick={() => addBlock('quiz')} variant="outline" className="h-20 flex flex-col gap-2">
                      <Gamepad2 className="w-6 h-6" />
                      Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Content Blocks List */}
              <div className="space-y-4">
                {chapterForm.content_blocks.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-slate-500">
                      No content blocks yet. Click above to add blocks!
                    </CardContent>
                  </Card>
                )}

                {chapterForm.content_blocks.map((block, index) => (
                  <Card key={index} className="border-2 border-blue-200">
                    <CardHeader className="bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge>{block.type}</Badge>
                          <span className="text-sm text-slate-600">Block {index + 1}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => moveBlock(index, 'down')} disabled={index === chapterForm.content_blocks.length - 1}>
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteBlock(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {/* TEXT BLOCK */}
                      {block.type === 'text' && (
                        <div>
                          <Label>Text Content</Label>
                          <Textarea
                            value={block.data.content || ''}
                            onChange={(e) => updateBlock(index, 'content', e.target.value)}
                            rows={8}
                            placeholder="Enter text..."
                          />
                        </div>
                      )}

                      {/* FLIP CARDS */}
                      {block.type === 'flip_cards' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Flip Cards ({block.data.cards?.length || 0})</Label>
                            <Button
                              size="sm"
                              onClick={() => {
                                const newCards = [...(block.data.cards || []), { frontText: '', backText: '', frontImage: '', backImage: '' }];
                                updateBlock(index, 'cards', newCards);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Card
                            </Button>
                          </div>
                          {block.data.cards?.map((card, cardIdx) => (
                            <Card key={cardIdx} className="p-4 bg-slate-50">
                              <div className="flex items-start justify-between mb-3">
                                <p className="font-semibold text-sm">Card {cardIdx + 1}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const newCards = block.data.cards.filter((_, i) => i !== cardIdx);
                                    updateBlock(index, 'cards', newCards);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs">Front Text</Label>
                                  <Input
                                    value={card.frontText || ''}
                                    onChange={(e) => {
                                      const newCards = [...block.data.cards];
                                      newCards[cardIdx].frontText = e.target.value;
                                      updateBlock(index, 'cards', newCards);
                                    }}
                                    placeholder="Front"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Back Text</Label>
                                  <Textarea
                                    value={card.backText || ''}
                                    onChange={(e) => {
                                      const newCards = [...block.data.cards];
                                      newCards[cardIdx].backText = e.target.value;
                                      updateBlock(index, 'cards', newCards);
                                    }}
                                    placeholder="Back"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* EXPANDABLE */}
                      {block.type === 'expandable' && (
                        <div className="space-y-3">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={block.data.title || ''}
                              onChange={(e) => updateBlock(index, 'title', e.target.value)}
                              placeholder="Section title"
                            />
                          </div>
                          <div>
                            <Label>Content</Label>
                            <Textarea
                              value={block.data.content || ''}
                              onChange={(e) => updateBlock(index, 'content', e.target.value)}
                              rows={5}
                              placeholder="Content..."
                            />
                          </div>
                        </div>
                      )}

                      {/* IMAGE */}
                      {block.type === 'image' && (
                        <div className="space-y-3">
                          <div>
                            <Label>Image URL</Label>
                            <Input
                              value={block.data.url || ''}
                              onChange={(e) => updateBlock(index, 'url', e.target.value)}
                              placeholder="Image URL"
                            />
                          </div>
                          <div>
                            <Label>Caption</Label>
                            <Input
                              value={block.data.caption || ''}
                              onChange={(e) => updateBlock(index, 'caption', e.target.value)}
                              placeholder="Caption"
                            />
                          </div>
                          {block.data.url && (
                            <img src={block.data.url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                          )}
                        </div>
                      )}

                      {/* VIDEO */}
                      {block.type === 'video' && (
                        <div>
                          <Label>Video URL</Label>
                          <Input
                            value={block.data.url || ''}
                            onChange={(e) => updateBlock(index, 'url', e.target.value)}
                            placeholder="YouTube, Vimeo, or video URL"
                          />
                        </div>
                      )}

                      {/* SLIDER */}
                      {block.type === 'slider' && (
                        <div className="space-y-3">
                          <div>
                            <Label>Question</Label>
                            <Input
                              value={block.data.question || ''}
                              onChange={(e) => updateBlock(index, 'question', e.target.value)}
                              placeholder="Question"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Min Value</Label>
                              <Input
                                type="number"
                                value={block.data.minValue || 0}
                                onChange={(e) => updateBlock(index, 'minValue', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label>Max Value</Label>
                              <Input
                                type="number"
                                value={block.data.maxValue || 100}
                                onChange={(e) => updateBlock(index, 'maxValue', parseInt(e.target.value) || 100)}
                              />
                            </div>
                            <div>
                              <Label>Correct Answer</Label>
                              <Input
                                type="number"
                                value={block.data.correctAnswer || 50}
                                onChange={(e) => updateBlock(index, 'correctAnswer', parseInt(e.target.value) || 50)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              value={block.data.unit || ''}
                              onChange={(e) => updateBlock(index, 'unit', e.target.value)}
                              placeholder="%, km, etc."
                            />
                          </div>
                        </div>
                      )}

                      {/* QUIZ */}
                      {block.type === 'quiz' && (
                        <div className="space-y-3">
                          <div>
                            <Label>Question</Label>
                            <Input
                              value={block.data.question || ''}
                              onChange={(e) => updateBlock(index, 'question', e.target.value)}
                              placeholder="Quiz question"
                            />
                          </div>
                          <div>
                            <Label>Options</Label>
                            {(block.data.options || ['', '', '', '']).map((option, optIdx) => (
                              <div key={optIdx} className="flex gap-2 mb-2">
                                <input
                                  type="radio"
                                  name={`correct-${index}`}
                                  checked={block.data.correct_answer === optIdx}
                                  onChange={() => updateBlock(index, 'correct_answer', optIdx)}
                                  className="mt-2"
                                />
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(block.data.options || ['', '', '', ''])];
                                    newOptions[optIdx] = e.target.value;
                                    updateBlock(index, 'options', newOptions);
                                  }}
                                  placeholder={`Option ${optIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                          <div>
                            <Label>Explanation</Label>
                            <Textarea
                              value={block.data.explanation || ''}
                              onChange={(e) => updateBlock(index, 'explanation', e.target.value)}
                              rows={2}
                              placeholder="Explain answer"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowChapterDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveChapter} className="bg-gradient-to-r from-green-600 to-emerald-600">
                <Save className="w-4 h-4 mr-2" />
                Create Chapter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {isTopTierAdmin && (
          <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-yellow-600 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-semibold text-yellow-900">Top Tier Admin - Full Course Control</p>
                  <p className="text-sm text-yellow-700">You have complete access to create, edit, and delete all courses.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isSupervisorAdmin && (
          <Card className="border-l-4 border-l-purple-500 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-900">Supervisor Admin - Group-Specific Access</p>
                  <p className="text-sm text-purple-700">
                    You can VIEW all courses, but can only CREATE/EDIT courses in your assigned groups:
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {groups.map(g => (
                      <Badge key={g.id} variant="outline" className="bg-white">{g.name}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 mt-2">💡 You cannot edit global courses or courses from other groups.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && !user.can_access_all_groups && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Group-Specific Super Admin</p>
                  <p className="text-sm text-blue-700 mb-2">You can manage courses for your assigned groups: </p>
                  <div className="flex gap-2 flex-wrap">
                    {groups.map(g => (
                      <Badge key={g.id} variant="outline">{g.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Course Administration</h1>
            <p className="text-slate-600 mt-1">Create and manage courses</p>
          </div>

          <Button
            onClick={() => {
              resetCourseForm();
              setShowCourseDialog(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="lg:col-span-3 text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-500">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="lg:col-span-3 text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No courses yet. Create your first course!</p>
            </div>
          ) : (
            courses.map((course) => {
              const courseGroup = groups.find(g => g.id === course.group_id);
              const canEditThisCourse = isSupervisorAdmin ? 
                (course.is_group_course && user.assigned_groups?.includes(course.group_id)) : 
                true;
              
              return (
                <Card key={course.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                  {course.thumbnail_url && (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover rounded-t-lg" />
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="text-xs">{course.category?.replace(/_/g, ' ')}</Badge>
                        <Badge variant="outline">{course.level}</Badge>
                        {course.is_group_course && courseGroup && (
                          <Badge className="bg-blue-600 text-white">
                            <Building2 className="w-3 h-3 mr-1" />
                            {courseGroup.name}
                          </Badge>
                        )}
                        {!course.is_group_course && (
                          <Badge className="bg-green-600 text-white">
                            <Globe className="w-3 h-3 mr-1" />
                            Global
                          </Badge>
                        )}
                        {!canEditThisCourse && isSupervisorAdmin && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600">
                            👁️ View Only
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>

                    <div className="flex gap-2 mb-4 flex-wrap">
                      {course.voice_intro_url && (
                        <Badge className="bg-green-100 text-green-700">
                          <Volume2 className="w-3 h-3 mr-1" />
                          Has Voice
                        </Badge>
                      )}
                      {course.is_student_course && (
                        <Badge className="bg-purple-100 text-purple-700">Student Course</Badge>
                      )}
                      {course.published ? (
                        <Badge className="bg-blue-100 text-blue-700">Published</Badge>
                      ) : (
                        <Badge variant="destructive">Draft</Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedCourseForChapters(course)}
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Chapters
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditCourse(course)}
                        disabled={!canEditThisCourse}
                        title={isSupervisorAdmin && !canEditThisCourse ? "As a Supervisor Admin, you can only edit courses in your assigned groups" : "Edit course"}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteCourse(course.id)}
                        className={`${canDelete && canEditThisCourse ? 'text-red-600 hover:text-red-700' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!canDelete || !canEditThisCourse}
                        title={!canDelete ? "Only Super Admins or Top Tier Admins can delete courses" : (isSupervisorAdmin && !canEditThisCourse ? "As a Supervisor Admin, you cannot delete courses you don't manage" : "Delete course")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Create/Edit Course Dialog */}
        <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Update course details' : 'Add a new course to the platform'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Course Title</Label>
                <Input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="e.g., Leadership Mastery"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Describe what students will learn..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={courseForm.category} onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self_development">Self Development</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="study_skills">Study Skills</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Level</Label>
                  <Select value={courseForm.level} onValueChange={(value) => setCourseForm({ ...courseForm, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level" />
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
                <Label>Instructor</Label>
                <Input
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                  placeholder="Instructor name"
                />
              </div>

              <div>
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  value={courseForm.duration_hours}
                  onChange={(e) => setCourseForm({ ...courseForm, duration_hours: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={courseForm.thumbnail_url}
                  onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
                {courseForm.thumbnail_url && (
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img src={courseForm.thumbnail_url} alt="Preview" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              {/* VOICE INTRO UPLOAD */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <Label className="text-blue-900 font-bold">Voice Introduction (Optional)</Label>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Upload an audio file with course introduction. Users can click to listen!
                </p>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleUploadVoice}
                    className="text-sm block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  />

                  {courseForm.voice_intro_url && (
                    <div className="bg-white rounded-lg p-3 border border-green-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Voice file uploaded</span>
                        </div>
                        <audio controls className="h-8">
                          <source src={courseForm.voice_intro_url} />
                        </audio>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* GROUP ASSIGNMENT */}
              {((isSuperAdmin || isTopTierAdmin || isSupervisorAdmin)) && (
                <div className={`border-2 rounded-xl p-4 ${
                  isSupervisorAdmin 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-purple-200 bg-purple-50'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className={`w-5 h-5 ${isSupervisorAdmin ? 'text-purple-700' : 'text-purple-600'}`} />
                    <Label className={`font-bold ${isSupervisorAdmin ? 'text-purple-900' : 'text-purple-900'}`}>
                      Course Visibility
                    </Label>
                  </div>

                  {isSupervisorAdmin && (
                    <div className="mb-3 p-3 bg-orange-100 border-2 border-orange-300 rounded-lg">
                      <p className="text-sm font-bold text-orange-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        As a Supervisor, you MUST assign courses to your groups
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        You cannot create global courses. All your courses must be assigned to one of your groups.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {!isSupervisorAdmin && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={courseForm.is_group_course}
                          onChange={(e) => setCourseForm({ 
                            ...courseForm, 
                            is_group_course: e.target.checked,
                            group_id: e.target.checked ? courseForm.group_id : null
                          })}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">Assign to specific group (Private)</span>
                      </label>
                    )}

                    {(courseForm.is_group_course || isSupervisorAdmin) && (
                      <div>
                        <Label className="text-sm">Select Group {isSupervisorAdmin && <span className="text-red-600">*</span>}</Label>
                        <Select 
                          value={courseForm.group_id || ''} 
                          onValueChange={(value) => setCourseForm({ 
                            ...courseForm, 
                            group_id: value,
                            is_group_course: true
                          })}
                        >
                          <SelectTrigger className={isSupervisorAdmin ? 'border-purple-400' : ''}>
                            <SelectValue placeholder="Choose a group" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name} ({group.group_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className={`text-xs mt-1 ${isSupervisorAdmin ? 'text-purple-700' : 'text-purple-600'}`}>
                          {isSupervisorAdmin 
                            ? '⚠️ Required: You must select one of your assigned groups'
                            : 'Only members of this group will see this course'
                          }
                        </p>
                      </div>
                    )}

                    {!courseForm.is_group_course && !isSupervisorAdmin && (
                      <p className="text-xs text-green-600">
                        <Globe className="w-3 h-3 inline mr-1" />
                        This course will be visible to all users globally
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseForm.published}
                    onChange={(e) => setCourseForm({ ...courseForm, published: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Published</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseForm.is_student_course}
                    onChange={(e) => setCourseForm({ ...courseForm, is_student_course: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">Student Course</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCourse} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Save className="w-4 h-4 mr-2" />
                {editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
