import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Download, 
  Loader2, 
  AlertTriangle,
  Shield,
  Camera,
  XCircle,
  Zap,
  Maximize2,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

const STYLE_OPTIONS = [
  { id: 'realistic', label: 'Realistic', icon: '📸', prompt: 'photorealistic, highly detailed, 8k resolution, professional photography, sharp focus, studio lighting' },
  { id: 'anime', label: 'Anime', icon: '🎨', prompt: 'anime style, detailed anime art, vibrant colors, professional illustration, high quality anime' },
  { id: 'cartoon', label: 'Cartoon', icon: '🎭', prompt: 'cartoon style, vibrant colors, bold outlines, professional illustration, detailed cartoon art' },
  { id: 'oil_painting', label: 'Oil Painting', icon: '🖼️', prompt: 'oil painting style, classical art, rich textures, masterpiece quality, fine art' },
  { id: 'watercolor', label: 'Watercolor', icon: '💧', prompt: 'watercolor painting, soft colors, artistic, detailed watercolor illustration' },
  { id: 'sketch', label: 'Sketch', icon: '✏️', prompt: 'detailed pencil sketch, artistic drawing, fine lines, professional sketch art' },
  { id: 'digital_art', label: 'Digital Art', icon: '💻', prompt: 'digital art, concept art quality, highly detailed, professional digital painting' },
  { id: '3d_render', label: '3D Render', icon: '🎮', prompt: '3D render, octane render, ultra realistic 3D, professional CGI, ray tracing' }
];

const QUALITY_LEVELS = [
  { id: 'standard', label: 'Standard', boost: 'good quality' },
  { id: 'high', label: 'High Quality', boost: 'highly detailed, professional quality, 4k, sharp focus' },
  { id: 'ultra', label: 'Ultra HD', boost: 'masterpiece, best quality, ultra detailed, 8k uhd, cinematic, professional, award winning' }
];

const LIGHTING_OPTIONS = [
  { id: 'auto', label: 'Auto', boost: '' },
  { id: 'natural', label: 'Natural Light', boost: 'natural lighting, golden hour, soft sunlight' },
  { id: 'studio', label: 'Studio', boost: 'professional studio lighting, perfect lighting, photography studio' },
  { id: 'dramatic', label: 'Dramatic', boost: 'dramatic lighting, cinematic lighting, high contrast' },
  { id: 'soft', label: 'Soft', boost: 'soft lighting, diffused light, gentle illumination' }
];

// 🎯 RELAXED FILTER - Only blocks actual inappropriate content
const explicitRegex = new RegExp(
  '(\\bnaked\\b|\\bnude\\b|\\bnudity\\b|\\btopless\\b|\\bbottomless\\b|' +
  'no clothes|without clothes|no shirt|bare chest(?! x-ray)|exposed breast|exposed genital|' +
  'nsfw|\\bporn\\b|porno|xxx|explicit|\\bsex\\b|sexual intercourse|erotic|orgasm|' +
  'in underwear|wearing underwear|only underwear|just underwear|underwear only|' +
  'in bra and panties|wearing bra and panties|' +
  'show (breast|boob|nipple|genital|penis|vagina)|visible (nipple|genital)|' +
  'blood|gore|murder|kill|dead body|corpse|torture|weapon|gun|knife|sword|stabbing|shooting|' +
  'nazi|kkk|white supremacy|hate speech|racial slur|ethnic slur|' +
  'cocaine|heroin|meth|drug use|suicide|self-harm|bomb|terrorist|explosive)',
  'i'
);

function isPromptSafe(prompt) {
  const normalized = prompt.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  return !explicitRegex.test(normalized);
}

