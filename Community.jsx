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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, MessageCircle, Search, Vote, Upload, X, Send, Users, Trash2, Loader2, Eye, ArrowUp } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' }
];

export default function Community() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "general",
    media_urls: []
  });
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newVote, setNewVote] = useState({
    title: "",
    description: "",
    type: "feature",
    options: [{ option: "", votes: 0, voters: [], image_url: "" }, { option: "", votes: 0, voters: [], image_url: "" }],
    end_date: ""
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.list('-created_date');
      return allPosts.filter(post => !post.group_id);
    },
    initialData: [],
  });

  const { data: votes = [] } = useQuery({
    queryKey: ['votes'],
    queryFn: () => base44.entities.Vote.list('-created_date'),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      setShowPostDialog(false);
      setNewPost({ title: "", content: "", category: "general", media_urls: [] });
      alert('✅ Post created!');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.Post.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      alert('✅ Post deleted!');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, comment }) => {
      const sessions = await base44.entities.Post.filter({ id: postId });
      const post = sessions[0];
      
      return await base44.entities.Post.update(postId, {
        comments: [...(post.comments || []), comment]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    }
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, reactionType }) => {
      const post = posts.find(p => p.id === postId);

      const reactions = post.reactions || {};
      const initializedReactions = REACTIONS.reduce((acc, r) => {
        acc[r.type] = reactions[r.type] || [];
        return acc;
      }, {});

      const userReactionsForType = initializedReactions[reactionType];
      const hasReactedWithThisType = userReactionsForType.includes(user.email);

      let updatedReactions = { ...initializedReactions };

      if (hasReactedWithThisType) {
        updatedReactions[reactionType] = userReactionsForType.filter(email => email !== user.email);
      } else {
        for (const type of REACTIONS.map(r => r.type)) {
          if (updatedReactions[type]?.includes(user.email)) {
            updatedReactions[type] = updatedReactions[type].filter(email => email !== user.email);
          }
        }
        updatedReactions[reactionType] = [...userReactionsForType, user.email];
      }

      return base44.entities.Post.update(postId, {
        reactions: updatedReactions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  const upvotePostMutation = useMutation({
    mutationFn: async (postId) => {
      const post = posts.find(p => p.id === postId);
      const currentUpvotes = post.upvotes || 0;
      const upvoters = post.upvoters || [];

      const hasUpvoted = upvoters.includes(user.email);
      const newUpvotes = hasUpvoted ? currentUpvotes - 1 : currentUpvotes + 1;
      const newUpvoters = hasUpvoted ?
        upvoters.filter(email => email !== user.email) :
        [...upvoters, user.email];

      return base44.entities.Post.update(postId, {
        upvotes: newUpvotes,
        upvoters: newUpvoters
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  const createVoteMutation = useMutation({
    mutationFn: (data) => base44.entities.Vote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      setShowVoteDialog(false);
      setNewVote({
        title: "",
        description: "",
        type: "feature",
        options: [{ option: "", votes: 0, voters: [], image_url: "" }, { option: "", votes: 0, voters: [], image_url: "" }],
        end_date: ""
      });
      alert('✅ Poll created!');
    },
  });

  const castVoteMutation = useMutation({
    mutationFn: async ({ voteId, optionIndex }) => {
      const vote = votes.find(v => v.id === voteId);
      const updatedOptions = vote.options.map((opt, idx) => {
        if (idx === optionIndex) {
          return {
            ...opt,
            votes: (opt.votes || 0) + 1,
            voters: [...(opt.voters || []), user.email]
          };
        }
        return opt;
      });

      const totalVotes = updatedOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);

      return base44.entities.Vote.update(voteId, {
        options: updatedOptions,
        total_votes: totalVotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      alert('✅ Vote recorded!');
    },
  });

  const handleReaction = (postId, reactionType) => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }
    reactionMutation.mutate({ postId, reactionType });
  };

  const handleMediaUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingMedia(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const response = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(response.file_url);
      }
      setNewPost({ ...newPost, media_urls: [...newPost.media_urls, ...uploadedUrls] });
      alert('✅ Files uploaded!');
    } catch (error) {
      alert('❌ Upload failed');
    } finally {
      setUploadingMedia(false);
      event.target.value = '';
    }
  };

  const removeMedia = (url) => {
    setNewPost({ ...newPost, media_urls: newPost.media_urls.filter(u => u !== url) });
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    createPostMutation.mutate({
      ...newPost,
      author_email: user.email,
      author_name: user.full_name || user.email,
      views: 0,
      upvotes: 0,
      upvoters: [],
      reactions: { like: [], love: [], haha: [], wow: [], sad: [] },
      answers: [],
      comments: []
    });
  };

  const handleAddComment = async (postId) => {
    const commentKey = `comment-${postId}`;
    const commentText = commentInputs[commentKey];
    
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }
    if (!commentText?.trim()) {
      return;
    }

    const comment = {
      id: Date.now().toString(),
      user_email: user?.email,
      user_name: user?.full_name || user?.email || 'Anonymous',
      comment: commentText,
      timestamp: new Date().toISOString()
    };

    await addCommentMutation.mutateAsync({ postId, comment });
    setCommentInputs({ ...commentInputs, [commentKey]: '' });
    setExpandedComments({ ...expandedComments, [commentKey]: true });
  };

  const handleUpvotePost = (postId) => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }
    upvotePostMutation.mutate(postId);
  };

  const handleCastVote = (voteId, optionIndex) => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }

    if (hasUserVoted(voteId)) {
      alert('You have already voted in this poll!');
      return;
    }

    castVoteMutation.mutate({ voteId, optionIndex });
  };

  const handleCreateVote = () => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }

    if (!newVote.title.trim() || !newVote.end_date || newVote.options.filter(o => o.option.trim() !== '').length < 2) {
      alert('Please fill all required fields and ensure at least two options are provided.');
      return;
    }

    const validOptions = newVote.options.filter(opt => opt.option.trim() !== '');

    createVoteMutation.mutate({
      ...newVote,
      options: validOptions,
      total_votes: 0,
      status: 'active'
    });
  };

  const addVoteOption = () => {
    setNewVote({
      ...newVote,
      options: [...newVote.options, { option: "", votes: 0, voters: [], image_url: "" }]
    });
  };

  const removeVoteOption = (index) => {
    if (newVote.options.length <= 2) {
      alert('⚠️ You need at least 2 options!');
      return;
    }
    setNewVote({
      ...newVote,
      options: newVote.options.filter((_, idx) => idx !== index)
    });
  };

  const updateVoteOption = (index, field, value) => {
    const updated = [...newVote.options];
    updated[index] = { ...updated[index], [field]: value };
    setNewVote({ ...newVote, options: updated });
  };

  const hasUserVoted = (voteId) => {
    if (!user?.email) return false;
    const vote = votes.find(v => v.id === voteId);
    return vote?.options.some(opt => opt.voters?.includes(user.email));
  };

  const categories = [
    { value: "all", label: "All" },
    { value: "self_development", label: "Self Development" },
    { value: "leadership", label: "Leadership" },
    { value: "business", label: "Business" },
    { value: "marketing", label: "Marketing" },
    { value: "management", label: "Management" },
    { value: "sales", label: "Sales" },
    { value: "study_skills", label: "Study Skills" },
    { value: "general", label: "General" }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeVotes = votes.filter(v => v.status === 'active' && new Date(v.end_date) > new Date());
  const allVotesTotal = votes.reduce((sum, v) => sum + (v.total_votes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  const isAdmin = user?.admin_level === 'top_tier_admin' || user?.admin_level === 'super_admin' || user?.admin_level === 'supervisor_admin';

  const getTotalReactions = (reactions) => {
    if (!reactions) return 0;
    const initializedReactions = REACTIONS.reduce((acc, r) => {
      acc[r.type] = reactions[r.type] || [];
      return acc;
    }, {});
    return Object.values(initializedReactions).reduce((sum, arr) => sum + arr.length, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-none shadow-2xl overflow-hidden bg-white">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-10"></div>
              <CardContent className="relative p-8 lg:p-12">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">Community Hub</h1>
                      <p className="text-lg text-slate-600">Ask questions • Share knowledge • Vote on features</p>
                    </div>
                  </div>
                  {isAuthenticated && (
                    <div className="flex gap-3">
                      <Button onClick={() => setShowPostDialog(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600" size="lg">
                        <Plus className="w-5 h-5 mr-2" />New Post
                      </Button>
                      <Button onClick={() => setShowVoteDialog(true)} className="bg-gradient-to-r from-purple-600 to-pink-600" size="lg">
                        <Vote className="w-5 h-5 mr-2" />Create Poll
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">{posts.length}</div>
                  <p className="text-sm text-slate-600 font-medium">Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">{totalComments}</div>
                  <p className="text-sm text-slate-600 font-medium">Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">{activeVotes.length}</div>
                  <p className="text-sm text-slate-600 font-medium">Active Polls</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">{allVotesTotal}</div>
                  <p className="text-sm text-slate-600 font-medium">Total Votes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts">Discussion Posts</TabsTrigger>
            <TabsTrigger value="polls">Polls & Voting</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            <Card className="border-none shadow-xl bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence>
              {filteredPosts.map((post) => {
                const hasUserUpvoted = post.upvoters?.includes(user?.email);
                const reactions = REACTIONS.reduce((acc, r) => {
                  acc[r.type] = post.reactions?.[r.type] || [];
                  return acc;
                }, {});
                const totalReactions = getTotalReactions(reactions);
                const commentKey = `comment-${post.id}`;
                const showComments = expandedComments[commentKey];

                return (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-white">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`rounded-full ${hasUserUpvoted ? 'bg-blue-100 text-blue-600' : ''}`}
                              onClick={() => handleUpvotePost(post.id)}
                              disabled={!isAuthenticated}
                            >
                              <ArrowUp className="w-5 h-5" />
                            </Button>
                            <span className={`font-bold text-lg ${hasUserUpvoted ? 'text-blue-600' : ''}`}>
                              {post.upvotes || 0}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>{post.author_name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{post.author_name}</p>
                                <p className="text-xs text-slate-500">{format(new Date(post.created_date), 'MMM d, yyyy')}</p>
                              </div>
                              <Badge variant="outline" className="ml-auto">{post.category?.replace(/_/g, ' ')}</Badge>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{post.title}</h3>
                            <p className="text-slate-600 mb-4">{post.content}</p>
                            
                            {post.media_urls?.map((url, idx) => (
                              url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                <img key={idx} src={url} alt="Post media" className="rounded-lg max-w-full mb-2" />
                              ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video key={idx} src={url} controls className="rounded-lg max-w-full mb-2" />
                              ) : (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Attachment {idx + 1}</a>
                              )
                            ))}

                            <div className="flex items-center gap-4 pt-3 border-t">
                              <div className="flex gap-1">
                                {REACTIONS.map(reaction => {
                                  const count = reactions[reaction.type]?.length || 0;
                                  const hasReacted = reactions[reaction.type]?.includes(user?.email);

                                  return (
                                    <Button
                                      key={reaction.type}
                                      variant="ghost"
                                      size="sm"
                                      className={`rounded-full px-2 h-8 ${hasReacted ? 'bg-blue-100' : ''}`}
                                      onClick={() => handleReaction(post.id, reaction.type)}
                                      disabled={!isAuthenticated}
                                    >
                                      <span className="text-base">{reaction.emoji}</span>
                                      {count > 0 && <span className="ml-1 text-xs font-bold text-slate-700">{count}</span>}
                                    </Button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-6 text-sm text-slate-500 ml-auto">
                                {totalReactions > 0 && <span className="font-semibold">{totalReactions} reactions</span>}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setExpandedComments({ ...expandedComments, [commentKey]: !showComments })}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  {post.comments?.length || 0} comments
                                </Button>
                                {isAdmin && (
                                  <Button variant="ghost" size="sm" onClick={() => deletePostMutation.mutate(post.id)} className="text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {showComments && (
                              <div className="space-y-3 pt-4 border-t mt-4">
                                {(post.comments || []).map((comment) => (
                                  <div key={comment.id} className="flex gap-2">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                      <AvatarFallback>{comment.user_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="bg-slate-100 rounded-2xl px-4 py-2">
                                        <p className="font-semibold text-sm">{comment.user_name}</p>
                                        <p className="text-sm text-slate-700">{comment.comment}</p>
                                      </div>
                                      <p className="text-xs text-slate-400 mt-1 ml-4">{format(new Date(comment.timestamp), 'MMM d, h:mm a')}</p>
                                    </div>
                                  </div>
                                ))}

                                <div className="flex gap-2 pt-2">
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      placeholder="Write a comment..."
                                      value={commentInputs[commentKey] || ''}
                                      onChange={(e) => setCommentInputs({ ...commentInputs, [commentKey]: e.target.value })}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddComment(post.id);
                                        }
                                      }}
                                      className="rounded-full"
                                    />
                                    <Button
                                      size="icon"
                                      onClick={() => handleAddComment(post.id)}
                                      className="rounded-full flex-shrink-0"
                                      disabled={addCommentMutation.isPending}
                                    >
                                      {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredPosts.length === 0 && (
              <Card className="border-none shadow-xl bg-white">
                <CardContent className="p-16 text-center">
                  <MessageSquare className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No posts found</h3>
                  <p className="text-slate-500 mb-6">Be the first to start a discussion!</p>
                  {isAuthenticated && (
                    <Button onClick={() => setShowPostDialog(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                      <Plus className="w-5 h-5 mr-2" />Create First Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="polls" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {activeVotes.map((vote) => {
                const totalVotes = vote.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
                const hasVoted = hasUserVoted(vote.id);

                return (
                  <Card key={vote.id} className="border-none shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle>{vote.title}</CardTitle>
                      <p className="text-sm text-slate-600">{vote.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Ends: {format(new Date(vote.end_date), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>{totalVotes} votes</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vote.options.map((option, idx) => {
                        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                        return (
                          <div key={idx} className="space-y-2">
                            <Button
                              onClick={() => handleCastVote(vote.id, idx)}
                              disabled={hasVoted || !isAuthenticated}
                              variant={hasVoted && option.voters?.includes(user?.email) ? "default" : "outline"}
                              className="w-full justify-start"
                            >
                              {option.option}
                            </Button>
                            {hasVoted && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">{option.votes || 0} votes</span>
                                  <span className="font-bold text-blue-600">{percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {activeVotes.length === 0 && (
              <Card className="border-none shadow-xl bg-white">
                <CardContent className="p-16 text-center">
                  <Vote className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No active polls</h3>
                  <p className="text-slate-500 mb-6">Create a poll to gather community feedback!</p>
                  {isAuthenticated && (
                    <Button onClick={() => setShowVoteDialog(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                      <Plus className="w-5 h-5 mr-2" />Create Poll
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} placeholder="What's your question or topic?" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.value !== 'all').map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} placeholder="Describe..." rows={6} />
            </div>
            <div>
              <input type="file" onChange={handleMediaUpload} className="hidden" id="post-media-upload" multiple accept="image/*,video/*" />
              <Button onClick={() => document.getElementById('post-media-upload').click()} variant="outline" disabled={uploadingMedia}>
                {uploadingMedia ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Attach Media
              </Button>
              {newPost.media_urls.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {newPost.media_urls.map((url, idx) => (
                    <Badge key={idx} variant="secondary">Media {idx + 1}<X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeMedia(url)} /></Badge>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleCreatePost} className="w-full" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Poll Title</Label>
              <Input value={newVote.title} onChange={(e) => setNewVote({ ...newVote, title: e.target.value })} placeholder="What do you want to ask?" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newVote.description} onChange={(e) => setNewVote({ ...newVote, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Poll Type</Label>
              <Select value={newVote.type} onValueChange={(value) => setNewVote({ ...newVote, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="course">Course Topic</SelectItem>
                  <SelectItem value="project">Project Idea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Options</Label>
              {newVote.options.map((option, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input value={option.option} onChange={(e) => updateVoteOption(idx, 'option', e.target.value)} placeholder={`Option ${idx + 1}`} className="flex-1" />
                  {newVote.options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeVoteOption(idx)}><X className="w-4 h-4" /></Button>
                  )}
                </div>
              ))}
              <Button onClick={addVoteOption} variant="outline" size="sm" className="mt-2"><Plus className="w-4 h-4 mr-2" />Add Option</Button>
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={newVote.end_date} onChange={(e) => setNewVote({ ...newVote, end_date: e.target.value })} />
            </div>
            <Button onClick={handleCreateVote} className="w-full" disabled={createVoteMutation.isPending}>
              {createVoteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Vote className="w-4 h-4 mr-2" />}Create Poll
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}