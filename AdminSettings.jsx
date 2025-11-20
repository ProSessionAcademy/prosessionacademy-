
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Brain,
  Heart,
  Plus,
  Edit,
  Trash2,
  Save,
  Video,
  Sparkles,
  Loader2,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Lock,
  Unlock,
  Download,
  FileVideo,
  Volume2,
  Mic,
  Target,
  Phone,
  MessageCircle,
  Store,
  Users,
  Crown,
  Shield,
  UserCog,
  AlertTriangle,
  PlayCircle,
  BookOpen
} from "lucide-react";

// Assuming createPageUrl is available globally or imported from a utility file
// If it's not, you might need to define a simple placeholder for development:
const createPageUrl = (pageName) => `/${pageName.toLowerCase().replace(/\s/g, '-')}`;


export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showGroupSelectDialog, setShowGroupSelectDialog] = useState(false);
  const [selectedUserForGroups, setSelectedUserForGroups] = useState(null);
  const [selectedAdminLevel, setSelectedAdminLevel] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [canAccessAllGroups, setCanAccessAllGroups] = useState(false);

  const [showIQDialog, setShowIQDialog] = useState(false);
  const [editingIQ, setEditingIQ] = useState(null);
  const [iqForm, setIQForm] = useState({
    question: '',
    question_type: 'pattern',
    options: ['', '', '', ''],
    correct_answer: 0,
    difficulty: 'medium',
    order: 1,
    active: true
  });

  const [showPersonalityDialog, setShowPersonalityDialog] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState(null);
  const [personalityForm, setPersonalityForm] = useState({
    question: '',
    options: [
      { text: '', type: 'E', emoji: '🎉' },
      { text: '', type: 'I', emoji: '🤝' }
    ],
    order: 1,
    active: true
  });

  const [videoPrompt, setVideoPrompt] = useState('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatedVideoData, setGeneratedVideoData] = useState(null);
  const [videoScenes, setVideoScenes] = useState([]);
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [paymentUrl, setPaymentUrl] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentWallEnabled, setPaymentWallEnabled] = useState(false);
  const [savingPaymentWall, setSavingPaymentWall] = useState(false);

  const [showScenarioDialog, setShowScenarioDialog] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [currentScenarioForm, setCurrentScenarioForm] = useState({
    module: 'objection_handling',
    industry: '',
    title: '',
    description: '',
    ai_prompt: '',
    difficulty: 'medium',
    active: true
  });

  // NEW: Confidence Bootcamp Scenario State
  const [showConfidenceDialog, setShowConfidenceDialog] = useState(false);
  const [editingConfidence, setEditingConfidence] = useState(null);
  const [confidenceForm, setConfidenceForm] = useState({
    level: 1,
    title: '',
    description: '',
    emoji: '🎯',
    color: 'from-blue-500 to-purple-600',
    ai_prompt: '',
    active: true
  });

  // NEW: Pathway Management State
  const [showPathwayDialog, setShowPathwayDialog] = useState(false);
  const [editingPathway, setEditingPathway] = useState(null);
  const [pathwayForm, setPathwayForm] = useState({
    title: '',
    description: '',
    category: 'self_development',
    is_student_pathway: false,
    courses: [],
    thumbnail_url: '',
    certificate_template: ''
  });
  const [availableCoursesForPathway, setAvailableCoursesForPathway] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Only allow super_admin and top_tier_admin (NOT supervisor)
        if (currentUser.admin_level !== 'super_admin' && 
            currentUser.admin_level !== 'top_tier_admin') {
          alert("⛔ Access denied! You need Super Admin or Top Tier Admin permissions.");
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

  // Only super_admin and top_tier_admin can manage users
  const canManageUsers = isSuperAdmin || isTopTierAdmin;

  // Only Top Tier Admins can promote other users to Top Tier Admin
  const canPromoteToTopTier = isTopTierAdmin;


  const { data: iqQuestions = [] } = useQuery({
    queryKey: ['iqQuestions'],
    queryFn: () => base44.entities.IQTestQuestion.list('order'),
    initialData: [],
  });

  const { data: personalityQuestions = [] } = useQuery({
    queryKey: ['personalityQuestions'],
    queryFn: () => base44.entities.PersonalityTestQuestion.list('order'),
    initialData: [],
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
    initialData: [],
    onSuccess: (data) => {
      const paymentSetting = data.find(s => s.setting_key === 'payment_url');
      if (paymentSetting) {
        setPaymentUrl(paymentSetting.setting_value);
      }

      const paymentWallSetting = data.find(s => s.setting_key === 'payment_wall_enabled');
      if (paymentWallSetting) {
        setPaymentWallEnabled(paymentWallSetting.setting_value === 'true');
      }
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: () => base44.entities.Group.list(),
    initialData: [],
  });

  const practiceScenariosSetting = settings.find(s => s.setting_key === 'practice_scenarios');
  const practiceScenarios = practiceScenariosSetting?.module_scenarios || [];

  // NEW: Confidence scenarios
  const confidenceScenariosSetting = settings.find(s => s.setting_key === 'confidence_scenarios');
  const confidenceScenarios = confidenceScenariosSetting?.module_scenarios || [];

  const { data: allCourses = [] } = useQuery({
    queryKey: ['allCoursesForPathway'],
    queryFn: () => base44.entities.Course.list('-created_date'),
    initialData: []
  });

  const { data: existingPathways = [] } = useQuery({
    queryKey: ['allPathways'],
    queryFn: () => base44.entities.Pathway.list('-created_date'),
    initialData: []
  });

  const createIQMutation = useMutation({
    mutationFn: (data) => base44.entities.IQTestQuestion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iqQuestions'] });
      setShowIQDialog(false);
      resetIQForm();
      alert('✅ IQ question added!');
    },
  });

  const updateIQMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IQTestQuestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iqQuestions'] });
      setShowIQDialog(false);
      resetIQForm();
      alert('✅ IQ question updated!');
    },
  });

  const deleteIQMutation = useMutation({
    mutationFn: (id) => base44.entities.IQTestQuestion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iqQuestions'] });
      alert('✅ IQ question deleted!');
    },
  });

  const createPersonalityMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalityTestQuestion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalityQuestions'] });
      setShowPersonalityDialog(false);
      resetPersonalityForm();
      alert('✅ Personality question added!');
    },
  });

  const updatePersonalityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PersonalityTestQuestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalityQuestions'] });
      setShowPersonalityDialog(false);
      resetPersonalityForm();
      alert('✅ Personality question updated!');
    },
  });

  const deletePersonalityMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalityTestQuestion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalityQuestions'] });
      alert('✅ Personality question deleted!');
    },
  });

  const saveScenarioMutation = useMutation({
    mutationFn: async (scenario) => {
      const existingSetting = settings.find(s => s.setting_key === 'practice_scenarios');
      const scenarios = existingSetting?.module_scenarios || [];

      let updatedScenarios;
      if (editingScenario) {
        updatedScenarios = scenarios.map(s => s.id === editingScenario.id ? { ...scenario, id: editingScenario.id } : s);
      } else {
        updatedScenarios = [...scenarios, { ...scenario, id: Date.now().toString() }];
      }

      if (existingSetting) {
        await base44.entities.AppSettings.update(existingSetting.id, {
          module_scenarios: updatedScenarios
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'practice_scenarios',
          setting_value: 'custom',
          description: 'Practice module custom scenarios',
          module_scenarios: updatedScenarios
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      setShowScenarioDialog(false);
      resetScenarioForm();
      alert('✅ Scenario saved!');
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (scenarioId) => {
      const existingSetting = settings.find(s => s.setting_key === 'practice_scenarios');
      const scenarios = existingSetting?.module_scenarios || [];
      const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);

      await base44.entities.AppSettings.update(existingSetting.id, {
        module_scenarios: updatedScenarios
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      alert('✅ Scenario deleted!');
    },
  });

  const updateUserAdminLevelMutation = useMutation({
    mutationFn: async ({ userId, newLevel, assignedGroups, canAccessAll }) => {
      // Call backend function
      const response = await base44.functions.invoke('adminUserUpdate', {
        action: 'update_permission',
        userId: userId,
        data: {
          newLevel: newLevel,
          assignedGroups: assignedGroups || [],
          canAccessAll: canAccessAll || false
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return { userId, newLevel };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowGroupSelectDialog(false);
      setSelectedUserForGroups(null);
      setSelectedGroups([]);
      setCanAccessAllGroups(false);
      alert('✅ User permission level updated! Changes apply on next login.');
    },
    onError: (error) => {
      alert('❌ Failed to update: ' + error.message);
    }
  });

  const promoteToPremiumMutation = useMutation({
    mutationFn: async ({ userId, userEmail, userName }) => {
      // Call backend function instead of direct update
      const response = await base44.functions.invoke('adminUserUpdate', {
        action: 'promote_premium',
        userId: userId,
        data: {
          userEmail: userEmail,
          userName: userName
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return { userId, userEmail };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      alert(`✅ ${data.userEmail} promoted to Premium!\n\n📧 Congratulations email sent!`);
    },
    onError: (error) => {
      alert('❌ Failed to promote: ' + error.message);
    }
  });

  const handlePromoteToPremium = (targetUser) => {
    if (targetUser.subscription_status === 'premium') {
      alert('⚠️ This user is already Premium!');
      return;
    }

    if (confirm(`🎉 Promote ${targetUser.full_name || targetUser.email} to Premium?\n\n✅ This will:\n• Upgrade their account to Premium (1 year)\n• Give them unlimited access to all features\n• Send them a congratulations email\n\nContinue?`)) {
      promoteToPremiumMutation.mutate({
        userId: targetUser.id,
        userEmail: targetUser.email,
        userName: targetUser.full_name || targetUser.email
      });
    }
  };

  const demoteFromPremiumMutation = useMutation({
    mutationFn: async ({ userId, userEmail, userName }) => {
      // Call backend function
      const response = await base44.functions.invoke('adminUserUpdate', {
        action: 'demote_standard',
        userId: userId,
        data: {
          userEmail: userEmail,
          userName: userName
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return { userId, userEmail };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      alert(`✅ ${data.userEmail} changed to Standard.\n\n📧 Notification sent.`);
    },
    onError: (error) => {
      alert('❌ Failed: ' + error.message);
    }
  });

  const handleDemoteFromPremium = (targetUser) => {
    if (targetUser.subscription_status !== 'premium') {
      alert('⚠️ This user is not Premium!');
      return;
    }

    if (confirm(`⚠️ Change ${targetUser.full_name || targetUser.email} to Standard?\n\n• They will lose unlimited access\n• Email notification will be sent\n\nContinue?`)) {
      demoteFromPremiumMutation.mutate({
        userId: targetUser.id,
        userEmail: targetUser.email,
        userName: targetUser.full_name || targetUser.email
      });
    }
  };

  // NEW: Confidence scenario mutations
  const saveConfidenceMutation = useMutation({
    mutationFn: async (scenario) => {
      const existingSetting = settings.find(s => s.setting_key === 'confidence_scenarios');
      const scenarios = existingSetting?.module_scenarios || [];

      let updatedScenarios;
      if (editingConfidence) {
        updatedScenarios = scenarios.map(s => s.id === editingConfidence.id ? { ...scenario, id: editingConfidence.id } : s);
      } else {
        updatedScenarios = [...scenarios, { ...scenario, id: Date.now().toString() }];
      }

      if (existingSetting) {
        await base44.entities.AppSettings.update(existingSetting.id, {
          module_scenarios: updatedScenarios
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'confidence_scenarios',
          setting_value: 'custom',
          description: 'Confidence Bootcamp scenarios',
          module_scenarios: updatedScenarios
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      setShowConfidenceDialog(false);
      resetConfidenceForm();
      alert('✅ Confidence scenario saved!');
    },
  });

  const deleteConfidenceMutation = useMutation({
    mutationFn: async (scenarioId) => {
      const existingSetting = settings.find(s => s.setting_key === 'confidence_scenarios');
      const scenarios = existingSetting?.module_scenarios || [];
      const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);

      await base44.entities.AppSettings.update(existingSetting.id, {
        module_scenarios: updatedScenarios
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      alert('✅ Scenario deleted!');
    },
  });

  // NEW: Pathway Mutations
  const createPathwayMutation = useMutation({
    mutationFn: (data) => base44.entities.Pathway.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPathways'] });
      setShowPathwayDialog(false);
      resetPathwayForm();
      alert('✅ Pathway created!');
    }
  });

  const updatePathwayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pathway.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPathways'] });
      setShowPathwayDialog(false);
      resetPathwayForm();
      alert('✅ Pathway updated!');
    }
  });

  const deletePathwayMutation = useMutation({
    mutationFn: (id) => base44.entities.Pathway.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPathways'] });
      alert('✅ Pathway deleted!');
    }
  });

  const resetIQForm = () => {
    setEditingIQ(null);
    setIQForm({
      question: '',
      question_type: 'pattern',
      options: ['', '', '', ''],
      correct_answer: 0,
      difficulty: 'medium',
      order: iqQuestions.length + 1,
      active: true
    });
  };

  const resetPersonalityForm = () => {
    setEditingPersonality(null);
    setPersonalityForm({
      question: '',
      options: [
        { text: '', type: 'E', emoji: '🎉' },
        { text: '', type: 'I', emoji: '🤝' }
      ],
      order: personalityQuestions.length + 1,
      active: true
    });
  };

  const handleSaveIQ = () => {
    if (!iqForm.question || iqForm.options.some(o => !o)) {
      alert('⚠️ Please fill all fields!');
      return;
    }

    if (editingIQ) {
      updateIQMutation.mutate({ id: editingIQ.id, data: iqForm });
    } else {
      createIQMutation.mutate(iqForm);
    }
  };

  const handleEditIQ = (question) => {
    setEditingIQ(question);
    setIQForm({
      question: question.question,
      question_type: question.question_type,
      options: question.options,
      correct_answer: question.correct_answer,
      difficulty: question.difficulty,
      order: question.order,
      active: question.active
    });
    setShowIQDialog(true);
  };

  const handleSavePersonality = () => {
    if (!personalityForm.question || personalityForm.options.some(o => !o.text)) {
      alert('⚠️ Please fill all fields!');
      return;
    }

    if (editingPersonality) {
      updatePersonalityMutation.mutate({ id: editingPersonality.id, data: personalityForm });
    } else {
      createPersonalityMutation.mutate(personalityForm);
    }
  };

  const handleEditPersonality = (question) => {
    setEditingPersonality(question);
    setPersonalityForm({
      question: question.question,
      options: question.options,
      order: question.order,
      active: question.active
    });
    setShowPersonalityDialog(true);
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      alert('⚠️ Please enter a video description');
      return;
    }

    setGeneratingVideo(true);
    setGeneratedVideoData(null);
    setVideoScenes([]);
    
    try {
      // Step 1: Generate video script with scenes
      const scriptResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a professional video script for: "${videoPrompt}"

Generate exactly 4-6 scenes. Each scene should be visual and describable as an image.

Return ONLY the JSON with this EXACT structure (no other text):
{
  "title": "Video title here",
  "scenes": [
    {
      "scene_number": 1,
      "duration": 3,
      "visual_description": "Detailed description of what should be shown in this scene - be VERY specific about the visual elements, colors, composition, and mood",
      "voiceover": "What the narrator says during this scene"
    }
  ]
}

Make each visual_description extremely detailed and specific so an AI can generate it as an image.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scene_number: { type: "number" },
                  duration: { type: "number" },
                  visual_description: { type: "string" },
                  voiceover: { type: "string" }
                }
              }
            }
          },
          required: ["title", "scenes"]
        }
      });

      setGeneratedVideoData(scriptResult);
      
      // Step 2: Generate images for each scene
      setGeneratingScenes(true);
      const scenes = [];
      
      for (let i = 0; i < scriptResult.scenes.length; i++) {
        const scene = scriptResult.scenes[i];
        
        try {
          const imagePrompt = `${scene.visual_description}. Professional quality, cinematic, detailed, high resolution, photorealistic`;
          
          const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: imagePrompt
          });
          
          scenes.push({
            ...scene,
            image_url: imageResult.url
          });
          
          setVideoScenes([...scenes]); // Update scenes incrementally
        } catch (error) {
          console.error('Scene generation error:', error);
          scenes.push({
            ...scene,
            image_url: null,
            error: true
          });
          setVideoScenes([...scenes]); // Update scenes with error state
        }
      }
      
      setGeneratingScenes(false);
      alert('✅ Video generated! Click Play to watch');

    } catch (error) {
      console.error('Video generation error:', error);
      alert('❌ Failed to generate: ' + error.message);
      setGeneratingScenes(false);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const playVideo = () => {
    setIsPlaying(true);
    setCurrentSceneIndex(0);
    
    const playNextScene = (index) => {
      if (index >= videoScenes.length) {
        setIsPlaying(false);
        setCurrentSceneIndex(0);
        return;
      }
      
      setCurrentSceneIndex(index);
      
      const scene = videoScenes[index];
      const duration = (scene.duration || 3) * 1000;
      
      setTimeout(() => {
        playNextScene(index + 1);
      }, duration);
    };
    
    playNextScene(0);
  };

  const downloadVideoScript = () => {
    if (!generatedVideoData || !videoScenes.length) return;

    const scriptText = `VIDEO SCRIPT
Title: ${generatedVideoData.title}

SCENES:
${videoScenes.map((scene, i) => `
Scene ${i + 1} (${scene.duration}s):
Visual: ${scene.visual_description}
Voiceover: ${scene.voiceover}
Image: ${scene.image_url || 'Generation failed'}
`).join('\n')}`;

    const blob = new Blob([scriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-script-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyVoiceover = () => {
    if (!generatedVideoData) return;
    const fullVoiceover = videoScenes.map(s => s.voiceover).join(' ');
    navigator.clipboard.writeText(fullVoiceover);
    alert('✅ Full voiceover copied!');
  };

  const handleSavePaymentUrl = async () => {
    setSavingPayment(true);
    try {
      const existingSetting = settings.find(s => s.setting_key === 'payment_url');

      if (existingSetting) {
        await base44.entities.AppSettings.update(existingSetting.id, {
          setting_value: paymentUrl
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'payment_url',
          setting_value: paymentUrl,
          description: 'Payment gateway URL'
        });
      }

      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      alert('✅ Payment URL saved!');
    } catch (error) {
      alert('❌ Failed: ' + error.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleTogglePaymentWall = async () => {
    setSavingPaymentWall(true);
    try {
      const newValue = !paymentWallEnabled;
      const existingSetting = settings.find(s => s.setting_key === 'payment_wall_enabled');

      if (existingSetting) {
        await base44.entities.AppSettings.update(existingSetting.id, {
          setting_value: String(newValue)
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'payment_wall_enabled',
          setting_value: String(newValue),
          description: 'Enable/disable payment wall'
        });
      }

      setPaymentWallEnabled(newValue);
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      alert(`✅ Payment wall ${newValue ? 'ENABLED' : 'DISABLED'}!`);
    } catch (error) {
      alert('❌ Failed: ' + error.message);
    } finally {
      setSavingPaymentWall(false);
    }
  };

  const resetScenarioForm = () => {
    setEditingScenario(null);
    setCurrentScenarioForm({ // Reset currentScenarioForm, not the default scenarioForm
      module: 'objection_handling',
      industry: '',
      title: '',
      description: '',
      ai_prompt: '',
      difficulty: 'medium',
      active: true
    });
  };

  const handleSaveScenario = () => {
    if (!currentScenarioForm.title || !currentScenarioForm.ai_prompt) { // Use currentScenarioForm
      alert('Please provide title and AI prompt!');
      return;
    }
    saveScenarioMutation.mutate(currentScenarioForm); // Use currentScenarioForm
  };

  const handleEditScenario = (scenario) => {
    setEditingScenario(scenario);
    setCurrentScenarioForm({ // Set currentScenarioForm from editingScenario
      module: scenario.module,
      industry: scenario.industry || '',
      title: scenario.title,
      description: scenario.description || '',
      ai_prompt: scenario.ai_prompt,
      difficulty: scenario.difficulty,
      active: scenario.active
    });
    setShowScenarioDialog(true);
  };

  // NEW: Confidence Bootcamp scenario handlers
  const resetConfidenceForm = () => {
    setEditingConfidence(null);
    setConfidenceForm({
      level: confidenceScenarios.length + 1,
      title: '',
      description: '',
      emoji: '🎯',
      color: 'from-blue-500 to-purple-600',
      ai_prompt: '',
      active: true
    });
  };

  const handleSaveConfidence = () => {
    if (!confidenceForm.title || !confidenceForm.ai_prompt) {
      alert('Please provide title and AI prompt!');
      return;
    }
    saveConfidenceMutation.mutate(confidenceForm);
  };

  const handleEditConfidence = (scenario) => {
    setEditingConfidence(scenario);
    setConfidenceForm({
      level: scenario.level,
      title: scenario.title,
      description: scenario.description || '',
      emoji: scenario.emoji || '🎯',
      color: scenario.color || 'from-blue-500 to-purple-600',
      ai_prompt: scenario.ai_prompt,
      active: scenario.active !== false
    });
    setShowConfidenceDialog(true);
  };

  // NEW: Pathway functions
  const resetPathwayForm = () => {
    setEditingPathway(null);
    setPathwayForm({
      title: '',
      description: '',
      category: 'self_development',
      is_student_pathway: false,
      courses: [],
      thumbnail_url: '',
      certificate_template: ''
    });
    setAvailableCoursesForPathway([]); // Reset available courses list as well
  };

  const handleEditPathway = (pathway) => {
    setEditingPathway(pathway);
    setPathwayForm({
      title: pathway.title || '',
      description: pathway.description || '',
      category: pathway.category || 'self_development',
      is_student_pathway: pathway.is_student_pathway || false,
      courses: pathway.courses || [],
      thumbnail_url: pathway.thumbnail_url || '',
      certificate_template: pathway.certificate_template || ''
    });

    // Filtering available courses will be handled by the useEffect based on is_student_pathway
    setShowPathwayDialog(true);
  };

  const handleSavePathway = () => {
    if (!pathwayForm.title || pathwayForm.courses.length === 0) {
      alert('⚠️ Provide title and at least one course!');
      return;
    }

    // Ensure courses have correct order property before saving
    const orderedCourses = [...pathwayForm.courses].sort((a, b) => a.order - b.order).map((c, index) => ({...c, order: index + 1}));
    
    if (editingPathway) {
      updatePathwayMutation.mutate({ id: editingPathway.id, data: { ...pathwayForm, courses: orderedCourses } });
    } else {
      createPathwayMutation.mutate({ ...pathwayForm, courses: orderedCourses });
    }
  };

  const handleToggleCourseInPathway = (courseId) => {
    const existing = pathwayForm.courses.find(c => c.course_id === courseId);
    if (existing) {
      const newCourses = pathwayForm.courses.filter(c => c.course_id !== courseId)
                                            .map((c, index) => ({...c, order: index + 1})); // Reorder
      setPathwayForm({
        ...pathwayForm,
        courses: newCourses
      });
    } else {
      const newCourses = [
        ...pathwayForm.courses,
        { course_id: courseId, order: pathwayForm.courses.length + 1, level: 'beginner' } // Default level
      ].map((c, index) => ({...c, order: index + 1})); // Ensure order is contiguous
      setPathwayForm({
        ...pathwayForm,
        courses: newCourses
      });
    }
  };

  const moveCourseInPathway = (courseId, direction) => {
    const currentIndex = pathwayForm.courses.findIndex(c => c.course_id === courseId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= pathwayForm.courses.length) return;

    const newCourses = [...pathwayForm.courses];
    [newCourses[currentIndex], newCourses[newIndex]] = [newCourses[newIndex], newCourses[currentIndex]];
    
    // Update order numbers
    newCourses.forEach((c, idx) => c.order = idx + 1);
    
    setPathwayForm({ ...pathwayForm, courses: newCourses });
  };

  useEffect(() => {
    // Filter courses based on is_student_pathway when the form is open
    if (showPathwayDialog) {
      const filteredCourses = pathwayForm.is_student_pathway
        ? allCourses.filter(c => c.is_student_course === true)
        : allCourses.filter(c => c.is_student_course !== true);
      setAvailableCoursesForPathway(filteredCourses);

      // Remove courses from pathwayForm.courses if they no longer match the filter
      if (pathwayForm.courses.length > 0) {
        const validCourses = pathwayForm.courses.filter(pc => 
          filteredCourses.some(fc => fc.id === pc.course_id)
        ).map((c, index) => ({...c, order: index + 1})); // Re-assign order for remaining
        
        if (validCourses.length !== pathwayForm.courses.length) {
          setPathwayForm(prev => ({ ...prev, courses: validCourses }));
        }
      }
    }
  }, [pathwayForm.is_student_pathway, allCourses, showPathwayDialog]); // Added showPathwayDialog as dependency

  const getModuleIcon = (module) => {
    switch(module) {
      case 'sales': return Phone;
      case 'retail_sales': return Store;
      case 'objection_handling': return Target;
      case 'public_speaking': return Video;
      case 'difficult_conversation': return MessageCircle;
      default: return Settings;
    }
  };

  const handleAdminLevelChange = (user, newLevel) => {
    // CRITICAL: Prevent Super Admins from promoting anyone to Top Tier Admin
    if (newLevel === 'top_tier_admin' && !canPromoteToTopTier) {
      alert('⛔ ACCESS DENIED!\n\nOnly Top Tier Admins can promote users to Top Tier Admin level.\n\nYou need to contact an existing Top Tier Admin to perform this action.');
      return;
    }

    // For super_admin, group_admin, supervisor_admin, and top_tier_admin - show group selection dialog
    if (newLevel === 'super_admin' || newLevel === 'group_admin' || newLevel === 'supervisor_admin' || newLevel === 'top_tier_admin') {
      setSelectedUserForGroups(user);
      setSelectedAdminLevel(newLevel);
      setSelectedGroups(user.assigned_groups || []);
      setCanAccessAllGroups(user.can_access_all_groups || false);
      setShowGroupSelectDialog(true);
    } else {
      // For regular users, update directly
      if (confirm(`⚠️ Change ${user.full_name || user.email}'s permission level to ${newLevel}? \n\nThis will remove any group assignments.`)) {
        updateUserAdminLevelMutation.mutate({
          userId: user.id,
          newLevel: newLevel,
          assignedGroups: [], // Clear assigned groups for non-group-based admin levels
          canAccessAll: false // Clear 'can access all groups'
        });
      }
    }
  };

  const handleSaveGroupAssignment = () => {
    // DOUBLE CHECK: Prevent Super Admins from promoting to Top Tier even in the dialog
    if (selectedAdminLevel === 'top_tier_admin' && !canPromoteToTopTier) {
      alert('⛔ CRITICAL ERROR!\n\nSuper Admins CANNOT promote users to Top Tier Admin.\n\nOnly existing Top Tier Admins have this authority.');
      setShowGroupSelectDialog(false);
      return;
    }

    if (!canAccessAllGroups && selectedGroups.length === 0 && groups.length > 0 && (selectedAdminLevel === 'super_admin' || selectedAdminLevel === 'group_admin' || selectedAdminLevel === 'supervisor_admin')) {
      alert('⚠️ Please select at least one group or enable "Access All Groups"');
      return;
    }
    
    // Top Tier Admins do not need group assignments
    if (selectedAdminLevel === 'top_tier_admin') {
        updateUserAdminLevelMutation.mutate({
            userId: selectedUserForGroups.id,
            newLevel: selectedAdminLevel,
            assignedGroups: [],
            canAccessAll: true // Top Tier Admin implicitly has access to all groups
        });
    } else {
        updateUserAdminLevelMutation.mutate({
            userId: selectedUserForGroups.id,
            newLevel: selectedAdminLevel,
            assignedGroups: canAccessAllGroups ? [] : selectedGroups,
            canAccessAll: canAccessAllGroups
        });
    }
  };

  const toggleGroupSelection = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  // New helper functions for user management
  const getAdminLevelBadge = (level) => {
    switch(level) {
      case 'top_tier_admin':
        return <Badge className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white animate-pulse"><Crown className="w-3 h-3 mr-1" />Top Tier Admin</Badge>;
      case 'super_admin':
        return <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case 'supervisor_admin':
        return <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"><Shield className="w-3 h-3 mr-1" />Supervisor</Badge>;
      case 'group_admin':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"><UserCog className="w-3 h-3 mr-1" />Group Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getPermissionsForLevel = (level) => {
    switch(level) {
      case 'top_tier_admin':
        return [
          '✅ ULTIMATE ACCESS - Everything without restrictions',
          '✅ Manage all users and change any permissions',
          '✅ Create/edit/delete courses globally',
          '✅ Create/edit/delete quizzes and tests',
          '✅ Full access to all groups and content',
          '✅ Manage all settings (payment, paywall, etc.)',
          '✅ Approve/deny everything',
          '✅ Promote users to Top Tier Admin',
          '✅ No restrictions whatsoever'
        ];
      case 'super_admin':
        return [
          '✅ Full system access (except code/AI editor)',
          '✅ Manage all users and permissions',
          '✅ Create/edit/delete courses (for assigned groups or all)',
          '✅ Create/edit/delete quizzes and tests',
          '✅ Manage assigned groups and their content',
          '✅ Create global/group meetings',
          '✅ Upload documents',
          '✅ Approve/deny users and companies',
          '✅ Access admin settings (including payment and paywall)',
          '❌ CANNOT promote users to Top Tier Admin (only Top Tier can do this)'
        ];
      case 'supervisor_admin':
        return [
          '✅ Create/edit courses ONLY in assigned groups',
          '✅ View all groups courses (read-only for non-assigned)',
          '✅ Create quizzes ONLY in assigned group courses',
          '✅ Create PSA-OOT games for assigned groups only',
          '✅ Add tasks in assigned groups',
          '✅ Create meetings in assigned groups',
          '✅ Upload resources in assigned groups',
          '❌ Cannot change user permissions',
          '❌ Cannot delete courses',
          '❌ Cannot access Admin Settings (payment, paywall, user management)',
          '❌ Cannot create global courses',
          '❌ Cannot edit courses outside assigned groups'
        ];
      case 'group_admin':
        return [
          '✅ Full control over their assigned group(s)',
          '✅ Manage group members within assigned groups',
          '✅ Create group events and meetings',
          '✅ Upload group documents',
          '✅ Create group tasks',
          '❌ Cannot access global courses',
          '❌ Cannot create global meetings',
          '❌ No system settings access'
        ];
      default:
        return ['Regular user access'];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking permissions...</p>
        </div>
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
                  <p className="font-semibold text-yellow-900">Top Tier Admin - ULTIMATE ACCESS</p>
                  <p className="text-sm text-yellow-700">You have the highest level of access with no restrictions whatsoever.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Settings</h1>
            <p className="text-slate-600 mt-1">Manage users, permissions, tests, payments & content</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="pathways" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Pathways
            </TabsTrigger>
            <TabsTrigger value="iq" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              IQ Test
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Personality
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="confidence" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Confidence
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="paywall" className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Paywall
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-red-50 to-pink-50 border-l-8 border-l-red-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Crown className="w-8 h-8 text-red-600 animate-pulse" />
                  <span className="text-red-900">USER & PERMISSION MANAGEMENT</span>
                </CardTitle>
                <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-bold text-yellow-900 mb-2">Admin Hierarchy System:</p>
                      {isTopTierAdmin ? (
                        <p className="text-sm text-green-900 font-semibold mb-3 bg-green-100 p-2 rounded">
                          ✅ As Top Tier Admin, you can promote users to ANY level, including Top Tier Admin.
                        </p>
                      ) : (
                        <p className="text-sm text-orange-900 font-semibold mb-3 bg-orange-100 p-2 rounded">
                          ⚠️ As Super Admin, you can promote users to Super Admin, Supervisor, or Group Admin, but NOT to Top Tier Admin.
                        </p>
                      )}
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <Badge className="bg-gradient-to-r from-yellow-400 to-red-600 mb-2 text-white">Top Tier</Badge>
                          <p className="text-xs text-slate-700">Ultimate access to everything</p>
                          {!canPromoteToTopTier && (
                            <p className="text-xs text-red-600 mt-1 font-semibold">🔒 You cannot promote to this level</p>
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <Badge className="bg-red-600 mb-2">Super Admin</Badge>
                          <p className="text-xs text-slate-700">Full access + user management</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <Badge className="bg-purple-600 mb-2">Supervisor</Badge>
                          <p className="text-xs text-slate-700">Group-specific content creation</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <Badge className="bg-yellow-500 mb-2">Group Admin</Badge>
                          <p className="text-xs text-slate-700">Group-specific management</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((targetUser) => (
                    <Card key={targetUser.id} className="border-2 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              {targetUser.full_name?.charAt(0) || targetUser.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{targetUser.full_name || 'N/A'}</h3>
                              <p className="text-sm text-slate-600">{targetUser.email}</p>
                              <div className="flex gap-2 mt-2 items-center flex-wrap">
                                {getAdminLevelBadge(targetUser.admin_level || 'user')}
                                
                                {/* Subscription Status Badge */}
                                {targetUser.subscription_status === 'premium' ? (
                                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                ) : targetUser.subscription_status === 'free_trial' ? (
                                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Free Trial
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Standard</Badge>
                                )}

                                {(targetUser.admin_level === 'super_admin' || targetUser.admin_level === 'top_tier_admin') && targetUser.can_access_all_groups && (
                                  <Badge className="bg-green-600 text-white text-xs">Access All Groups</Badge>
                                )}
                                {(targetUser.admin_level === 'super_admin' || targetUser.admin_level === 'supervisor_admin') && !targetUser.can_access_all_groups && targetUser.assigned_groups && targetUser.assigned_groups.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {targetUser.assigned_groups.length} Assigned Group{targetUser.assigned_groups.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {targetUser.admin_level === 'group_admin' && targetUser.assigned_groups && targetUser.assigned_groups.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {targetUser.assigned_groups.length} Group{targetUser.assigned_groups.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Subscription Management Buttons */}
                            {targetUser.subscription_status === 'premium' ? (
                              <Button
                                onClick={() => handleDemoteFromPremium(targetUser)}
                                disabled={demoteFromPremiumMutation.isLoading}
                                variant="outline"
                                className="border-orange-500 text-orange-700 hover:bg-orange-50"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Change to Standard
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handlePromoteToPremium(targetUser)}
                                disabled={promoteToPremiumMutation.isLoading}
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Promote to Premium
                              </Button>
                            )}

                            <div className="text-right">
                              <p className="text-xs text-slate-500 mb-1 font-semibold">Change Permission Level</p>
                              <Select
                                value={targetUser.admin_level || 'user'}
                                onValueChange={(newLevel) => handleAdminLevelChange(targetUser, newLevel)}
                              >
                                <SelectTrigger className="w-56 border-2 border-slate-300 font-semibold text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-bold">Regular User</p>
                                        <p className="text-xs text-slate-500">Standard access</p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="group_admin">
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <UserCog className="w-4 h-4 text-yellow-700" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-yellow-900">Group Admin</p>
                                        <p className="text-xs text-yellow-700">Manage specific groups</p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="supervisor_admin">
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-purple-700" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-purple-900">Supervisor Admin</p>
                                        <p className="text-xs text-purple-700">Content creation only</p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="super_admin">
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                        <Crown className="w-4 h-4 text-red-700" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-red-900">Super Admin</p>
                                        <p className="text-xs text-red-700">Full access + user management</p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="top_tier_admin">
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-red-600 rounded-full flex items-center justify-center">
                                        <Crown className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-red-600">Top Tier Admin</p>
                                        <p className="text-xs text-slate-700">Ultimate access</p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  View Permissions
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    Permissions for: {getAdminLevelBadge(targetUser.admin_level || 'user')}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <ul className="space-y-2">
                                    {getPermissionsForLevel(targetUser.admin_level || 'user').map((perm, idx) => (
                                      <li key={idx} className="text-sm py-2 px-3 bg-slate-50 rounded border-l-4 border-blue-400">
                                        {perm}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Permission Level Details:
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-5 h-5 animate-pulse" />
                        <h4 className="font-bold">Top Tier</h4>
                      </div>
                      <ul className="text-sm space-y-1 opacity-90">
                        <li>• Ultimate access</li>
                        <li>• No restrictions</li>
                        <li>• Promote to Top Tier</li>
                        <li>• Highest authority</li>
                      </ul>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-5 h-5" />
                        <h4 className="font-bold">Super Admin</h4>
                      </div>
                      <ul className="text-sm space-y-1 opacity-90">
                        <li>• Manage users</li>
                        <li>• All settings</li>
                        <li>• Group-based access</li>
                        <li>• Payment control</li>
                        <li className="text-red-200">• ❌ No Top Tier promotion</li>
                      </ul>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5" />
                        <h4 className="font-bold">Supervisor</h4>
                      </div>
                      <ul className="text-sm space-y-1 opacity-90">
                        <li>• Group courses only</li>
                        <li>• View all courses</li>
                        <li>• Create quizzes globally</li>
                        <li>• Group tasks</li>
                      </ul>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCog className="w-5 h-5" />
                        <h4 className="font-bold">Group Admin</h4>
                      </div>
                      <ul className="text-sm space-y-1 opacity-90">
                        <li>• Group management</li>
                        <li>• Member control</li>
                        <li>• Group events</li>
                        <li>• Tasks/documents</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW: Pathways Tab */}
          <TabsContent value="pathways" className="space-y-6">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">Learning Pathways ({existingPathways.length})</CardTitle>
                    <p className="text-sm text-slate-600">Create structured learning journeys</p>
                  </div>
                  <Button
                    onClick={() => {
                      resetPathwayForm();
                      setShowPathwayDialog(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pathway
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {existingPathways.map(pathway => (
                    <Card key={pathway.id} className="border-2 hover:shadow-lg transition-all">
                      <CardContent className="p-5">
                        {pathway.thumbnail_url && (
                          <img src={pathway.thumbnail_url} alt={pathway.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-2 flex-wrap">
                            <Badge>{pathway.category?.replace(/_/g, ' ')}</Badge>
                            {pathway.is_student_pathway && (
                              <Badge className="bg-purple-600 text-white">Student Pathway</Badge>
                            )}
                          </div>
                        </div>
                        <h3 className="font-bold text-lg mb-2">{pathway.title}</h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{pathway.description}</p>
                        <p className="text-xs text-slate-500 mb-3">{pathway.courses?.length || 0} courses</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditPathway(pathway)} className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Delete this pathway?')) {
                                deletePathwayMutation.mutate(pathway.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {existingPathways.length === 0 && (
                  <div className="text-center py-16 text-slate-500">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="mb-4">No pathways yet. Create your first learning pathway!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iq" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>IQ Test Questions ({iqQuestions.length})</CardTitle>
                  <Button onClick={() => { resetIQForm(); setShowIQDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {iqQuestions.map((q) => (
                    <Card key={q.id} className="p-4 bg-white border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{q.question_type}</Badge>
                            <Badge variant="outline">{q.difficulty}</Badge>
                            {!q.active && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <p className="font-semibold mb-2">{q.question}</p>
                          <div className="text-sm text-slate-600">
                            <p>✓ Correct: {q.options[q.correct_answer]}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleEditIQ(q)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Delete this question?')) {
                                deleteIQMutation.mutate(q.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Personality Test Questions ({personalityQuestions.length})</CardTitle>
                  <Button onClick={() => { resetPersonalityForm(); setShowPersonalityDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {personalityQuestions.map((q) => (
                    <Card key={q.id} className="p-4 bg-white border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold mb-2">{q.question}</p>
                          <div className="text-sm space-y-1">
                            {q.options.map((opt, idx) => (
                              <p key={idx}>{opt.emoji} {opt.text} ({opt.type})</p>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleEditPersonality(q)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Delete this question?')) {
                                deletePersonalityMutation.mutate(q.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    Practice Module Scenarios ({practiceScenarios.length})
                  </CardTitle>
                  <Button
                    onClick={() => {
                      resetScenarioForm();
                      setShowScenarioDialog(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Scenario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {practiceScenarios.map((scenario) => {
                    const ModuleIcon = getModuleIcon(scenario.module);
                    return (
                      <Card key={scenario.id} className="p-4 bg-white border-2 border-blue-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <ModuleIcon className="w-5 h-5 text-blue-600" />
                              <Badge className="bg-blue-600">{scenario.module.replace('_', ' ')}</Badge>
                              {scenario.industry && <Badge variant="outline">{scenario.industry}</Badge>}
                              <Badge variant="outline">{scenario.difficulty}</Badge>
                              {!scenario.active && <Badge variant="destructive">Inactive</Badge>}
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{scenario.title}</h3>
                            <p className="text-sm text-slate-600 mb-2">{scenario.description}</p>
                            <div className="bg-slate-100 rounded p-3 text-xs">
                              <p className="font-semibold mb-1">AI Prompt:</p>
                              <p className="text-slate-700">{scenario.ai_prompt.substring(0, 150)}...</p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleEditScenario(scenario)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm('Delete this scenario?')) {
                                  deleteScenarioMutation.mutate(scenario.id);
                                }
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {practiceScenarios.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No scenarios yet. Add custom scenarios for practice modules!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW: Confidence Bootcamp Tab */}
          <TabsContent value="confidence" className="space-y-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 border-l-8 border-l-purple-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Shield className="w-6 h-6 text-purple-600" />
                      Confidence Bootcamp Scenarios ({confidenceScenarios.length})
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-2">
                      🎯 AI analyzes user responses in REAL-TIME and adapts pressure dynamically
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      resetConfidenceForm();
                      setShowConfidenceDialog(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Scenario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="bg-blue-50 border-2 border-blue-300 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-blue-900 mb-2">How It Works:</p>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>✅ AI listens to user's response via microphone</li>
                          <li>✅ AI analyzes quality, confidence, logic in real-time</li>
                          <li>✅ AI identifies weaknesses and creates targeted pressure</li>
                          <li>✅ AI camera captures body language & eye contact</li>
                          <li>✅ Dynamic difficulty - AI pushes harder if user is strong</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {confidenceScenarios.map((scenario) => (
                    <Card key={scenario.id} className="p-4 bg-white border-2 border-purple-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-3xl">{scenario.emoji || '🎯'}</div>
                            <Badge className={`bg-gradient-to-r ${scenario.color || 'from-purple-500 to-pink-600'} text-white`}>
                              Level {scenario.level}
                            </Badge>
                            {!scenario.active && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 mb-1">{scenario.title}</h3>
                          <p className="text-sm text-slate-600 mb-3">{scenario.description}</p>
                          <div className="bg-slate-100 rounded p-3 text-xs">
                            <p className="font-semibold mb-1">AI Prompt:</p>
                            <p className="text-slate-700 whitespace-pre-wrap">{scenario.ai_prompt.substring(0, 200)}...</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleEditConfidence(scenario)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Delete this confidence scenario?')) {
                                deleteConfidenceMutation.mutate(scenario.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {confidenceScenarios.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="mb-4">No confidence scenarios yet. Add your first one!</p>
                      <Button
                        onClick={() => {
                          resetConfidenceForm();
                          setShowConfidenceDialog(true);
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Scenario
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Gateway URL</Label>
                  <Input
                    value={paymentUrl}
                    onChange={(e) => setPaymentUrl(e.target.value)}
                    placeholder="https://your-payment-link.com"
                  />
                </div>
                <Button onClick={handleSavePaymentUrl} disabled={savingPayment} className="w-full">
                  {savingPayment ? 'Saving...' : 'Save Payment URL'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paywall" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Payment Wall Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-6 rounded-xl ${paymentWallEnabled ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="font-bold text-lg mb-2">
                    {paymentWallEnabled ? '🔒 Payment Wall ACTIVE' : '🔓 Platform is FREE'}
                  </p>
                  <p className="text-sm">
                    {paymentWallEnabled
                      ? 'Users must complete payment to access content'
                      : 'All users have free access to all content'}
                  </p>
                </div>
                <Button
                  onClick={handleTogglePaymentWall}
                  disabled={savingPaymentWall}
                  className="w-full"
                  variant={paymentWallEnabled ? 'default' : 'destructive'}
                >
                  {paymentWallEnabled ? (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Disable Payment Wall (Make FREE)
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Enable Payment Wall (Require Payment)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* IQ Question Dialog */}
      <Dialog open={showIQDialog} onOpenChange={setShowIQDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIQ ? 'Edit IQ Question' : 'Add IQ Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question</Label>
              <Textarea
                value={iqForm.question}
                onChange={(e) => setIQForm({ ...iqForm, question: e.target.value })}
                rows={3}
                placeholder="Enter the question..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Question Type</Label>
                <Select value={iqForm.question_type} onValueChange={(value) => setIQForm({ ...iqForm, question_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pattern">Pattern</SelectItem>
                    <SelectItem value="logic">Logic</SelectItem>
                    <SelectItem value="verbal">Verbal</SelectItem>
                    <SelectItem value="mathematical">Mathematical</SelectItem>
                    <SelectItem value="spatial">Spatial</SelectItem>
                    <SelectItem value="analogies">Analogies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select value={iqForm.difficulty} onValueChange={(value) => setIQForm({ ...iqForm, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Options (4 required)</Label>
              {iqForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...iqForm.options];
                      newOptions[idx] = e.target.value;
                      setIQForm({ ...iqForm, options: newOptions });
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <input
                    type="radio"
                    checked={iqForm.correct_answer === idx}
                    onChange={() => setIQForm({ ...iqForm, correct_answer: idx })}
                    className="w-5 h-5"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500 mt-1">Select the correct answer with the radio button</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowIQDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveIQ} className="bg-blue-600">
              <Save className="w-4 h-4 mr-2" />
              {editingIQ ? 'Update' : 'Add'} Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Personality Question Dialog */}
      <Dialog open={showPersonalityDialog} onOpenChange={setShowPersonalityDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPersonality ? 'Edit Personality Question' : 'Add Personality Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question</Label>
              <Textarea
                value={personalityForm.question}
                onChange={(e) => setPersonalityForm({ ...personalityForm, question: e.target.value })}
                rows={3}
                placeholder="Enter the question..."
              />
            </div>

            <div>
              <Label>Option 1</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={personalityForm.options[0].text}
                  onChange={(e) => {
                    const newOptions = [...personalityForm.options];
                    newOptions[0].text = e.target.value;
                    setPersonalityForm({ ...personalityForm, options: newOptions });
                  }}
                  placeholder="Option text"
                />
                <Select
                  value={personalityForm.options[0].type}
                  onValueChange={(value) => {
                    const newOptions = [...personalityForm.options];
                    newOptions[0].type = value;
                    setPersonalityForm({ ...personalityForm, options: newOptions });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E">E (Extrovert)</SelectItem>
                    <SelectItem value="I">I (Introvert)</SelectItem>
                    <SelectItem value="S">S (Sensing)</SelectItem>
                    <SelectItem value="N">N (Intuitive)</SelectItem>
                    <SelectItem value="T">T (Thinking)</SelectItem>
                    <SelectItem value="F">F (Feeling)</SelectItem>
                    <SelectItem value="J">J (Judging)</SelectItem>
                    <SelectItem value="P">P (Perceiving)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={personalityForm.options[0].emoji}
                  onChange={(e) => {
                    const newOptions = [...personalityForm.options];
                    newOptions[0].emoji = e.target.value;
                    setPersonalityForm({ ...personalityForm, options: newOptions });
                  }}
                  placeholder="Emoji"
                />
              </div>
            </div>

            <div>
              <Label>Option 2</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={personalityForm.options[1].text}
                  onChange={(e) => {
                    const newOptions = [...personalityForm.options];
                    newOptions[1].text = e.target.value;
                    setPersonalityForm({ ...personalityForm, options: newOptions });
                  }}
                  placeholder="Option text"
                />
                <Select
                  value={personalityForm.options[1].type}
                  onValueChange={(value) => {
                    const newOptions = [...personalityForm.options];
                    newOptions[1].type = value;
                    setPersonalityForm({ ...personalityForm, options: newOptions });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E">E (Extrovert)</SelectItem>
                    <SelectItem value="I">I (Introvert)</SelectItem>
                    <SelectItem value="S">S (Sensing)</SelectItem>
                    <SelectItem value="N">N (Intuitive)</SelectItem>
                    <SelectItem value="T">T (Thinking)</SelectItem>
                    <SelectItem value="F">F (Feeling)</SelectItem>
                    <SelectItem value="J">J (Judging)</SelectItem>
                    <SelectItem value="P">P (Perceiving)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={personalityForm.options[1].emoji}
                  onChange={(e) => {
                    const newOptions = [...personalityForm.options];
                    newOptions[1].emoji = e.target.value;
                    setPersonalityForm({ ...personalityForm, options: newOptions });
                  }}
                  placeholder="Emoji"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPersonalityDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePersonality} className="bg-purple-600">
              <Save className="w-4 h-4 mr-2" />
              {editingPersonality ? 'Update' : 'Add'} Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showScenarioDialog} onOpenChange={setShowScenarioDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScenario ? 'Edit Scenario' : 'Add Practice Scenario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Module</Label>
                <Select value={currentScenarioForm.module} onValueChange={(value) => setCurrentScenarioForm({ ...currentScenarioForm, module: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Practice (Phone)</SelectItem>
                    <SelectItem value="retail_sales">Retail Sales (3D Customer)</SelectItem>
                    <SelectItem value="objection_handling">Objection Handling</SelectItem>
                    <SelectItem value="public_speaking">Public Speaking</SelectItem>
                    <SelectItem value="difficult_conversation">Difficult Conversation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Industry (optional)</Label>
                <Input
                  value={currentScenarioForm.industry}
                  onChange={(e) => setCurrentScenarioForm({ ...currentScenarioForm, industry: e.target.value })}
                  placeholder="e.g., Retail, Tech"
                />
              </div>
            </div>

            <div>
              <Label>Scenario Title</Label>
              <Input
                value={currentScenarioForm.title}
                onChange={(e) => setCurrentScenarioForm({ ...currentScenarioForm, title: e.target.value })}
                placeholder="e.g., Price Objection in Retail"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={currentScenarioForm.description}
                onChange={(e) => setCurrentScenarioForm({ ...currentScenarioForm, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <div>
              <Label>AI Prompt (What the AI should say/do)</Label>
              <Textarea
                value={currentScenarioForm.ai_prompt}
                onChange={(e) => setCurrentScenarioForm({ ...currentScenarioForm, ai_prompt: e.target.value })}
                rows={8}
                placeholder="Example: You are a customer in a retail store. You say: 'Your product is too expensive...'"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Difficulty</Label>
                <Select value={currentScenarioForm.difficulty} onValueChange={(value) => setCurrentScenarioForm({ ...currentScenarioForm, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={currentScenarioForm.active}
                  onChange={(e) => setCurrentScenarioForm({ ...currentScenarioForm, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>Active (show in module)</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowScenarioDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveScenario} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {editingScenario ? 'Update' : 'Add'} Scenario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Confidence Scenario Dialog */}
      <Dialog open={showConfidenceDialog} onOpenChange={setShowConfidenceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              {editingConfidence ? 'Edit Confidence Scenario' : 'Add Confidence Scenario'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Card className="bg-yellow-50 border-2 border-yellow-400">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-yellow-900 mb-2">💡 How to Create Effective Scenarios:</p>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• <strong>AI Prompt:</strong> Define WHO the AI is (coach, client, manager, critic)</li>
                      <li>• <strong>Be Specific:</strong> The AI will ANALYZE user's response and create pressure</li>
                      <li>• <strong>Level 1-5:</strong> Higher levels = more intense pressure</li>
                      <li>• <strong>Examples:</strong> "You are a harsh investor", "You are an impatient CEO", etc.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-base mb-2 block">Scenario Title *</Label>
                <Input
                  value={confidenceForm.title}
                  onChange={(e) => setConfidenceForm({ ...confidenceForm, title: e.target.value })}
                  placeholder="e.g., Harsh Investor Pitch, Crisis Management"
                  className="text-base"
                />
              </div>

              <div>
                <Label className="font-semibold text-base mb-2 block">Level (1-5) *</Label>
                <Select value={String(confidenceForm.level)} onValueChange={(value) => setConfidenceForm({ ...confidenceForm, level: Number(value) })}>
                  <SelectTrigger className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Mild Pressure</SelectItem>
                    <SelectItem value="2">Level 2 - Moderate Challenge</SelectItem>
                    <SelectItem value="3">Level 3 - Tough Questioning</SelectItem>
                    <SelectItem value="4">Level 4 - Harsh Evaluation</SelectItem>
                    <SelectItem value="5">Level 5 - Extreme Crisis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-semibold text-base mb-2 block">Description *</Label>
              <Input
                value={confidenceForm.description}
                onChange={(e) => setConfidenceForm({ ...confidenceForm, description: e.target.value })}
                placeholder="e.g., Face aggressive questioning from skeptical investors"
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-base mb-2 block">Emoji Icon</Label>
                <Input
                  value={confidenceForm.emoji}
                  onChange={(e) => setConfidenceForm({ ...confidenceForm, emoji: e.target.value })}
                  placeholder="e.g., 🔥, 💥, 🎯"
                  className="text-2xl"
                  maxLength={2}
                />
              </div>

              <div>
                <Label className="font-semibold text-base mb-2 block">Gradient Color (Tailwind)</Label>
                <Select value={confidenceForm.color} onValueChange={(value) => setConfidenceForm({ ...confidenceForm, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from-orange-500 to-red-600">🔥 Orange to Red</SelectItem>
                    <SelectItem value="from-purple-500 to-pink-600">💜 Purple to Pink</SelectItem>
                    <SelectItem value="from-blue-500 to-cyan-600">💙 Blue to Cyan</SelectItem>
                    <SelectItem value="from-slate-600 to-slate-800">⚫ Dark Slate</SelectItem>
                    <SelectItem value="from-red-600 to-rose-800">❤️ Deep Red</SelectItem>
                    <SelectItem value="from-green-500 to-emerald-600">💚 Green to Emerald</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-semibold text-base mb-2 block">AI Prompt (CRITICAL!) *</Label>
              <Textarea
                value={confidenceForm.ai_prompt}
                onChange={(e) => setConfidenceForm({ ...confidenceForm, ai_prompt: e.target.value })}
                rows={10}
                placeholder="Example:&#10;&#10;You are a HARSH VENTURE CAPITALIST evaluating a startup pitch.&#10;&#10;Your personality: Skeptical, no-nonsense, extremely critical of weak arguments.&#10;&#10;Your goal: Test if they can handle aggressive questioning and defend their ideas under pressure.&#10;&#10;Be demanding but professional. Question everything. Demand proof for every claim."
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 The AI will use this role + analyze user's response + create targeted pressure dynamically
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
              <input
                type="checkbox"
                checked={confidenceForm.active}
                onChange={(e) => setConfidenceForm({ ...confidenceForm, active: e.target.checked })}
                className="w-5 h-5"
              />
              <div>
                <p className="font-semibold text-purple-900">Active (visible to users)</p>
                <p className="text-sm text-purple-700">Uncheck to hide this scenario temporarily</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfidenceDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveConfidence} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Save className="w-4 h-4 mr-2" />
              {editingConfidence ? 'Update' : 'Add'} Scenario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pathway Dialog */}
      <Dialog open={showPathwayDialog} onOpenChange={setShowPathwayDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPathway ? 'Edit Pathway' : 'Create Learning Pathway'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Pathway Title *</Label>
                <Input
                  value={pathwayForm.title}
                  onChange={(e) => setPathwayForm({ ...pathwayForm, title: e.target.value })}
                  placeholder="e.g., Complete Sales Mastery"
                />
              </div>

              <div>
                <Label>Category *</Label>
                <Select value={pathwayForm.category} onValueChange={(value) => setPathwayForm({ ...pathwayForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={pathwayForm.description}
                onChange={(e) => setPathwayForm({ ...pathwayForm, description: e.target.value })}
                placeholder="Describe the learning journey..."
                rows={3}
              />
            </div>

            <div>
              <Label>Thumbnail URL (optional)</Label>
              <Input
                value={pathwayForm.thumbnail_url}
                onChange={(e) => setPathwayForm({ ...pathwayForm, thumbnail_url: e.target.value })}
                placeholder="https://..."
              />
              {pathwayForm.thumbnail_url && (
                <img src={pathwayForm.thumbnail_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
              )}
            </div>

            <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pathwayForm.is_student_pathway}
                  onChange={(e) => setPathwayForm({ 
                    ...pathwayForm, 
                    is_student_pathway: e.target.checked,
                    // courses: [] // Clear courses when switching. Let useEffect handle filtering.
                  })}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-bold text-purple-900">Student Pathway</p>
                  <p className="text-sm text-purple-700">Show in Student Space (uses student courses only)</p>
                </div>
              </label>
            </div>

            <div>
              <Label>Certificate Message (optional)</Label>
              <Textarea
                value={pathwayForm.certificate_template}
                onChange={(e) => setPathwayForm({ ...pathwayForm, certificate_template: e.target.value })}
                placeholder="e.g., Successfully completed the Sales Mastery pathway"
                rows={2}
              />
            </div>

            <Card className="bg-blue-50 border-2 border-blue-300">
              <CardHeader>
                <CardTitle className="text-lg">
                  Select Courses ({pathwayForm.courses.length} selected)
                </CardTitle>
                <p className="text-sm text-slate-600">
                  {pathwayForm.is_student_pathway 
                    ? 'Only student courses are shown' 
                    : 'Only professional courses are shown'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableCoursesForPathway.map(course => {
                    const isSelected = pathwayForm.courses.some(c => c.course_id === course.id);
                    const courseInPathway = pathwayForm.courses.find(c => c.course_id === course.id);

                    return (
                      <div
                        key={course.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCourseInPathway(course.id)}
                              className="mt-1 w-5 h-5"
                            />
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900">{course.title}</h4>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{course.category?.replace(/_/g, ' ')}</Badge>
                                <Badge variant="outline" className="text-xs">{course.level}</Badge>
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-blue-600">Order: {courseInPathway.order}</div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moveCourseInPathway(course.id, 'up')}
                                  disabled={courseInPathway.order === 1}
                                  className="h-6 px-2"
                                >
                                  ↑
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moveCourseInPathway(course.id, 'down')}
                                  disabled={courseInPathway.order === pathwayForm.courses.length}
                                  className="h-6 px-2"
                                >
                                  ↓
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {availableCoursesForPathway.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      No {pathwayForm.is_student_pathway ? 'student' : 'professional'} courses available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPathwayDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePathway} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              {editingPathway ? 'Update' : 'Create'} Pathway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Selection Dialog */}
      <Dialog open={showGroupSelectDialog} onOpenChange={setShowGroupSelectDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Assign Groups for {selectedUserForGroups?.full_name || selectedUserForGroups?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-900 mb-2">
                {selectedAdminLevel === 'top_tier_admin' ? 'Top Tier Admin' :
                 selectedAdminLevel === 'super_admin' ? 'Super Admin' :
                 selectedAdminLevel === 'supervisor_admin' ? 'Supervisor Admin' : 'Group Admin'} Assignment
              </p>
              <p className="text-sm text-blue-700">
                {selectedAdminLevel === 'top_tier_admin'
                  ? 'Top Tier Admins have ultimate access and implicitly manage all groups. No group selection is needed.'
                  : selectedAdminLevel === 'super_admin'
                  ? 'This admin will only see courses, quizzes, PSA-OOT games, and content for their assigned groups, unless "Access All Groups" is enabled.'
                  : selectedAdminLevel === 'supervisor_admin'
                  ? 'This supervisor can ONLY create/edit courses and PSA-OOT games in their assigned groups. They can VIEW all groups but only EDIT their assigned ones. They can create quizzes for any group.'
                  : 'This admin will manage members, events, and tasks for their assigned groups.'
                }
              </p>
            </div>

            {selectedAdminLevel !== 'top_tier_admin' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={canAccessAllGroups}
                  onChange={(e) => {
                    setCanAccessAllGroups(e.target.checked);
                    if (e.target.checked) {
                      setSelectedGroups([]);
                    }
                  }}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-semibold text-green-900">Access All Groups</p>
                  <p className="text-sm text-green-700">
                    {selectedAdminLevel === 'super_admin' || selectedAdminLevel === 'supervisor_admin'
                      ? 'This admin can access all existing and future groups and their content.'
                      : 'Group Admins cannot access all groups.'
                    }
                  </p>
                </div>
              </div>
            )}

            {!canAccessAllGroups && selectedAdminLevel !== 'top_tier_admin' && (
              <div>
                <Label className="text-lg font-bold mb-3 block">Select Groups:</Label>
                {groups.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No groups available yet</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => toggleGroupSelection(group.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedGroups.includes(group.id)
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{group.name}</p>
                            <p className="text-xs text-slate-500">{group.group_type}</p>
                          </div>
                          {selectedGroups.includes(group.id) && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowGroupSelectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveGroupAssignment}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={
                selectedAdminLevel !== 'top_tier_admin' &&
                !canAccessAllGroups &&
                selectedGroups.length === 0 &&
                groups.length > 0 &&
                (selectedAdminLevel === 'super_admin' || selectedAdminLevel === 'group_admin' || selectedAdminLevel === 'supervisor_admin')
              }
            >
              <Save className="w-4 h-4 mr-2" />
              Save Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