export default function AIImageGenerator() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedQuality, setSelectedQuality] = useState('ultra');
  const [selectedLighting, setSelectedLighting] = useState('auto');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [strikes, setStrikes] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.image_generation_blocked === true) {
          setIsBlocked(true);
        } else {
          setIsBlocked(false);
        }
        
        const userStrikes = await base44.entities.ContentStrike.filter({ user_email: currentUser.email });
        setStrikes(userStrikes.length);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchUser();
  }, []);

  const createStrikeMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentStrike.create(data)
  });

  const handleGenerate = async () => {
    if (isBlocked) {
      alert('🚫 YOU ARE PERMANENTLY BLOCKED\n\nContact admin to unlock.');
      return;
    }

    if (!prompt.trim()) {
      alert('⚠️ Enter a description!');
      return;
    }

    const safe = isPromptSafe(prompt);
    
    if (!safe) {
      try {
        await createStrikeMutation.mutateAsync({
          user_email: user.email,
          user_name: user.full_name || user.email,
          prompt: prompt,
          image_url: null,
          ai_analysis: `BLOCKED BY FILTER\n\nPrompt: "${prompt}"\n\nMatched forbidden pattern.`,
          severity: 'extreme'
        });
      } catch (e) {
        console.error('❌ Strike logging failed:', e);
      }

      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      
      setError(`🚫 CONTENT VIOLATION\n\nYour prompt contains inappropriate content.\n\n⚠️ STRIKE ${newStrikes}/3`);
      setGeneratedImage(null);
      setPrompt('');

      if (newStrikes >= 3) {
        await base44.auth.updateMe({ image_generation_blocked: true });
        setIsBlocked(true);
        alert('⛔ PERMANENTLY BANNED\n\n3 strikes = PERMANENT BAN\n\nAdmin unlock only.');
      } else {
        alert(`🚫 VIOLATION DETECTED\n\n⚠️ Strike ${newStrikes}/3\n\n${3 - newStrikes} more = PERMANENT BAN`);
      }

      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // 🚀 ENHANCED PROMPT ENGINEERING
      const styleBoost = STYLE_OPTIONS.find(s => s.id === selectedStyle)?.prompt || '';
      const qualityBoost = QUALITY_LEVELS.find(q => q.id === selectedQuality)?.boost || '';
      const lightingBoost = LIGHTING_OPTIONS.find(l => l.id === selectedLighting)?.boost || '';
      
      // Build comprehensive prompt with quality modifiers
      const enhancedPrompt = [
        prompt,
        styleBoost,
        qualityBoost,
        lightingBoost,
        'extremely detailed, professional quality, perfect composition, high resolution',
        'safe for work, appropriate, family-friendly'
      ].filter(Boolean).join(', ');

      console.log('📸 Enhanced prompt:', enhancedPrompt);
      
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: enhancedPrompt });

      setIsAnalyzing(true);
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `RELAXED CONTENT CHECK for professional platform:

Examine this image. Mark is_safe: FALSE ONLY if you see:
❌ Actual nudity (exposed breasts, genitals, buttocks)
❌ Sexual/explicit content
❌ Violence, gore, weapons
❌ Hate symbols, discrimination

✅ ALLOWED (mark is_safe: TRUE):
- Fitness/gym clothes (sports bras, leggings, workout gear)
- Swimsuits/swimming (beach, pool scenes)
- Professional attire
- Sports uniforms
- Dance/performance costumes
- People in appropriate clothing

Describe what you see:`,
        response_json_schema: {
          type: "object",
          properties: {
            is_safe: { type: "boolean" },
            detected_issues: { type: "array", items: { type: "string" } },
            image_description: { type: "string" },
            severity: { type: "string", enum: ["safe", "low", "medium", "high", "extreme"] }
          }
        },
        file_urls: [url]
      });

      setIsAnalyzing(false);

      if (analysis.is_safe === false && analysis.severity === 'extreme') {
        await createStrikeMutation.mutateAsync({
          user_email: user.email,
          user_name: user.full_name || user.email,
          prompt: prompt,
          image_url: url,
          ai_analysis: `AI BLOCKED (extreme violation)\n\n${analysis.image_description}\n\nIssues: ${analysis.detected_issues?.join(', ')}`,
          severity: 'extreme'
        });

        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        
        setError(`🚫 UNSAFE IMAGE\n\n⚠️ STRIKE ${newStrikes}/3`);
        setGeneratedImage(null);
        setPrompt('');

        if (newStrikes >= 3) {
          await base44.auth.updateMe({ image_generation_blocked: true });
          setIsBlocked(true);
          alert('⛔ BANNED - 3 strikes');
        } else {
          alert(`🚫 Strike ${newStrikes}/3 added`);
        }

        return;
      }

      setGeneratedImage(url);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Failed: ' + error.message);
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-white/50 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Login Required</h3>
            <Button onClick={() => base44.auth.redirectToLogin()} size="lg">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 p-6 flex items-center justify-center">
        <Card className="max-w-2xl border-4 border-red-600 shadow-2xl bg-white">
          <CardContent className="p-12 text-center">
            <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <XCircle className="w-20 h-20 text-white" />
            </div>
            <h2 className="text-5xl font-black text-red-900 mb-6">🚫 PERMANENTLY BANNED</h2>
            <p className="text-xl text-red-800 mb-8">Access permanently revoked due to {strikes} content violations.</p>
            <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-400">
              <p className="font-bold text-yellow-900">Contact administrator to appeal.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white">AI Image Generator</h1>
          </div>
          <p className="text-purple-200 text-xl">Create professional, high-quality images with AI</p>
        </div>

        {strikes > 0 && (
          <Card className="border-4 border-red-500 bg-red-50 shadow-2xl max-w-3xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-black text-red-900 text-2xl">⚠️ {strikes} VIOLATION{strikes > 1 ? 'S' : ''}</p>
                  <p className="text-red-700 font-bold text-lg">
                    {3 - strikes} more = PERMANENT BAN
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-4 border-yellow-500 bg-yellow-50 max-w-3xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-10 h-10 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-black text-yellow-900 mb-3 text-xl">✅ What's Allowed:</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  <ul className="space-y-1 text-yellow-800 font-semibold text-sm">
                    <li>✅ Fitness & gym scenes</li>
                    <li>✅ Swimming & beach</li>
                    <li>✅ Professional business</li>
                    <li>✅ Sports & athletics</li>
                  </ul>
                  <ul className="space-y-1 text-yellow-800 font-semibold text-sm">
                    <li>✅ Dance & performance</li>
                    <li>✅ People in general</li>
                    <li>✅ Landscapes & nature</li>
                    <li>✅ Abstract art</li>
                  </ul>
                </div>
                <div className="bg-red-600 text-white p-2 rounded-lg mt-3 text-center">
                  <p className="font-black text-sm">❌ NOT ALLOWED: Nudity, explicit content, violence, hate symbols</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="border-none shadow-2xl bg-white">
            <CardContent className="p-8 space-y-6">
              <div>
                <Label className="text-xl font-bold mb-4 block flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  📝 Description (be specific!)
                </Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: A professional fitness trainer demonstrating exercises in a modern gym, motivational atmosphere, early morning sunlight..."
                  rows={6}
                  className="text-lg border-2 border-slate-300"
                />
                <p className="text-sm text-purple-600 mt-2 font-semibold">
                  💡 Pro Tip: Include details about setting, mood, colors, composition for better results!
                </p>
              </div>

              <div>
                <Label className="text-lg font-bold mb-3 block">🎨 Art Style</Label>
                <div className="grid grid-cols-4 gap-2">
                  {STYLE_OPTIONS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedStyle === style.id
                          ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                          : 'border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.icon}</div>
                      <div className="text-xs font-bold">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg font-bold mb-3 block">⚡ Quality Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {QUALITY_LEVELS.map(quality => (
                    <button
                      key={quality.id}
                      onClick={() => setSelectedQuality(quality.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedQuality === quality.id
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{quality.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg font-bold mb-3 block">💡 Lighting</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LIGHTING_OPTIONS.map(lighting => (
                    <button
                      key={lighting.id}
                      onClick={() => setSelectedLighting(lighting.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm ${
                        selectedLighting === lighting.id
                          ? 'border-yellow-600 bg-yellow-50 shadow-lg'
                          : 'border-slate-300 hover:border-yellow-400'
                      }`}
                    >
                      <div className="font-bold">{lighting.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-8 text-xl font-black shadow-2xl hover:shadow-purple-500/50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Creating Masterpiece...
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Shield className="w-6 h-6 mr-3 animate-pulse" />
                    AI Safety Check...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3" />
                    Generate HD Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-white">
            <CardContent className="p-8">
              <Label className="text-xl font-bold mb-6 block flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-purple-600" />
                ✨ Generated Image
              </Label>
              
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-purple-100 rounded-2xl flex items-center justify-center border-4 border-slate-300 overflow-hidden">
                {generatedImage ? (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                ) : error ? (
                  <div className="text-center p-8">
                    <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <p className="text-red-700 font-black text-xl mb-3">BLOCKED</p>
                    <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
                    <Badge className="bg-red-600 text-white mt-4">Violation Logged</Badge>
                  </div>
                ) : isGenerating ? (
                  <div className="text-center p-10">
                    <Loader2 className="w-20 h-20 text-purple-600 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-700 font-bold text-lg">Creating your image...</p>
                    <p className="text-slate-500 text-sm mt-2">This may take 10-20 seconds</p>
                  </div>
                ) : isAnalyzing ? (
                  <div className="text-center p-10">
                    <Shield className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-700 font-bold text-lg">AI safety check...</p>
                  </div>
                ) : (
                  <div className="text-center p-10">
                    <Camera className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold">Your HD image will appear here</p>
                    <p className="text-slate-500 text-sm mt-2">Professional quality • High resolution</p>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="mt-6 space-y-4">
                  <Card className="bg-green-50 border-2 border-green-500">
                    <CardContent className="p-3">
                      <p className="text-sm font-bold text-green-900 text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        ✅ High Quality Image Generated
                      </p>
                    </CardContent>
                  </Card>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = `ai-image-${Date.now()}.png`;
                      link.click();
                    }}
                    className="w-full bg-green-600 py-6 text-xl font-bold hover:bg-green-700"
                  >
                    <Download className="w-6 h-6 mr-2" />
                    Download HD Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-xl bg-white/95 max-w-5xl mx-auto">
          <CardContent className="p-6">
            <h3 className="font-bold text-xl text-center mb-4">💡 Pro Examples (try these!):</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                '🏋️ Fitness trainer at modern gym',
                '🏊 Olympic swimmer in pool',
                '⚽ Soccer player scoring goal',
                '👔 Business presentation meeting',
                '🎨 Artist in creative studio',
                '☕ Cozy coffee shop interior',
                '🌆 Futuristic city skyline sunset',
                '🎭 Ballet dancer on stage'
              ].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex.substring(3))}
                  className="p-3 bg-slate-50 rounded-lg border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-sm font-semibold transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-blue-900/90 text-white max-w-5xl mx-auto">
          <CardContent className="p-6">
            <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              🚀 Tips for AMAZING Images:
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold mb-2">✨ Be Specific:</p>
                <p className="text-blue-100">"A confident businesswoman presenting data charts" vs just "woman"</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold mb-2">🎨 Add Mood/Atmosphere:</p>
                <p className="text-blue-100">"energetic", "calm", "professional", "vibrant"</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold mb-2">📸 Describe Setting:</p>
                <p className="text-blue-100">"modern office", "outdoor park", "minimalist studio"</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold mb-2">🌈 Mention Colors:</p>
                <p className="text-blue-100">"warm tones", "vibrant blues", "earth colors"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}