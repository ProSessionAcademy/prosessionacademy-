
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Heart,
  MessageCircle,
  Share2,
  Briefcase,
  MapPin,
  Users,
  Award,
  Send,
  Image as ImageIcon,
  Video,
  Plus,
  Search,
  UserPlus,
  UserCheck,
  Settings,
  Camera,
  Grid,
  List,
  Sparkles,
  Building2,
  X,
  Check,
  MoreHorizontal,
  UserCircle,
  Loader2,
  Save,
  Mail,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  MapPinned,
  ExternalLink,
  Lock,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const REACTIONS = [
  { emoji: '👍', label: 'Like', key: 'like' },
  { emoji: '❤️', label: 'Love', key: 'love' },
  { emoji: '😂', label: 'Haha', key: 'haha' },
  { emoji: '😮', label: 'Wow', key: 'wow' },
  { emoji: '😢', label: 'Sad', key: 'sad' },
  { emoji: '🔥', label: 'Fire', key: 'fire' }
];

export default function CareerLink() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showStoryDialog, setShowStoryDialog] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [viewingStoriesFrom, setViewingStoriesFrom] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  
  const [newPost, setNewPost] = useState({
    content: '',
    media_urls: [],
    type: 'post'
  });

  const [newStory, setNewStory] = useState({
    media_url: '',
    caption: ''
  });

  const [newMessage, setNewMessage] = useState('');

  const [jobApplication, setJobApplication] = useState({
    user_name: '',
    user_email: '',
    resume_url: '',
    cover_letter: ''
  });

  const [newJob, setNewJob] = useState({
    company_name: '',
    job_title: '',
    job_type: 'full_time',
    description: '',
    location: '',
    category: 'technology',
    experience_level: 'entry',
    salary_range: '',
    remote_option: false,
    application_deadline: '',
    contact_email: ''
  });

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    headline: '',
    about: '',
    location: '',
    profile_picture_url: '',
    cover_image_url: '',
    current_position: '',
    current_company: '',
    skills: [],
    open_to_opportunities: false
  });

  const [newSkill, setNewSkill] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setNewJob({ ...newJob, contact_email: currentUser.email });
        
        // CHECK SUBSCRIPTION ACCESS
        if (currentUser.subscription_plan_id) {
          const plans = await base44.entities.SubscriptionPlan.filter({ id: currentUser.subscription_plan_id });
          const plan = plans[0];
          setUserPlan(plan);
          setHasAccess(plan?.features?.access_career_link === true);
        } else {
          setHasAccess(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setHasAccess(false); // Set access to false on error as well
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ['careerProfiles'],
    queryFn: () => base44.entities.CareerProfile.list('-updated_date'),
    initialData: [],
    refetchInterval: 2000,
    enabled: hasAccess, // ONLY fetch if user has access
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: () => base44.entities.JobApplication.filter({ status: 'active' }, '-posted_date'),
    initialData: [],
    enabled: hasAccess, // ONLY fetch if user has access
  });

  const { data: myProfile } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.CareerProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email && hasAccess, // ONLY fetch if user has access
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (myProfile) {
      setProfileForm({
        full_name: myProfile.full_name || '',
        headline: myProfile.headline || '',
        about: myProfile.about || '',
        location: myProfile.location || '',
        profile_picture_url: myProfile.profile_picture_url || '',
        cover_image_url: myProfile.cover_image_url || '',
        current_position: myProfile.current_position || '',
        current_company: myProfile.current_company || '',
        skills: myProfile.skills || [],
        open_to_opportunities: myProfile.open_to_opportunities || false
      });
      
      setJobApplication({
        user_name: myProfile.full_name || user.full_name || '',
        user_email: user.email || '',
        resume_url: '',
        cover_letter: ''
      });
    }
  }, [myProfile, user]);

  const createProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.CareerProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setShowEditProfileDialog(false);
      alert('✅ Profile created!');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CareerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data) => base44.entities.JobApplication.create({
      ...data,
      posted_date: new Date().toISOString(),
      status: 'active',
      views: 0,
      applicants: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      setShowJobDialog(false);
      setNewJob({
        company_name: '',
        job_title: '',
        job_type: 'full_time',
        description: '',
        location: '',
        category: 'technology',
        experience_level: 'entry',
        salary_range: '',
        remote_option: false,
        application_deadline: '',
        contact_email: user.email
      });
      alert('✅ Job posted!');
    },
  });

  const applyJobMutation = useMutation({
    mutationFn: async ({ jobId, applicationData }) => {
      const job = jobs.find(j => j.id === jobId);
      if (!job) throw new Error('Job not found');
      
      const applicant = {
        user_email: applicationData.user_email,
        user_name: applicationData.user_name,
        applied_date: new Date().toISOString(),
        status: 'pending',
        resume_url: applicationData.resume_url,
        cover_letter: applicationData.cover_letter
      };
      
      await base44.entities.JobApplication.update(jobId, {
        applicants: [...(job.applicants || []), applicant]
      });

      // SEND EMAIL NOTIFICATION TO JOB CREATOR
      try {
        await base44.integrations.Core.SendEmail({
          to: job.contact_email,
          subject: `New Application for ${job.job_title}`,
          body: `Dear Hiring Manager,

You have received a new application for the ${job.job_title} position at ${job.company_name}.

Applicant Details:
- Name: ${applicationData.user_name}
- Email: ${applicationData.user_email}
- Resume: ${applicationData.resume_url}

${applicationData.cover_letter ? `Cover Letter:\n${applicationData.cover_letter}\n\n` : ''}
Applied on: ${new Date().toLocaleDateString()}

Log in to Career Link to review the application.

Best regards,
Pro-Session Career Link Team`
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      setShowApplyDialog(false);
      setSelectedJob(null);
      setJobApplication({
        user_name: myProfile?.full_name || user.full_name || '',
        user_email: user.email || '',
        resume_url: '',
        cover_letter: ''
      });
      alert('✅ Application submitted! The employer has been notified via email.');
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ profileId, activityIndex, reactionKey }) => {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) throw new Error('Profile not found');
      
      const activities = [...(profile.activity_feed || [])];
      const activity = { ...(activities[activityIndex] || {}) };
      
      const reactions = { ...(activity.reactions || {}) };
      
      Object.keys(reactions).forEach(key => {
        reactions[key] = (reactions[key] || []).filter(email => email !== user.email);
      });
      
      const userHasThisReaction = (reactions[reactionKey] || []).includes(user.email);
      
      if (!userHasThisReaction) {
        reactions[reactionKey] = [...(reactions[reactionKey] || []), user.email];
      }
      
      activity.reactions = reactions;
      activities[activityIndex] = activity;

      await base44.entities.CareerProfile.update(profileId, {
        activity_feed: activities
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ profileId, activityIndex, comment }) => {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) throw new Error('Profile not found');
      
      const activities = [...(profile.activity_feed || [])];
      const activity = { ...(activities[activityIndex] || {}) };
      
      const commentObj = {
        user_email: user.email,
        user_name: myProfile?.full_name || user.full_name,
        comment: comment,
        date: new Date().toISOString(),
        profile_picture: myProfile?.profile_picture_url
      };

      activity.comments = [...(activity.comments || []), commentObj];
      activities[activityIndex] = activity;

      await base44.entities.CareerProfile.update(profileId, {
        activity_feed: activities
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
    },
  });

  const addStoryMutation = useMutation({
    mutationFn: async (storyData) => {
      if (!myProfile) throw new Error('Profile not found');
      
      const story = {
        type: 'story',
        media_url: storyData.media_url,
        caption: storyData.caption,
        date: new Date().toISOString(),
        views: [],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reactions: {},
        comments: []
      };

      const activities = [...(myProfile.activity_feed || [])];
      await base44.entities.CareerProfile.update(myProfile.id, {
        activity_feed: [story, ...activities]
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setShowStoryDialog(false);
      setNewStory({ media_url: '', caption: '' });
      alert('✅ Story posted!');
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ profileId, activity }) => {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) throw new Error('Profile not found');
      
      const activities = [...(profile.activity_feed || [])];
      await base44.entities.CareerProfile.update(profileId, {
        activity_feed: [activity, ...activities]
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.entities.PrivateMessage.create({
        sender_email: user.email,
        sender_name: myProfile?.full_name || user.full_name,
        recipient_email: messageData.recipient_email,
        recipient_name: messageData.recipient_name,
        message: messageData.message,
        context: 'career_link',
        read: false
      });
    },
    onSuccess: () => {
      setShowMessageDialog(false);
      setNewMessage('');
      alert('✅ Message sent!');
    },
  });

  const sendConnectionRequestMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const targetProfile = profiles.find(p => p.user_email === targetEmail);
      if (!targetProfile || !myProfile) return;

      const pendingRequests = targetProfile.pending_connection_requests || [];
      const sentRequests = myProfile.sent_connection_requests || [];

      await base44.entities.CareerProfile.update(targetProfile.id, {
        pending_connection_requests: [
          ...pendingRequests,
          {
            from_email: user.email,
            from_name: myProfile.full_name,
            request_date: new Date().toISOString()
          }
        ]
      });

      await base44.entities.CareerProfile.update(myProfile.id, {
        sent_connection_requests: [...sentRequests, targetEmail]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
      alert('✅ Connection request sent!');
    },
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: async (fromEmail) => {
      const fromProfile = profiles.find(p => p.user_email === fromEmail);
      if (!fromProfile || !myProfile) return;

      const myConnections = myProfile.connections || [];
      await base44.entities.CareerProfile.update(myProfile.id, {
        connections: [
          ...myConnections,
          {
            user_email: fromEmail,
            full_name: fromProfile.full_name,
            connected_date: new Date().toISOString()
          }
        ],
        pending_connection_requests: (myProfile.pending_connection_requests || []).filter(
          req => req.from_email !== fromEmail
        )
      });

      const theirConnections = fromProfile.connections || [];
      await base44.entities.CareerProfile.update(fromProfile.id, {
        connections: [
          ...theirConnections,
          {
            user_email: user.email,
            full_name: myProfile.full_name,
            connected_date: new Date().toISOString()
          }
        ],
        sent_connection_requests: (fromProfile.sent_connection_requests || []).filter(
          email => email !== user.email
        )
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
      alert('✅ Connection accepted!');
    },
  });

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewPost({ ...newPost, media_urls: [...newPost.media_urls, file_url] });
    } catch (error) {
      alert('❌ Upload failed');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleStoryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewStory({ ...newStory, media_url: file_url });
    } catch (error) {
      alert('❌ Upload failed');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setJobApplication({ ...jobApplication, resume_url: file_url });
      alert('✅ Resume uploaded!');
    } catch (error) {
      alert('❌ Upload failed');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleProfileImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileForm({ ...profileForm, [field]: file_url });
    } catch (error) {
      alert('❌ Upload failed');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!myProfile) {
      alert('Please create a profile first');
      setShowEditProfileDialog(true);
      setShowPostDialog(false);
      return;
    }
    
    if (!newPost.content.trim() && newPost.media_urls.length === 0) {
      alert('Please add content or media');
      return;
    }

    const activity = {
      type: 'post',
      content: newPost.content,
      date: new Date().toISOString(),
      media_url: newPost.media_urls[0] || null,
      reactions: {},
      comments: []
    };

    await addActivityMutation.mutateAsync({
      profileId: myProfile.id,
      activity
    });

    setNewPost({ content: '', media_urls: [], type: 'post' });
    setShowPostDialog(false);
  };

  const handleCreateStory = async () => {
    if (!myProfile) {
      alert('Please create a profile first');
      setShowEditProfileDialog(true);
      setShowStoryDialog(false);
      return;
    }
    
    if (!newStory.media_url) {
      alert('Please upload a photo or video for your story');
      return;
    }
    
    await addStoryMutation.mutateAsync(newStory);
  };

  const handleCreateJob = () => {
    if (!newJob.job_title || !newJob.company_name || !newJob.description || !newJob.location) {
      alert('Please fill all required fields');
      return;
    }
    createJobMutation.mutate(newJob);
  };

  const handleApplyToJob = () => {
    if (!jobApplication.user_name || !jobApplication.user_email) {
      alert('Please fill in your name and email');
      return;
    }
    
    if (!jobApplication.resume_url) {
      alert('Please upload your resume/CV');
      return;
    }

    applyJobMutation.mutate({
      jobId: selectedJob.id,
      applicationData: jobApplication
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      alert('Please write a message');
      return;
    }

    sendMessageMutation.mutate({
      recipient_email: messageRecipient.user_email,
      recipient_name: messageRecipient.full_name,
      message: newMessage
    });
  };

  const handleSaveProfile = () => {
    const data = {
      ...profileForm,
      user_email: user.email,
      last_updated: new Date().toISOString()
    };

    if (myProfile) {
      updateProfileMutation.mutate({ id: myProfile.id, data });
      setShowEditProfileDialog(false);
      alert('✅ Profile updated!');
    } else {
      createProfileMutation.mutate(data);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileForm.skills.includes(newSkill.trim())) {
      setProfileForm({
        ...profileForm,
        skills: [...profileForm.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleAddComment = async (profileId, activityIndex) => {
    const commentKey = `${profileId}-${activityIndex}`;
    const comment = commentInputs[commentKey];
    
    if (!comment?.trim()) {
      alert('Please write a comment');
      return;
    }

    await addCommentMutation.mutateAsync({
      profileId,
      activityIndex,
      comment: comment
    });

    setCommentInputs({ ...commentInputs, [commentKey]: '' });
    
    setExpandedComments({
      ...expandedComments,
      [commentKey]: true
    });
  };

  const handleReaction = async (profileId, activityIndex, reactionKey) => {
    await addReactionMutation.mutateAsync({
      profileId,
      activityIndex,
      reactionKey
    });
  };

  const handleSharePost = (item) => {
    const appBaseUrl = window.location.origin; // Get base URL of the application
    const careerLinkPath = createPageUrl('CareerLink'); // Get the relative path for CareerLink
    const shareUrl = `${appBaseUrl}${careerLinkPath}`; // Construct the full absolute URL for sharing
    
    const shareText = `Check out this post on Career Link by ${item.profile.full_name}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent('Check out this post')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    
    const openShareMenu = () => {
      const menu = document.createElement('div');
      menu.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-end justify-center p-4';
      menu.onclick = (e) => {
        if (e.target === menu) menu.remove();
      };
      
      const content = document.createElement('div');
      content.className = 'bg-white rounded-t-3xl w-full max-w-md p-6 space-y-3 animate-slide-up'; // animate-slide-up needs to be defined in CSS
      content.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-center">Share Post</h3>
        <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-100 transition-colors">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <span class="text-white text-xl">📱</span>
          </div>
          <span class="font-semibold">WhatsApp</span>
        </a>
        <a href="${facebookUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-100 transition-colors">
          <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span class="text-white text-xl">f</span>
          </div>
          <span class="font-semibold">Facebook</span>
        </a>
        <a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-100 transition-colors">
          <div class="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
            <span class="text-white text-xl">in</span>
          </div>
          <span class="font-semibold">LinkedIn</span>
        </a>
        <a href="${twitterUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-100 transition-colors">
          <div class="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
            <span class="text-white text-xl">𝕏</span>
          </div>
          <span class="font-semibold">Twitter / X</span>
        </a>
        <a href="${emailUrl}" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-100 transition-colors">
          <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <span class="text-white text-xl">✉️</span>
          </div>
          <span class="font-semibold">Email</span>
        </a>
        <button onclick="navigator.clipboard.writeText('${shareUrl.replace(/'/g, '\\\'')}');alert('✅ Link copied!');this.closest('.fixed').remove()" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-100 transition-colors w-full">
          <div class="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
            <span class="text-white text-xl">🔗</span>
          </div>
          <span class="font-semibold">Copy Link</span>
        </button>
        <button onclick="this.closest('.fixed').remove()" class="w-full p-4 bg-slate-100 rounded-xl font-semibold mt-2">Cancel</button>
      `;
      
      menu.appendChild(content);
      document.body.appendChild(menu);
    };
    
    openShareMenu();
  };

  const handleViewStory = (storyProfile) => {
    setViewingStoriesFrom(storyProfile);
    setCurrentStoryIndex(0);
    setShowStoryViewer(true);
    
    // Auto-advance story after 5 seconds
    const timer = setTimeout(() => {
      nextStory();
    }, 5000);
    
    // Clear timer if component unmounts or story changes
    return () => clearTimeout(timer);
  };

  const nextStory = () => {
    if (viewingStoriesFrom && currentStoryIndex < viewingStoriesFrom.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setTimeout(() => {
        nextStory();
      }, 5000);
    } else {
      const currentUserIndex = activeStories.findIndex(s => s.profile.id === viewingStoriesFrom?.profile.id);
      if (currentUserIndex < activeStories.length - 1) {
        const nextUser = activeStories[currentUserIndex + 1];
        setViewingStoriesFrom(nextUser);
        setCurrentStoryIndex(0);
        setTimeout(() => {
          nextStory();
        }, 5000);
      } else {
        setShowStoryViewer(false);
      }
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      const currentUserIndex = activeStories.findIndex(s => s.profile.id === viewingStoriesFrom?.profile.id);
      if (currentUserIndex > 0) {
        const prevUser = activeStories[currentUserIndex - 1];
        setViewingStoriesFrom(prevUser);
        setCurrentStoryIndex(prevUser.stories.length - 1);
      }
    }
  };

  const isConnected = (profileEmail) => {
    return myProfile?.connections?.some(c => c.user_email === profileEmail);
  };

  const hasPendingRequest = (profileEmail) => {
    return myProfile?.sent_connection_requests?.includes(profileEmail);
  };

  const getConnectionStatus = (profile) => {
    if (profile.user_email === user?.email) return 'self';
    if (isConnected(profile.user_email)) return 'connected';
    if (hasPendingRequest(profile.user_email)) return 'pending';
    return 'not_connected';
  };

  const getUserReaction = (activity) => {
    if (!activity.reactions) return null;
    for (const [key, emails] of Object.entries(activity.reactions)) {
      if ((emails || []).includes(user.email)) {
        return REACTIONS.find(r => r.key === key);
      }
    }
    return null;
  };

  const getTotalReactions = (activity) => {
    if (!activity.reactions) return 0;
    return Object.values(activity.reactions).reduce((sum, emails) => sum + (emails || []).length, 0);
  };

  const getReactionBreakdown = (activity) => {
    if (!activity.reactions) return [];
    return Object.entries(activity.reactions)
      .filter(([_, emails]) => (emails || []).length > 0)
      .map(([key, emails]) => ({
        reaction: REACTIONS.find(r => r.key === key),
        count: (emails || []).length
      }))
      .sort((a, b) => b.count - a.count);
  };

  const hasAppliedToJob = (job) => {
    return job.applicants?.some(a => a.user_email === user.email);
  };

  // Filtered profiles for the "Network" tab (excludes current user and connected users)
  const networkFilteredProfiles = profiles.filter(p => 
    p.user_email !== user?.email &&
    !isConnected(p.user_email) && // Exclude connected users
    !hasPendingRequest(p.user_email) && // Exclude profiles I've sent requests to
    !(myProfile?.pending_connection_requests || []).some(req => req.from_email === p.user_email) && // Exclude profiles that sent me requests
    (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.current_company?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered profiles for the "People" tab (includes all users matching search)
  const allProfilesFilteredBySearch = profiles.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(searchLower) ||
      p.headline?.toLowerCase().includes(searchLower) ||
      p.location?.toLowerCase().includes(searchLower) ||
      p.current_company?.toLowerCase().includes(searchLower) ||
      p.current_position?.toLowerCase().includes(searchLower) ||
      (p.skills || []).some(skill => skill.toLowerCase().includes(searchLower))
    );
  });

  const feedItems = profiles
    .flatMap((profile) => 
      (profile.activity_feed || [])
        .map((activity, activityIdx) => ({
          ...activity,
          profile,
          profileId: profile.id,
          activityIndex: activityIdx
        }))
    )
    .filter(item => item.type !== 'story')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const activeStories = profiles
    .map(profile => {
      const stories = (profile.activity_feed || [])
        .filter(activity => 
          activity.type === 'story' && 
          activity.expires_at &&
          new Date(activity.expires_at) > new Date()
        );
      
      if (stories.length > 0) {
        return {
          profile,
          stories
        };
      }
      return null;
    })
    .filter(Boolean);

  const myActiveStories = myProfile ? activeStories.find(s => s.profile.id === myProfile.id) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  // ACCESS CONTROL
  if (user && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <Card className="max-w-2xl border-none shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">🔒 Career Link Locked</h2>
            <p className="text-slate-600 mb-8">Upgrade to access professional networking and job opportunities!</p>
            
            <Link to={createPageUrl("Subscription")}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 px-8 text-xl font-bold shadow-xl">
                <Crown className="w-6 h-6 mr-2" />
                View Plans & Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <UserCircle className="w-20 h-20 text-slate-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">Join Career Link</h3>
            <p className="text-slate-600 mb-6">Connect with professionals and showcase your career</p>
            <Button onClick={() => base44.auth.redirectToLogin()} size="lg" className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                Career Link
              </h1>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search people, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPostDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Post</span>
              </Button>
              <Button
                onClick={() => setShowEditProfileDialog(true)}
                variant="ghost"
                size="icon"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
                {myProfile?.cover_image_url && (
                  <img src={myProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                )}
              </div>
              
              <CardContent className="p-6 text-center -mt-12">
                <div className="relative inline-block mb-4">
                  {myActiveStories ? (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-1 cursor-pointer" onClick={() => handleViewStory(myActiveStories)}>
                      <Avatar className="w-full h-full border-2 border-white">
                        <AvatarImage src={myProfile?.profile_picture_url} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                      <AvatarImage src={myProfile?.profile_picture_url} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <button
                    onClick={() => setShowStoryDialog(true)}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>

                <h3 className="font-bold text-lg mb-1">{myProfile?.full_name || user.full_name}</h3>
                <p className="text-sm text-slate-600 mb-3">{myProfile?.headline || 'Add your headline'}</p>
                
                {myProfile?.location && (
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />
                    {myProfile.location}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 py-3 border-t border-b text-sm">
                  <div>
                    <div className="font-bold text-blue-600">{myProfile?.connections?.length || 0}</div>
                    <div className="text-xs text-slate-600">Connections</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-600">{myProfile?.profile_views || 0}</div>
                    <div className="text-xs text-slate-600">Views</div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowEditProfileDialog(true)}
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                >
                  Edit Profile
                </Button>

                {myProfile?.open_to_opportunities && (
                  <Badge className="mt-3 bg-green-600">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Open to Opportunities
                  </Badge>
                )}
              </CardContent>
            </Card>

            {myProfile?.pending_connection_requests?.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-bold">🔔 Connection Requests ({myProfile.pending_connection_requests.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myProfile.pending_connection_requests.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={profiles.find(p => p.user_email === req.from_email)?.profile_picture_url} />
                        <AvatarFallback className="bg-blue-600 text-white">{req.from_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{req.from_name}</p>
                        <p className="text-xs text-slate-500">Wants to connect</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => acceptConnectionMutation.mutate(req.from_email)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={async () => {
                            await base44.entities.CareerProfile.update(myProfile.id, {
                              pending_connection_requests: (myProfile.pending_connection_requests || []).filter(
                                r => r.from_email !== req.from_email
                              )
                            });
                            queryClient.invalidateQueries({ queryKey: ['careerProfiles'] });
                            alert('✅ Request rejected');
                          }}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          </div>

          <div className="lg:col-span-6 space-y-6">
            {activeStories.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Stories
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {activeStories.map((item) => {
                      const isMyStory = item.profile.user_email === user?.email;
                      
                      return (
                        <div
                          key={item.profile.id}
                          onClick={() => handleViewStory(item)}
                          className="flex-shrink-0 cursor-pointer group"
                        >
                          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-1">
                            <div className="w-full h-full rounded-full bg-white p-0.5">
                              <Avatar className="w-full h-full">
                                <AvatarImage src={item.profile.profile_picture_url} />
                                <AvatarFallback>{item.profile.full_name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                          <p className="text-xs text-center mt-1 truncate w-20 font-medium text-slate-700">
                            {isMyStory ? 'Your Story' : item.profile.full_name?.split(' ')[0]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6">
                <Card className="border-none shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={myProfile?.profile_picture_url} />
                        <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => setShowPostDialog(true)}
                        className="flex-1 text-left px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                      >
                        What's on your mind?
                      </button>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setShowPostDialog(true)}>
                        <ImageIcon className="w-5 h-5 mr-2 text-green-600" />
                        Photo
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowPostDialog(true)}>
                        <Video className="w-5 h-5 mr-2 text-red-600" />
                        Video
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowStoryDialog(true)}>
                        <Camera className="w-5 h-5 mr-2 text-purple-600" />
                        Story
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <AnimatePresence>
                  {feedItems.map((item) => {
                    const userReaction = getUserReaction(item);
                    const totalReactions = getTotalReactions(item);
                    const reactionBreakdown = getReactionBreakdown(item);
                    const commentKey = `${item.profileId}-${item.activityIndex}`;
                    const showComments = expandedComments[commentKey];
                    const isPostOwnerConnected = isConnected(item.profile.user_email) || item.profile.user_email === user.email;
                    
                    return (
                      <motion.div
                        key={`${item.profileId}-${item.activityIndex}-${item.date}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-none shadow-lg overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="cursor-pointer" onClick={() => {
                                  setSelectedProfile(item.profile);
                                  setShowProfileDialog(true);
                                }}>
                                  <AvatarImage src={item.profile.profile_picture_url} />
                                  <AvatarFallback>{item.profile.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold hover:underline cursor-pointer" onClick={() => {
                                    setSelectedProfile(item.profile);
                                    setShowProfileDialog(true);
                                  }}>
                                    {item.profile.full_name}
                                  </p>
                                  <p className="text-xs text-slate-500">{item.profile.headline}</p>
                                  <p className="text-xs text-slate-400">{format(new Date(item.date), 'MMM d, h:mm a')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.profile.user_email !== user.email && isPostOwnerConnected && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setMessageRecipient(item.profile);
                                      setShowMessageDialog(true);
                                    }}
                                  >
                                    <Mail className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Message</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0 space-y-3">
                            {item.content && (
                              <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                            )}

                            {item.media_url && (
                              <div className="rounded-xl overflow-hidden -mx-6">
                                {item.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img src={item.media_url} alt="Post" className="w-full object-cover" />
                                ) : (
                                  <video src={item.media_url} controls className="w-full" />
                                )}
                              </div>
                            )}

                            {totalReactions > 0 && (
                              <div className="flex items-center justify-between text-sm text-slate-600 pt-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1">
                                    {reactionBreakdown.slice(0, 3).map((rb, i) => (
                                      <span key={i} className="text-xl bg-white rounded-full border-2 border-white shadow-sm">
                                        {rb.reaction?.emoji}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="font-semibold text-blue-600">{totalReactions}</span>
                                </div>
                                <button
                                  onClick={() => setExpandedComments({ ...expandedComments, [commentKey]: !showComments })}
                                  className="hover:underline"
                                >
                                  {(item.comments || []).length} comments
                                </button>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="flex-1">
                                    {userReaction ? (
                                      <>
                                        <span className="text-xl mr-2">{userReaction.emoji}</span>
                                        <span className="text-blue-600 font-semibold">{userReaction.label}</span>
                                      </>
                                    ) : (
                                      <>
                                        <ThumbsUp className="w-5 h-5 mr-2" />
                                        Like
                                      </>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="start">
                                  <div className="flex gap-3">
                                    {REACTIONS.map((reaction) => (
                                      <button
                                        key={reaction.key}
                                        onClick={() => handleReaction(item.profileId, item.activityIndex, reaction.key)}
                                        className="text-3xl hover:scale-125 transition-transform active:scale-150"
                                        title={reaction.label}
                                      >
                                        {reaction.emoji}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                                onClick={() => setExpandedComments({ ...expandedComments, [commentKey]: !showComments })}
                              >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Comment
                              </Button>

                              <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleSharePost(item)}>
                                <Share2 className="w-5 h-5 mr-2" />
                                Share
                              </Button>
                            </div>

                            {showComments && (
                              <div className="space-y-3 pt-3 border-t">
                                {(item.comments || []).map((comment, cIdx) => (
                                  <div key={cIdx} className="flex gap-2">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                      <AvatarImage src={comment.profile_picture} />
                                      <AvatarFallback>{comment.user_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="bg-slate-100 rounded-2xl px-4 py-2">
                                        <p className="font-semibold text-sm">{comment.user_name}</p>
                                        <p className="text-sm text-slate-700">{comment.comment}</p>
                                      </div>
                                      <p className="text-xs text-slate-400 mt-1 ml-4">
                                        {format(new Date(comment.date), 'MMM d, h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                ))}

                                <div className="flex gap-2 pt-2">
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={myProfile?.profile_picture_url} />
                                    <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      placeholder="Write a comment..."
                                      value={commentInputs[commentKey] || ''}
                                      onChange={(e) => setCommentInputs({ ...commentInputs, [commentKey]: e.target.value })}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddComment(item.profileId, item.activityIndex);
                                        }
                                      }}
                                      className="rounded-full"
                                    />
                                    <Button
                                      size="icon"
                                      onClick={() => handleAddComment(item.profileId, item.activityIndex)}
                                      className="rounded-full flex-shrink-0"
                                      disabled={addCommentMutation.isPending}
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {feedItems.length === 0 && (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-16 text-center">
                      <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No posts yet</h3>
                      <p className="text-slate-600 mb-6">Start sharing your professional journey!</p>
                      <Button onClick={() => setShowPostDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Post
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="network" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Discover Professionals</h2>
                  <div className="flex gap-2">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
                  {networkFilteredProfiles.map((profile) => {
                    const status = getConnectionStatus(profile);

                    return (
                      <Card key={profile.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-16 h-16 cursor-pointer" onClick={() => {
                              setSelectedProfile(profile);
                              setShowProfileDialog(true);
                            }}>
                              <AvatarImage src={profile.profile_picture_url} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                {profile.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg mb-1">{profile.full_name}</h3>
                              <p className="text-sm text-slate-600 mb-2 line-clamp-2">{profile.headline}</p>
                              {profile.current_company && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                  <Building2 className="w-3 h-3" />
                                  {profile.current_company}
                                </p>
                              )}
                              {profile.location && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                                  <MapPin className="w-3 h-3" />
                                  {profile.location}
                                </p>
                              )}

                              <div className="flex gap-2">
                                {status === 'connected' ? (
                                  <>
                                    <Button size="sm" variant="outline" className="flex-1">
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Connected
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setMessageRecipient(profile);
                                      setShowMessageDialog(true);
                                    }}>
                                      <Mail className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : status === 'pending' ? (
                                  <Button size="sm" variant="outline" className="w-full" disabled>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Pending
                                  </Button>
                                ) : (
                                  <Button size="sm" className="w-full bg-blue-600" onClick={() => sendConnectionRequestMutation.mutate(profile.user_email)}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Connect
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {networkFilteredProfiles.length === 0 && (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-16 text-center">
                      <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
                      <p className="text-slate-600">Try adjusting your search or check the People tab</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="people" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">All Professionals</h2>
                  <div className="flex gap-2">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
                  {allProfilesFilteredBySearch.map((profile) => {
                    const status = getConnectionStatus(profile);
                    const isMe = profile.user_email === user?.email;

                    return (
                      <Card key={profile.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-16 h-16 cursor-pointer" onClick={() => {
                              setSelectedProfile(profile);
                              setShowProfileDialog(true);
                            }}>
                              <AvatarImage src={profile.profile_picture_url} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                {profile.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg mb-1 cursor-pointer hover:underline" onClick={() => {
                                setSelectedProfile(profile);
                                setShowProfileDialog(true);
                              }}>
                                {profile.full_name}
                                {isMe && <Badge className="ml-2 bg-blue-600">You</Badge>}
                              </h3>
                              <p className="text-sm text-slate-600 mb-2 line-clamp-2">{profile.headline}</p>
                              {profile.current_company && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                  <Building2 className="w-3 h-3" />
                                  {profile.current_company}
                                </p>
                              )}
                              {profile.location && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                                  <MapPin className="w-3 h-3" />
                                  {profile.location}
                                </p>
                              )}

                              {!isMe && (
                                <div className="flex gap-2">
                                  {status === 'connected' ? (
                                    <>
                                      <Button size="sm" variant="outline" className="flex-1">
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Connected
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => {
                                        setMessageRecipient(profile);
                                        setShowMessageDialog(true);
                                      }}>
                                        <Mail className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : status === 'pending' ? (
                                    <Button size="sm" variant="outline" className="w-full" disabled>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Pending
                                    </Button>
                                  ) : (
                                    <Button size="sm" className="w-full bg-blue-600" onClick={() => sendConnectionRequestMutation.mutate(profile.user_email)}>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Connect
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {allProfilesFilteredBySearch.length === 0 && (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-16 text-center">
                      <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No professionals yet</h3>
                      <p className="text-slate-600">Be one of the first to create a profile!</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="jobs" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Job Opportunities</h2>
                  <Button onClick={() => setShowJobDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Post Job
                  </Button>
                </div>

                <div className="space-y-4">
                  {jobs.map((job) => {
                    const hasApplied = hasAppliedToJob(job);
                    
                    return (
                      <Card key={job.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge>{job.job_type?.replace(/_/g, ' ')}</Badge>
                                <Badge variant="outline">{job.category}</Badge>
                                {job.remote_option && <Badge className="bg-green-600">Remote</Badge>}
                              </div>
                              <CardTitle className="text-2xl mb-2">{job.job_title}</CardTitle>
                              <p className="text-lg text-slate-600 font-semibold">{job.company_name}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <MapPinned className="w-4 h-4" />
                              {job.location}
                            </div>
                            {job.salary_range && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {job.salary_range}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {job.experience_level}
                            </div>
                            {job.application_deadline && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Deadline: {format(new Date(job.application_deadline), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>

                          <p className="text-slate-700 leading-relaxed">{job.description}</p>

                          <div className="flex gap-2">
                            {hasApplied ? (
                              <Button variant="outline" className="flex-1" disabled>
                                <Check className="w-4 h-4 mr-2" />
                                Applied
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  setSelectedJob(job);
                                  setShowApplyDialog(true);
                                }}
                                className="flex-1 bg-blue-600"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Apply Now
                              </Button>
                            )}
                            {job.application_url && (
                              <Button variant="outline" asChild>
                                <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  External
                                </a>
                              </Button>
                            )}
                          </div>

                          <div className="text-xs text-slate-500">
                            Posted {format(new Date(job.posted_date), 'MMM d, yyyy')} • {job.applicants?.length || 0} applicants
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {jobs.length === 0 && (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-16 text-center">
                      <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No job postings yet</h3>
                      <p className="text-slate-600 mb-6">Be the first to post a job opportunity!</p>
                      <Button onClick={() => setShowJobDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Post First Job
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Suggested for You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {networkFilteredProfiles.slice(0, 5).map((profile) => (
                  <div key={profile.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 cursor-pointer" onClick={() => {
                      setSelectedProfile(profile);
                      setShowProfileDialog(true);
                    }}>
                      <AvatarImage src={profile.profile_picture_url} />
                      <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{profile.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{profile.headline}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => sendConnectionRequestMutation.mutate(profile.user_email)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Trending Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Leadership', 'Communication', 'Sales', 'Marketing', 'Design', 'Development'].map((skill) => (
                    <Badge key={skill} variant="outline" className="cursor-pointer hover:bg-blue-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={myProfile?.profile_picture_url} />
                <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{myProfile?.full_name || user.full_name}</p>
                <p className="text-xs text-slate-500">{myProfile?.headline}</p>
              </div>
            </div>

            <Textarea
              placeholder="What do you want to share?"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              rows={6}
              className="resize-none"
            />

            {newPost.media_urls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {newPost.media_urls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="" className="rounded-lg w-full h-32 object-cover" />
                    <button
                      onClick={() => setNewPost({ ...newPost, media_urls: newPost.media_urls.filter((_, i) => i !== idx) })}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input type="file" onChange={handleMediaUpload} className="hidden" id="post-media-upload" accept="image/*,video/*" />
              <Button onClick={() => document.getElementById('post-media-upload').click()} variant="outline" disabled={uploadingMedia}>
                {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                Add Media
              </Button>
            </div>

            <Button onClick={handleCreatePost} className="w-full" disabled={addActivityMutation.isPending}>
              {addActivityMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Share a photo or video visible for 24 hours</p>
            
            {newStory.media_url ? (
              <div className="relative">
                {newStory.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={newStory.media_url} alt="Story" className="w-full rounded-lg" />
                ) : (
                  <video src={newStory.media_url} controls className="w-full rounded-lg" />
                )}
                <button onClick={() => setNewStory({ ...newStory, media_url: '' })} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <input type="file" onChange={handleStoryUpload} className="hidden" id="story-upload" accept="image/*,video/*" />
                <Button onClick={() => document.getElementById('story-upload').click()} variant="outline" className="w-full h-32" disabled={uploadingMedia}>
                  {uploadingMedia ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                      <p>Upload Photo/Video</p>
                    </div>
                  )}
                </Button>
              </>
            )}

            <Input placeholder="Add a caption (optional)" value={newStory.caption} onChange={(e) => setNewStory({ ...newStory, caption: e.target.value })} />

            <Button onClick={handleCreateStory} className="w-full" disabled={!newStory.media_url || addStoryMutation.isPending}>
              {addStoryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Share Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.job_title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-lg">{selectedJob.job_title}</p>
                <p className="text-sm text-slate-600">{selectedJob.company_name}</p>
              </div>

              <div>
                <Label>Full Name *</Label>
                <Input
                  value={jobApplication.user_name}
                  onChange={(e) => setJobApplication({ ...jobApplication, user_name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  value={jobApplication.user_email}
                  onChange={(e) => setJobApplication({ ...jobApplication, user_email: e.target.value })}
                  placeholder="your.email@example.com"
                  type="email"
                />
              </div>

              <div>
                <Label>Upload Resume/CV *</Label>
                <input
                  type="file"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => document.getElementById('resume-upload').click()}
                    variant="outline"
                    className="flex-1"
                    disabled={uploadingResume}
                  >
                    {uploadingResume ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    {jobApplication.resume_url ? 'Change Resume' : 'Upload Resume'}
                  </Button>
                  {jobApplication.resume_url && (
                    <Button variant="outline" asChild>
                      <a href={jobApplication.resume_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
                {jobApplication.resume_url && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Resume uploaded successfully
                  </p>
                )}
              </div>

              <div>
                <Label>Cover Letter / Message (Optional)</Label>
                <Textarea
                  value={jobApplication.cover_letter}
                  onChange={(e) => setJobApplication({ ...jobApplication, cover_letter: e.target.value })}
                  placeholder="Why are you interested in this position? What makes you a great fit?"
                  rows={6}
                />
              </div>

              <Button
                onClick={handleApplyToJob}
                className="w-full"
                disabled={applyJobMutation.isPending}
              >
                {applyJobMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Application
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Job Opening</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Job Title *</Label>
                <Input value={newJob.job_title} onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })} placeholder="e.g., Senior Developer" />
              </div>
              <div>
                <Label>Company Name *</Label>
                <Input value={newJob.company_name} onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })} placeholder="Your company" />
              </div>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} rows={5} placeholder="Describe the role..." />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Job Type</Label>
                <Select value={newJob.job_type} onValueChange={(v) => setNewJob({ ...newJob, job_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newJob.category} onValueChange={(v) => setNewJob({ ...newJob, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Location *</Label>
                <Input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="City, Country" />
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select value={newJob.experience_level} onValueChange={(v) => setNewJob({ ...newJob, experience_level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Salary Range</Label>
                <Input value={newJob.salary_range} onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })} placeholder="e.g., $50,000 - $70,000" />
              </div>
              <div>
                <Label>Application Deadline</Label>
                <Input type="date" value={newJob.application_deadline} onChange={(e) => setNewJob({ ...newJob, application_deadline: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={newJob.remote_option} onChange={(e) => setNewJob({ ...newJob, remote_option: e.target.checked })} className="w-4 h-4" />
              <Label>Remote work available</Label>
            </div>

            <Button onClick={handleCreateJob} className="w-full" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Post Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStoryViewer} onOpenChange={(open) => {
        setShowStoryViewer(open);
        if (!open) {
          setViewingStoriesFrom(null);
          setCurrentStoryIndex(0);
        }
      }}>
        <DialogContent className="max-w-md p-0 bg-black border-none">
          {viewingStoriesFrom && viewingStoriesFrom.stories[currentStoryIndex] && (
            <div className="relative aspect-[9/16] bg-black">
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                {viewingStoriesFrom.stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: idx < currentStoryIndex ? '100%' : '0%' }}
                      animate={{ width: idx === currentStoryIndex ? '100%' : idx < currentStoryIndex ? '100%' : '0%' }}
                      transition={{ duration: idx === currentStoryIndex ? 5 : 0 }}
                    />
                  </div>
                ))}
              </div>

              <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-3 mt-4">
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarImage src={viewingStoriesFrom.profile.profile_picture_url} />
                  <AvatarFallback>{viewingStoriesFrom.profile.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{viewingStoriesFrom.profile.full_name}</p>
                  <p className="text-xs text-white/80">{format(new Date(viewingStoriesFrom.stories[currentStoryIndex].date), 'h:mm a')}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowStoryViewer(false)} className="text-white hover:bg-white/20">
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="w-full h-full flex items-center justify-center">
                {viewingStoriesFrom.stories[currentStoryIndex].media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={viewingStoriesFrom.stories[currentStoryIndex].media_url} alt="Story" className="max-w-full max-h-full object-contain" />
                ) : (
                  <video src={viewingStoriesFrom.stories[currentStoryIndex].media_url} controls className="max-w-full max-h-full object-contain" />
                )}
              </div>

              {viewingStoriesFrom.stories[currentStoryIndex].caption && (
                <div className="absolute bottom-8 left-4 right-4 z-20">
                  <p className="text-white text-center text-sm bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                    {viewingStoriesFrom.stories[currentStoryIndex].caption}
                  </p>
                </div>
              )}

              {(currentStoryIndex > 0 || activeStories.findIndex(s => s.profile.id === viewingStoriesFrom.profile.id) > 0) && (
                <button onClick={prevStory} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              
              <button onClick={nextStory} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute inset-0 flex z-10">
                <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
                <div className="w-1/3 h-full" />
                <div className="w-1/3 h-full cursor-pointer" onClick={nextStory} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          {messageRecipient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={messageRecipient.profile_picture_url} />
                  <AvatarFallback>{messageRecipient.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{messageRecipient.full_name}</p>
                  <p className="text-sm text-slate-500">{messageRecipient.headline}</p>
                </div>
              </div>

              <Textarea placeholder="Write your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={4} />

              <Button onClick={handleSendMessage} className="w-full" disabled={sendMessageMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Your Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold mb-2 block">Cover Image</label>
              <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden">
                {profileForm.cover_image_url && (
                  <img src={profileForm.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                )}
                <input type="file" onChange={(e) => handleProfileImageUpload(e, 'cover_image_url')} className="hidden" id="cover-upload" accept="image/*" />
                <Button onClick={() => document.getElementById('cover-upload').click()} size="sm" className="absolute bottom-2 right-2" disabled={uploadingMedia}>
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Profile Picture</label>
              <div className="flex items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileForm.profile_picture_url} />
                  <AvatarFallback>{profileForm.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <input type="file" onChange={(e) => handleProfileImageUpload(e, 'profile_picture_url')} className="hidden" id="profile-upload" accept="image/*" />
                <Button onClick={() => document.getElementById('profile-upload').click()} variant="outline" disabled={uploadingMedia}>
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={profileForm.location} onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Professional Headline</Label>
              <Input value={profileForm.headline} onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })} placeholder="e.g., Marketing Manager" />
            </div>

            <div>
              <Label>About</Label>
              <Textarea value={profileForm.about} onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })} rows={4} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Current Position</Label>
                <Input value={profileForm.current_position} onChange={(e) => setProfileForm({ ...profileForm, current_position: e.target.value })} />
              </div>
              <div>
                <Label>Current Company</Label>
                <Input value={profileForm.current_company} onChange={(e) => setProfileForm({ ...profileForm, current_company: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill" onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()} />
                <Button onClick={handleAddSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileForm.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                    <button onClick={() => setProfileForm({ ...profileForm, skills: profileForm.skills.filter((_, i) => i !== idx) })} className="ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={profileForm.open_to_opportunities} onChange={(e) => setProfileForm({ ...profileForm, open_to_opportunities: e.target.checked })} className="w-4 h-4" />
              <Label>Open to job opportunities</Label>
            </div>

            <Button onClick={handleSaveProfile} className="w-full" disabled={createProfileMutation.isPending || updateProfileMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProfile && (
            <div className="space-y-6">
              <div className="relative">
                <div className="h-40 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg overflow-hidden">
                  {selectedProfile.cover_image_url && (
                    <img src={selectedProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                  )}
                </div>
                <Avatar className="w-32 h-32 absolute -bottom-16 left-6 border-4 border-white">
                  <AvatarImage src={selectedProfile.profile_picture_url} />
                  <AvatarFallback className="text-3xl">{selectedProfile.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="pt-16 px-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{selectedProfile.full_name}</h2>
                    <p className="text-lg text-slate-600 mb-3">{selectedProfile.headline}</p>
                    {selectedProfile.location && (
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedProfile.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {getConnectionStatus(selectedProfile) === 'not_connected' && (
                      <Button onClick={() => sendConnectionRequestMutation.mutate(selectedProfile.user_email)} className="bg-blue-600">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                    {getConnectionStatus(selectedProfile) === 'connected' && (
                      <Button onClick={() => {
                        setMessageRecipient(selectedProfile);
                        setShowMessageDialog(true);
                        setShowProfileDialog(false);
                      }} variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    )}
                  </div>
                </div>

                {selectedProfile.about && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 leading-relaxed">{selectedProfile.about}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedProfile.skills?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
