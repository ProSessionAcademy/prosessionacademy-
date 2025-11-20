import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles, Code, CheckCircle2, FileCode, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function AICodeBuilder() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hi! I'm your AI Code Builder. Tell me what you want to create:\n\n• \"Create a new page called TaskManager that lets users add, edit, and delete tasks\"\n• \"Add a button to Dashboard that opens a calculator\"\n• \"Create a Notes page where I can write and save notes\"\n\nI'll create REAL, WORKING pages with full functionality!" }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      // Step 1: Analyze request
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `🤖 Analyzing your request...`,
        action: 'analyzing'
      }]);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert React/JavaScript developer building pages for a professional development platform.

User Request: "${userMessage}"

Analyze the request and respond with a JSON object with this EXACT structure:
{
  "action": "create_page",
  "page_name": "PageName (camelCase, no spaces)",
  "page_title": "Human readable title",
  "description": "Brief explanation of what you're doing",
  "icon_name": "LucideIconName (Home, FileText, Sparkles, Target, etc.)",
  "placement": "navigation"
}

Then provide the FULL React component code.

CRITICAL CODE REQUIREMENTS:

1. MUST start with:
export default function PageName() {

2. REQUIRED IMPORTS (copy exactly):
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

3. MAKE IT FULLY FUNCTIONAL:
   - Real useState for managing data
   - Working buttons with onClick handlers
   - If data storage needed, create entity operations with base44.entities
   - Add loading states with Loader2 icon
   - Include success messages
   - Responsive design with Tailwind CSS
   - Beautiful gradients (from-blue-600 to-purple-600, etc.)

4. EXAMPLE STRUCTURE for a task manager:
\`\`\`javascript
export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
    setNewTask('');
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleToggle = (id) => {
    setTasks(tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Task Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add new task..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <Button onClick={handleAddTask} className="bg-blue-600">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {tasks.map(task => (
                <Card key={task.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => handleToggle(task.id)}
                    />
                    <span className={task.completed ? 'line-through text-gray-500' : ''}>
                      {task.text}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
\`\`\`

5. NO MARKDOWN CODE BLOCKS - return pure executable JavaScript code

IMPORTANT: Return valid JSON with ALL fields filled, including the complete "code" field with working React component.`,
        response_json_schema: {
          type: "object",
          properties: {
            action: { type: "string" },
            page_name: { type: "string" },
            page_title: { type: "string" },
            description: { type: "string" },
            code: { type: "string" },
            icon_name: { type: "string" },
            placement: { type: "string" }
          },
          required: ["action", "page_name", "page_title", "description", "code"]
        }
      });

      const result = response;

      if (!result.code || result.code.length < 100) {
        throw new Error('Generated code is too short or invalid. Please try again with more details.');
      }

      // Update message
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: 'assistant', 
          content: `✨ Creating page: **${result.page_title}**\n\n${result.description}\n\nDeploying now...`,
          action: 'deploying'
        };
        return newMessages;
      });

      // Step 2: Deploy the page
      const deployResult = await base44.functions.invoke('createPageFile', {
        page_name: result.page_name,
        code: result.code,
        title: result.page_title,
        icon_name: result.icon_name,
        placement: result.placement
      });

      if (deployResult.data.error) {
        throw new Error(deployResult.data.error);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ **Successfully created ${result.page_title}!**\n\n🎉 Your page is LIVE and fully functional!\n\n📍 You can find it in your navigation sidebar.\n\n💡 **Tip:** Refresh the page to see it appear in navigation!`,
        action: 'success'
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ **Error:** ${error.message}\n\n**Suggestions:**\n• Be more specific about what you want\n• Describe the features clearly\n• Try: "Create a page where users can [specific action]"`,
        action: 'error'
      }]);
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-5xl mx-auto">
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">AI Code Builder</h1>
                <p className="text-sm text-slate-600">Describe what you want, I'll build it instantly</p>
              </div>
            </div>

            <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <Card className={`max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                        : msg.action === 'success' 
                        ? 'bg-green-50 border-green-300' 
                        : msg.action === 'error'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-slate-50'
                    }`}>
                      <CardContent className="p-4">
                        {msg.action === 'deploying' || msg.action === 'analyzing' ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">{msg.content}</span>
                          </div>
                        ) : msg.action === 'success' ? (
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-900 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ) : msg.action === 'error' ? (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-900 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="e.g., Create a Todo List page where users can add, edit, and delete tasks with checkboxes"
                className="flex-1 resize-none"
                rows={3}
                disabled={isProcessing}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => setInput("Create a Task Manager page with add, edit, delete tasks and checkboxes")}>
                Quick: Task Manager
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => setInput("Create a Notes page where I can write and save notes")}>
                Quick: Notes App
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => setInput("Create a Calculator page with basic math operations")}>
                Quick: Calculator
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-gradient-to-br from-purple-600 to-pink-600 border-none text-white">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-3">💡 What I Can Do:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <Code className="w-5 h-5 mb-1" />
                <p className="font-semibold">Create New Pages</p>
                <p className="text-white/80">Full React pages with working features</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <FileCode className="w-5 h-5 mb-1" />
                <p className="font-semibold">Real Functionality</p>
                <p className="text-white/80">Not just UI - actual working code</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <Sparkles className="w-5 h-5 mb-1" />
                <p className="font-semibold">Beautiful Design</p>
                <p className="text-white/80">Modern gradients and animations</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <CheckCircle2 className="w-5 h-5 mb-1" />
                <p className="font-semibold">Deploy Instantly</p>
                <p className="text-white/80">Live in seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}