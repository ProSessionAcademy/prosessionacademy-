import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  ArrowLeft, 
  Play, 
  CheckCircle2,
  Sparkles,
  Video,
  Award,
  Clock,
  Star,
  Plus,
  Upload,
  Loader2,
  Save,
  Image as ImageIcon,
  Film,
  Settings as SettingsIcon,
  Edit
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function CegidDiscovery() {
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('groupId');
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [levelFilter, setLevelFilter] = useState('all');
  
  // Course creation
  const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'cegid_skill',
    level: 'beginner',
    thumbnail_url: '',
    instructor: '',
    duration_hours: 0,
    published: true,
    topic_id: null // NEW: Track which topic to auto-assign to
  });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: group, refetch: refetchGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const groups = await base44.entities.Group.filter({ id: groupId });
      return groups[0];
    },
    enabled: !!groupId,
  });

  const { data: allCourses = [], refetch: refetchCourses } = useQuery({
    queryKey: ['allCourses', groupId],
    queryFn: async () => {
      const courses = await base44.entities.Course.list('-created_date');
      return courses.filter(c => c.group_id === groupId && c.is_cegid_course);
    },
    initialData: [],
    enabled: !!groupId,
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.UserProgress.filter({ user_email: user.email });
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      // Create the course
      const newCourse = await base44.entities.Course.create({
        ...courseData,
        group_id: groupId,
        is_group_course: true,
        is_cegid_course: true
      });

      // Auto-assign to topic if topic_id is provided
      if (courseData.topic_id && group?.cegid_discovery?.topics) {
        const updatedTopics = group.cegid_discovery.topics.map(topic => {
          if (topic.id === courseData.topic_id) {
            return {
              ...topic,
              course_ids: [...(topic.course_ids || []), newCourse.id]
            };
          }
          return topic;
        });

        await base44.entities.Group.update(groupId, {
          cegid_discovery: {
            ...group.cegid_discovery,
            topics: updatedTopics
          }
        });
      }

      return newCourse;
    },
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
      queryClient.invalidateQueries({ queryKey: ['group'] });
      refetchCourses();
      refetchGroup();
      setShowCreateCourseDialog(false);
      
      // Navigate to Course Admin to add chapters
      if (confirm('✅ Course created! Do you want to add chapters now?')) {
        window.location.href = `${createPageUrl("CourseAdmin")}?courseId=${newCourse.id}`;
      } else {
        setCourseForm({
          title: '',
          description: '',
          category: 'cegid_skill',
          level: 'beginner',
          thumbnail_url: '',
          instructor: '',
          duration_hours: 0,
          published: true,
          topic_id: null
        });
      }
    }
  });

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('⚠️ Please upload an image or video file');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setCourseForm({ ...courseForm, thumbnail_url: response.file_url });
      alert(`✅ ${isVideo ? 'Video' : 'Image'} uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      alert('❌ Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploadingThumbnail(false);
      event.target.value = '';
    }
  };

  const handleCreateCourse = () => {
    if (!courseForm.title || !courseForm.description) {
      alert('⚠️ Please fill in title and description');
      return;
    }
    createCourseMutation.mutate(courseForm);
  };

  const handleBackToGroup = () => {
    window.location.href = `${createPageUrl("GroupDashboard")}?groupId=${groupId}`;
  };

  const isVideoFile = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|avi)$/i);
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i);
  };

  if (!group?.cegid_discovery?.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-none shadow-2xl">
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Cegid Discovery Not Enabled
            </h2>
            <p className="text-slate-600 mb-6">
              This feature is not available for this group yet.
            </p>
            <Button 
              onClick={handleBackToGroup}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Group
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cegidSettings = group.cegid_discovery;
  const topics = cegidSettings.topics || [];

  // Get courses for selected topic
  const topicCourses = selectedTopic
    ? allCourses.filter(c => selectedTopic.course_ids?.includes(c.id))
    : [];

  // Filter by level
  const filteredCourses = levelFilter === 'all'
    ? topicCourses
    : topicCourses.filter(c => c.level === levelFilter);

  const levels = [
    { value: 'all', label: 'All Levels', emoji: '🎯' },
    { value: 'beginner', label: 'Beginner', emoji: '🌱' },
    { value: 'intermediate', label: 'Intermediate', emoji: '📈' },
    { value: 'advanced', label: 'Advanced', emoji: '🚀' },
    { value: 'expert', label: 'Expert', emoji: '👑' }
  ];

  const canCreateCourse = user?.admin_level === 'supervisor_admin' || 
                          user?.admin_level === 'super_admin' || 
                          user?.admin_level === 'top_tier_admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={handleBackToGroup}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {group?.name}
            </Button>

            {canCreateCourse && (
              <Button
                onClick={() => {
                  setCourseForm({
                    ...courseForm,
                    topic_id: selectedTopic?.id || null
                  });
                  setShowCreateCourseDialog(true);
                }}
                className="bg-white text-purple-600 hover:bg-white/90 shadow-xl font-bold"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Cegid Course
              </Button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Sparkles className="w-11 h-11" />
            </div>
            <div>
              <h1 className="text-5xl font-black mb-2">
                {cegidSettings.button_text || 'Discover Cegid'}
              </h1>
              <p className="text-xl text-white/90">
                Your exclusive learning portal • {topics.length} learning paths • {allCourses.length} courses
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Topics */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-none shadow-xl sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">📚 Learning Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topics.sort((a, b) => a.order - b.order).map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setLevelFilter('all');
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedTopic?.id === topic.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{topic.icon}</span>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${selectedTopic?.id === topic.id ? 'text-white' : 'text-slate-900'}`}>
                          {topic.title}
                        </p>
                        <p className={`text-xs ${selectedTopic?.id === topic.id ? 'text-white/80' : 'text-slate-500'}`}>
                          {topic.course_ids?.length || 0} courses
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {topics.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500">No topics yet</p>
                    <p className="text-xs text-slate-400 mt-1">Admins can add topics in Group Settings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Courses */}
          <div className="lg:col-span-3">
            {!selectedTopic ? (
              <Card className="border-none shadow-xl">
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Select a Topic
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Choose a learning path from the sidebar to get started
                  </p>
                  {canCreateCourse && (
                    <Button
                      onClick={() => {
                        setCourseForm({ ...courseForm, topic_id: null });
                        setShowCreateCourseDialog(true);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create a New Course
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Topic Header */}
                <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-5xl">{selectedTopic.icon}</div>
                        <div className="flex-1">
                          <h2 className="text-3xl font-black text-slate-900 mb-2">
                            {selectedTopic.title}
                          </h2>
                          <p className="text-lg text-slate-700 mb-4">
                            {selectedTopic.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-600 text-white">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {topicCourses.length} courses available
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {canCreateCourse && (
                        <Button
                          onClick={() => {
                            setCourseForm({ ...courseForm, topic_id: selectedTopic.id });
                            setShowCreateCourseDialog(true);
                          }}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Course to This Topic
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Level Filter */}
                <Card className="border-none shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-slate-700">Filter by level:</span>
                      {levels.map(level => (
                        <Button
                          key={level.value}
                          variant={levelFilter === level.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLevelFilter(level.value)}
                          className={levelFilter === level.value ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
                        >
                          <span className="mr-1">{level.emoji}</span>
                          {level.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Courses Grid */}
                {filteredCourses.length === 0 ? (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-12 text-center">
                      <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        No courses for this filter
                      </h3>
                      <p className="text-slate-600 mb-6">
                        {canCreateCourse 
                          ? 'Click "Add Course to This Topic" to create your first course'
                          : 'Try selecting a different level or topic'
                        }
                      </p>
                      {canCreateCourse && (
                        <Button
                          onClick={() => {
                            setCourseForm({ ...courseForm, topic_id: selectedTopic.id });
                            setShowCreateCourseDialog(true);
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Course
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredCourses.map((course, idx) => {
                      const progress = userProgress.find(p => p.course_id === course.id);
                      const isCompleted = progress?.progress_percentage === 100;
                      const hasVideo = isVideoFile(course.thumbnail_url);
                      const hasImage = isImageFile(course.thumbnail_url);

                      return (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="border-none shadow-lg hover:shadow-xl transition-all group h-full flex flex-col">
                            {/* Course Thumbnail with Video Support */}
                            <div className="relative h-48 overflow-hidden rounded-t-xl">
                              {hasVideo ? (
                                <video
                                  src={course.thumbnail_url}
                                  className="w-full h-full object-cover"
                                  controls
                                  poster={course.video_poster_url}
                                />
                              ) : hasImage ? (
                                <img
                                  src={course.thumbnail_url}
                                  alt={course.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <BookOpen className="w-16 h-16 text-white/30" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              
                              {/* Level Badge */}
                              <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900">
                                {course.level}
                              </Badge>

                              {/* Completion Badge */}
                              {isCompleted && (
                                <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}

                              {/* Video Badge */}
                              {hasVideo && (
                                <div className="absolute bottom-3 right-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                  <Video className="w-3 h-3" />
                                  VIDEO
                                </div>
                              )}

                              {/* Admin Edit Badge */}
                              {canCreateCourse && (
                                <Button
                                  size="sm"
                                  className="absolute bottom-3 left-3 bg-orange-600 hover:bg-orange-700 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `${createPageUrl("CourseAdmin")}?courseId=${course.id}`;
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>

                            {/* Content */}
                            <CardContent className="p-6 flex-1 flex flex-col">
                              <div className="flex-1">
                                <div className="flex gap-2 mb-3">
                                  <Badge variant="outline" className="text-xs">
                                    {course.category?.replace(/_/g, ' ')}
                                  </Badge>
                                </div>

                                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                                  {course.title}
                                </h3>

                                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                  {course.description}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                  {course.duration_hours && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{course.duration_hours}h</span>
                                    </div>
                                  )}
                                  {course.instructor && (
                                    <div className="flex items-center gap-1">
                                      <Award className="w-4 h-4" />
                                      <span className="truncate">{course.instructor}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Progress Bar */}
                                {progress && (
                                  <div className="mb-4">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-slate-600">Progress</span>
                                      <span className="font-bold text-purple-600">
                                        {progress.progress_percentage}%
                                      </span>
                                    </div>
                                    <Progress
                                      value={progress.progress_percentage}
                                      className="h-2 bg-slate-200"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Action Button */}
                              <Button 
                                onClick={() => window.location.href = `${createPageUrl("Learning")}?courseId=${course.id}`}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                {isCompleted ? 'Review Course' : progress ? 'Continue' : 'Start Learning'}
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Course Dialog */}
      <Dialog open={showCreateCourseDialog} onOpenChange={setShowCreateCourseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="w-7 h-7 text-purple-600" />
              Create Cegid Course
            </DialogTitle>
            <DialogDescription>
              Create a course for Cegid Discovery. You'll be able to add chapters immediately after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Topic Assignment */}
            {topics.length > 0 && (
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <Label className="text-base font-semibold mb-2 block">Assign to Topic (Optional)</Label>
                  <Select 
                    value={courseForm.topic_id || 'none'} 
                    onValueChange={(value) => setCourseForm({ ...courseForm, topic_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">📌 Don't assign yet (add later in Settings)</SelectItem>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.icon} {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-purple-700 mt-2">
                    {courseForm.topic_id 
                      ? '✅ Course will appear in this topic immediately' 
                      : 'ℹ️ You can assign to a topic later in Group Settings'
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            <div>
              <Label className="text-base font-semibold">Course Title *</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="e.g., Cegid Retail Y2 - Advanced Features"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Description *</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="What will students learn in this course..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base font-semibold">Category</Label>
                <Select value={courseForm.category} onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cegid_skill">🎯 Cegid Skill (Recommended)</SelectItem>
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
                <Label className="text-base font-semibold">Difficulty Level *</Label>
                <Select value={courseForm.level} onValueChange={(value) => setCourseForm({ ...courseForm, level: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Beginner</SelectItem>
                    <SelectItem value="intermediate">📈 Intermediate</SelectItem>
                    <SelectItem value="advanced">🚀 Advanced</SelectItem>
                    <SelectItem value="expert">👑 Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Instructor Name</Label>
              <Input
                value={courseForm.instructor}
                onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                placeholder="e.g., John Smith"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Duration (hours)</Label>
              <Input
                type="number"
                value={courseForm.duration_hours}
                onChange={(e) => setCourseForm({ ...courseForm, duration_hours: parseInt(e.target.value) || 0 })}
                min="0"
                placeholder="e.g., 2"
                className="mt-2"
              />
            </div>

            {/* Video/Image Upload */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Film className="w-5 h-5 text-blue-600" />
                  Course Media (Video or Image)
                </CardTitle>
                <CardDescription>
                  Upload a video preview or thumbnail image for this course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseForm.thumbnail_url && (
                  <div className="relative rounded-xl overflow-hidden border-4 border-white shadow-lg">
                    {isVideoFile(courseForm.thumbnail_url) ? (
                      <div className="relative">
                        <video
                          src={courseForm.thumbnail_url}
                          className="w-full h-48 object-cover"
                          controls
                        />
                        <Badge className="absolute top-2 right-2 bg-red-600 text-white">
                          <Video className="w-3 h-3 mr-1" />
                          VIDEO
                        </Badge>
                      </div>
                    ) : (
                      <img
                        src={courseForm.thumbnail_url}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                    )}
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    id="thumbnail-upload"
                    accept="image/*,video/*"
                    disabled={uploadingThumbnail}
                  />
                  <Button
                    onClick={() => document.getElementById('thumbnail-upload').click()}
                    disabled={uploadingThumbnail}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {uploadingThumbnail ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        {courseForm.thumbnail_url ? 'Change Media' : 'Upload Video or Image'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    📹 Supports videos (MP4, WebM) and images (JPG, PNG)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <input
                type="checkbox"
                checked={courseForm.published}
                onChange={(e) => setCourseForm({ ...courseForm, published: e.target.checked })}
                className="w-5 h-5"
              />
              <div>
                <Label className="text-base font-bold">Publish immediately</Label>
                <p className="text-sm text-slate-600">Make this course available to members right away</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                ✨ After Creating This Course:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Course will be created in Cegid Discovery</li>
                {courseForm.topic_id && <li>✅ Auto-assigned to the selected topic (visible immediately!)</li>}
                <li>✅ You'll be redirected to Course Admin to add chapters</li>
                <li>✅ Students can access it right away once chapters are added</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateCourseDialog(false);
                setCourseForm({
                  title: '',
                  description: '',
                  category: 'cegid_skill',
                  level: 'beginner',
                  thumbnail_url: '',
                  instructor: '',
                  duration_hours: 0,
                  published: true,
                  topic_id: null
                });
              }}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCourse}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={createCourseMutation.isPending || !courseForm.title || !courseForm.description}
              size="lg"
            >
              {createCourseMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Create & Add Chapters
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}