
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash,
  Save,
  ArrowUp,
  ArrowDown,
  FileText,
  Image as ImageIcon,
  Video,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sliders,
  Gamepad2,
  Upload,
  Volume2,
  Loader2,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ChapterBuilder() {
  const queryClient = useQueryClient();

  // STATE
  const [chapterId, setChapterId] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [urlParsed, setUrlParsed] = useState(false); // NEW: Track if URL parsing is complete
  const [contentBlocks, setContentBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [user, setUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  // BULLETPROOF URL PARSING - handles ANY case variation
  useEffect(() => {
    const fullUrl = window.location.href;
    const queryString = window.location.search;
    
    console.log('🔍 === BULLETPROOF URL PARSER ===');
    console.log('📍 Full URL:', fullUrl);
    console.log('📋 Query String:', queryString);
    
    let extractedChapterId = null;
    let extractedCourseId = null;
    
    // Create URLSearchParams from query string
    const originalParams = new URLSearchParams(queryString);
    
    // Try to get chapterId (try both common cases)
    extractedChapterId = originalParams.get('chapterId') || originalParams.get('chapterid');
    
    // Try to get courseId (try ALL common variations)
    extractedCourseId = originalParams.get('courseId') || 
                        originalParams.get('courseid') || 
                        originalParams.get('courseID') ||
                        originalParams.get('urseid'); // Legacy/typo support
    
    console.log('✅ Method 1 - Standard URLSearchParams:');
    console.log('   chapterId:', extractedChapterId);
    console.log('   courseId:', extractedCourseId);
    
    // Fallback: Manual extraction with case-insensitive regex for truly broken/mixed-case scenarios
    if (!extractedChapterId || !extractedCourseId) {
      console.log('🔧 Method 2 - Regex extraction...');
      
      // Regex for chapterId (case-insensitive)
      const chapterMatch = queryString.match(/chapterid=([^&]+)/i);
      if (chapterMatch && !extractedChapterId) {
        extractedChapterId = chapterMatch[1];
        console.log('   Found chapterId via regex:', extractedChapterId);
      }
      
      // Regex for courseId (case-insensitive, includes 'urseid')
      const courseMatch = queryString.match(/(?:courseid|urseid)=([^&]+)/i);
      if (courseMatch && !extractedCourseId) {
        extractedCourseId = courseMatch[1];
        console.log('   Found courseId via regex:', extractedCourseId);
      }
    }
    
    console.log('🎯 FINAL EXTRACTED VALUES:');
    console.log('   chapterId:', extractedChapterId);
    console.log('   courseId:', extractedCourseId);
    console.log('====================================');
    
    if (extractedChapterId) setChapterId(extractedChapterId);
    if (extractedCourseId) setCourseId(extractedCourseId);
    
    // Mark URL parsing as complete
    setUrlParsed(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      if (!chapterId) return null;
      const chapters = await base44.entities.Chapter.filter({ id: chapterId });
      return chapters[0] || null;
    },
    enabled: !!chapterId && urlParsed, // Only enable if chapterId is present AND URL has been parsed
  });

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0] || null;
    },
    enabled: !!courseId && urlParsed, // Only enable if courseId is present AND URL has been parsed
  });

  useEffect(() => {
    if (chapter?.content_blocks) {
      setContentBlocks(chapter.content_blocks);
    }
  }, [chapter]);

  useEffect(() => {
    if (user && course) {
      const isSupervisorAdmin = user.admin_level === 'supervisor_admin';
      const isSuperAdmin = user.admin_level === 'super_admin';
      const isTopTierAdmin = user.admin_level === 'top_tier_admin';

      if (isTopTierAdmin) {
        setCanEdit(true);
      } else if (isSuperAdmin) {
        if (user.can_access_all_groups) {
          setCanEdit(true);
        } else {
          const assignedGroups = user.assigned_groups || [];
          if (course.is_group_course && assignedGroups.includes(course.group_id)) {
            setCanEdit(true);
          } else if (!course.is_group_course) {
            setCanEdit(true);
          } else {
            setCanEdit(false);
          }
        }
      } else if (isSupervisorAdmin) {
        const assignedGroups = user.assigned_groups || [];
        if (course.is_group_course && assignedGroups.includes(course.group_id)) {
          setCanEdit(true);
        } else {
          setCanEdit(false);
        }
      } else {
        setCanEdit(false);
      }
    } else if (user && !courseId) {
      // If no courseId, assume admin can edit (e.g. for creating new chapters not tied to a course yet)
      // This might need refinement based on exact app logic for new chapters
      setCanEdit(true);
    }
  }, [user, course, courseId]);

  const updateChapterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Chapter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter'] });
      alert('✅ Content saved!');
    },
  });

  const addBlock = (type) => {
    if (!canEdit) {
      alert('⛔ You do not have permission to edit this chapter.\n\nThis course is not in your assigned groups or you lack the necessary permissions.');
      return;
    }
    const newBlock = {
      type,
      order: contentBlocks.length + 1,
      data: getDefaultDataForType(type)
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

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

  const updateBlock = (index, field, value) => {
    if (!canEdit) {
      alert('⛔ You do not have permission to edit this chapter.');
      return;
    }
    const updated = [...contentBlocks];
    updated[index].data[field] = value;
    setContentBlocks(updated);
  };

  const updateBlockData = (index, newData) => {
    if (!canEdit) {
      alert('⛔ You do not have permission to edit this chapter.');
      return;
    }
    const updated = [...contentBlocks];
    updated[index].data = newData;
    setContentBlocks(updated);
  };

  const deleteBlock = (index) => {
    if (!canEdit) {
      alert('⛔ You do not have permission to edit this chapter.');
      return;
    }
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index, direction) => {
    if (!canEdit) {
      alert('⛔ You do not have permission to edit this chapter.');
      return;
    }
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contentBlocks.length) return;

    const updated = [...contentBlocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setContentBlocks(updated);
  };

  const saveContent = async () => {
    if (!canEdit) {
      alert('⛔ You do not have permission to save changes to this chapter.\n\nThis course is not in your assigned groups or you lack the necessary permissions.');
      return;
    }

    if (!chapterId) {
      alert('❌ No chapter selected');
      return;
    }

    setSaving(true);
    try {
      await updateChapterMutation.mutateAsync({
        id: chapterId,
        data: { content_blocks: contentBlocks }
      });
    } finally {
      setSaving(false);
    }
  };

  // Modified handleImageUpload to accept a callback for setting the value
  const handleImageUpload = async (event, updateCallback) => {
    if (!canEdit) {
      alert('⛔ You do not have permission to upload images to this chapter.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      updateCallback(response.file_url); // Call the provided callback with the URL
      alert('✅ Image uploaded!');
    } catch (error) {
      alert('❌ Upload failed: ' + error.message);
    } finally {
      // Clear the file input value to allow re-uploading the same file
      event.target.value = '';
    }
  };

  // WAIT for URL parsing before showing "no chapter" error
  if (!urlParsed) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!chapterId) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No chapter selected. Please select a chapter from Course Admin.</p>
            <p className="text-xs text-slate-400 mb-4">Debug: chapterId={String(chapterId)}, courseId={String(courseId)}</p>
            <Link to={createPageUrl("CourseAdmin")}>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chapterLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <p className="text-red-600 mb-4">Chapter not found</p>
            <Link to={createPageUrl("CourseAdmin")}>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {!canEdit && user && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Read-Only Mode</p>
                <p className="text-sm text-red-700">
                  You can view this chapter but cannot make changes. This course is not in your assigned groups or you lack the necessary permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chapter Content Builder</h1>
          <p className="text-slate-600">{chapter.title}</p>
          {course && <p className="text-sm text-slate-500">Course: {course.title}</p>}
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl(`CourseAdmin`)}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          {canEdit && (
            <Button onClick={saveContent} disabled={saving} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Content'}
            </Button>
          )}
        </div>
      </div>

      {/* Add Block Buttons */}
      {canEdit && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Add Content Block</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={() => addBlock('text')} variant="outline" className="h-20 flex flex-col gap-2">
                <FileText className="w-6 h-6" />
                Text Block
              </Button>
              <Button onClick={() => addBlock('flip_cards')} variant="outline" className="h-20 flex flex-col gap-2">
                <RotateCcw className="w-6 h-6" />
                Flip Cards
              </Button>
              <Button onClick={() => addBlock('expandable')} variant="outline" className="h-20 flex flex-col gap-2">
                <ChevronDown className="w-6 h-6" />
                Expandable Section
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
                Multiple Choice Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Blocks */}
      <div className="space-y-4">
        {contentBlocks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              {canEdit
                ? "No content blocks yet. Click above to add your first block!"
                : "This chapter has no content blocks yet."
              }
            </CardContent>
          </Card>
        )}

        {contentBlocks.map((block, index) => (
          <Card key={index} className={`border-2 ${canEdit ? 'border-blue-200' : 'border-slate-200'}`}>
            <CardHeader className="bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge>{block.type}</Badge>
                  <span className="text-sm text-slate-600">Block {index + 1}</span>
                  {!canEdit && <Badge variant="outline" className="text-xs">Read Only</Badge>}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => moveBlock(index, 'down')} disabled={index === contentBlocks.length - 1}>
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteBlock(index)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* TEXT BLOCK */}
              {block.type === 'text' && (
                <div>
                  <Label>Text Content</Label>
                  {canEdit ? (
                    <Textarea
                      value={block.data.content || ''}
                      onChange={(e) => updateBlock(index, 'content', e.target.value)}
                      rows={8}
                      placeholder="Enter your text content here..."
                    />
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap">
                      {block.data.content || 'No content'}
                    </div>
                  )}
                </div>
              )}

              {/* FLIP CARDS */}
              {block.type === 'flip_cards' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Flip Cards ({block.data.cards?.length || 0})</Label>
                    {canEdit && (
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
                    )}
                  </div>
                  {block.data.cards?.map((card, cardIdx) => (
                    <Card key={cardIdx} className="p-4 bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-semibold text-sm">Card {cardIdx + 1}</p>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newCards = block.data.cards.filter((_, i) => i !== cardIdx);
                              updateBlock(index, 'cards', newCards);
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Front Text</Label>
                          {canEdit ? (
                            <Input
                              value={card.frontText || ''}
                              onChange={(e) => {
                                const newCards = [...block.data.cards];
                                newCards[cardIdx].frontText = e.target.value;
                                updateBlock(index, 'cards', newCards);
                              }}
                              placeholder="Front of card"
                            />
                          ) : (
                            <div className="p-2 bg-white rounded-md text-sm text-gray-700">{card.frontText || 'No front text'}</div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Back Text</Label>
                          {canEdit ? (
                            <Textarea
                              value={card.backText || ''}
                              onChange={(e) => {
                                const newCards = [...block.data.cards];
                                newCards[cardIdx].backText = e.target.value;
                                updateBlock(index, 'cards', newCards);
                              }}
                              placeholder="Back of card"
                              rows={3}
                            />
                          ) : (
                            <div className="p-2 bg-white rounded-md text-sm text-gray-700 whitespace-pre-wrap">{card.backText || 'No back text'}</div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Front Image URL (optional)</Label>
                          {canEdit ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={card.frontImage || ''}
                                onChange={(e) => {
                                  const newCards = [...block.data.cards];
                                  newCards[cardIdx].frontImage = e.target.value;
                                  updateBlock(index, 'cards', newCards);
                                }}
                                placeholder="Front image URL"
                              />
                              <input
                                id={`flipcard-front-upload-${index}-${cardIdx}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, (url) => {
                                  const newCards = [...block.data.cards];
                                  newCards[cardIdx].frontImage = url;
                                  updateBlock(index, 'cards', newCards);
                                })}
                                disabled={!canEdit}
                              />
                              <Button 
                                size="sm" 
                                type="button" 
                                disabled={!canEdit}
                                onClick={() => document.getElementById(`flipcard-front-upload-${index}-${cardIdx}`).click()}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Upload
                              </Button>
                            </div>
                          ) : (
                            <div className="p-2 bg-white rounded-md text-sm text-gray-700">{card.frontImage || 'No front image URL'}</div>
                          )}
                          {card.frontImage && <img src={card.frontImage} alt="Front Preview" className="mt-2 w-full h-24 object-contain rounded-md border" />}
                        </div>

                        <div>
                          <Label className="text-xs">Back Image URL (optional)</Label>
                          {canEdit ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={card.backImage || ''}
                                onChange={(e) => {
                                  const newCards = [...block.data.cards];
                                  newCards[cardIdx].backImage = e.target.value;
                                  updateBlock(index, 'cards', newCards);
                                }}
                                placeholder="Back image URL"
                              />
                              <input
                                id={`flipcard-back-upload-${index}-${cardIdx}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, (url) => {
                                  const newCards = [...block.data.cards];
                                  newCards[cardIdx].backImage = url;
                                  updateBlock(index, 'cards', newCards);
                                })}
                                disabled={!canEdit}
                              />
                              <Button 
                                size="sm" 
                                type="button" 
                                disabled={!canEdit}
                                onClick={() => document.getElementById(`flipcard-back-upload-${index}-${cardIdx}`).click()}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Upload
                              </Button>
                            </div>
                          ) : (
                            <div className="p-2 bg-white rounded-md text-sm text-gray-700">{card.backImage || 'No back image URL'}</div>
                          )}
                          {card.backImage && <img src={card.backImage} alt="Back Preview" className="mt-2 w-full h-24 object-contain rounded-md border" />}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* EXPANDABLE SECTION */}
              {block.type === 'expandable' && (
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    {canEdit ? (
                      <Input
                        value={block.data.title || ''}
                        onChange={(e) => updateBlock(index, 'title', e.target.value)}
                        placeholder="Section title"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.title || 'No title'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Content</Label>
                    {canEdit ? (
                      <Textarea
                        value={block.data.content || ''}
                        onChange={(e) => updateBlock(index, 'content', e.target.value)}
                        rows={5}
                        placeholder="Content that appears when expanded"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">{block.data.content || 'No content'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Image (optional)</Label>
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={block.data.image || ''}
                          onChange={(e) => updateBlock(index, 'image', e.target.value)}
                          placeholder="Image URL for the section"
                        />
                        <input
                          id={`expandable-image-upload-${index}`}
                          type="file"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (url) => updateBlock(index, 'image', url))}
                          disabled={!canEdit}
                        />
                        <Button 
                          size="sm" 
                          type="button" 
                          disabled={!canEdit}
                          onClick={() => document.getElementById(`expandable-image-upload-${index}`).click()}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.image || 'No image URL'}</div>
                    )}
                    {block.data.image && <img src={block.data.image} alt="Expandable Section Preview" className="mt-2 w-full h-32 object-contain rounded-md border" />}
                  </div>
                </div>
              )}

              {/* IMAGE */}
              {block.type === 'image' && (
                <div className="space-y-3">
                  <div>
                    <Label>Image URL</Label>
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={block.data.url || ''}
                          onChange={(e) => updateBlock(index, 'url', e.target.value)}
                          placeholder="Image URL"
                        />
                        <input
                          id={`image-upload-${index}`}
                          type="file"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (url) => updateBlock(index, 'url', url))}
                          disabled={!canEdit}
                        />
                        <Button 
                          size="sm" 
                          type="button" 
                          disabled={!canEdit}
                          onClick={() => document.getElementById(`image-upload-${index}`).click()}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.url || 'No image URL'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Caption (optional)</Label>
                    {canEdit ? (
                      <Input
                        value={block.data.caption || ''}
                        onChange={(e) => updateBlock(index, 'caption', e.target.value)}
                        placeholder="Image caption"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.caption || 'No caption'}</div>
                    )}
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
                  {canEdit ? (
                    <Input
                      value={block.data.url || ''}
                      onChange={(e) => updateBlock(index, 'url', e.target.value)}
                      placeholder="YouTube, Vimeo, or video file URL"
                    />
                  ) : (
                    <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.url || 'No video URL'}</div>
                  )}
                </div>
              )}

              {/* SLIDER QUIZ */}
              {block.type === 'slider' && (
                <div className="space-y-3">
                  <div>
                    <Label>Question</Label>
                    {canEdit ? (
                      <Input
                        value={block.data.question || ''}
                        onChange={(e) => updateBlock(index, 'question', e.target.value)}
                        placeholder="What is the question?"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.question || 'No question'}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Min Value</Label>
                      {canEdit ? (
                        <Input
                          type="number"
                          value={block.data.minValue || 0}
                          onChange={(e) => updateBlock(index, 'minValue', parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.minValue}</div>
                      )}
                    </div>
                    <div>
                      <Label>Max Value</Label>
                      {canEdit ? (
                        <Input
                          type="number"
                          value={block.data.maxValue || 100}
                          onChange={(e) => updateBlock(index, 'maxValue', parseInt(e.target.value) || 100)}
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.maxValue}</div>
                      )}
                    </div>
                    <div>
                      <Label>Correct Answer</Label>
                      {canEdit ? (
                        <Input
                          type="number"
                          value={block.data.correctAnswer || 50}
                          onChange={(e) => updateBlock(index, 'correctAnswer', parseInt(e.target.value) || 50)}
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.correctAnswer}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Unit (optional)</Label>
                    {canEdit ? (
                      <Input
                        value={block.data.unit || ''}
                        onChange={(e) => updateBlock(index, 'unit', e.target.value)}
                        placeholder="e.g. %, km, seconds"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.unit || 'No unit'}</div>
                    )}
                  </div>
                </div>
              )}

              {/* QUIZ */}
              {block.type === 'quiz' && (
                <div className="space-y-3">
                  <div>
                    <Label>Question</Label>
                    {canEdit ? (
                      <Input
                        value={block.data.question || ''}
                        onChange={(e) => updateBlock(index, 'question', e.target.value)}
                        placeholder="Quiz question"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">{block.data.question || 'No question'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Options</Label>
                    {(block.data.options || ['', '', '', '']).map((option, optIdx) => (
                      <div key={optIdx} className="flex gap-2 mb-2">
                        {canEdit ? (
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={block.data.correct_answer === optIdx}
                            onChange={() => updateBlock(index, 'correct_answer', optIdx)}
                            className="mt-2"
                            disabled={!canEdit}
                          />
                        ) : (
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={block.data.correct_answer === optIdx}
                            readOnly
                            className="mt-2"
                            disabled // Always disabled in read-only mode
                          />
                        )}
                        {canEdit ? (
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(block.data.options || ['', '', '', ''])];
                              newOptions[optIdx] = e.target.value;
                              updateBlock(index, 'options', newOptions);
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                          />
                        ) : (
                          <div className={`flex-1 p-2 bg-slate-50 rounded-md text-sm text-gray-700 ${block.data.correct_answer === optIdx ? 'font-semibold bg-green-50' : ''}`}>
                            {option || 'Empty option'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Explanation</Label>
                    {canEdit ? (
                      <Textarea
                        value={block.data.explanation || ''}
                        onChange={(e) => updateBlock(index, 'explanation', e.target.value)}
                        rows={2}
                        placeholder="Explain the correct answer"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">{block.data.explanation || 'No explanation'}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
