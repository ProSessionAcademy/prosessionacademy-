
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Target,
  Brain,
  Heart,
  TrendingUp,
  Award,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Loader2,
  Star,
  Rocket,
  User,
  BookOpen,
  MapPin,
  Users,
  X,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const QUESTIONS = [
  {
    id: 1,
    question: "When faced with a complex problem, I prefer to:",
    options: [
      { text: "Break it down into smaller, manageable parts", category: "analytical" },
      { text: "Brainstorm creative solutions with others", category: "creative" },
      { text: "Research best practices and proven methods", category: "methodical" },
      { text: "Jump in and figure it out as I go", category: "action-oriented" }
    ]
  },
  {
    id: 2,
    question: "In a team setting, I typically:",
    options: [
      { text: "Take the lead and organize tasks", category: "leadership" },
      { text: "Support others and maintain harmony", category: "supportive" },
      { text: "Focus on technical execution", category: "technical" },
      { text: "Generate innovative ideas", category: "creative" }
    ]
  },
  {
    id: 3,
    question: "My ideal work environment is:",
    options: [
      { text: "Fast-paced and dynamic", category: "dynamic" },
      { text: "Structured and predictable", category: "structured" },
      { text: "Creative and flexible", category: "creative" },
      { text: "Collaborative and social", category: "social" }
    ]
  },
  {
    id: 4,
    question: "I feel most satisfied when:",
    options: [
      { text: "Helping others succeed", category: "supportive" },
      { text: "Solving complex problems", category: "analytical" },
      { text: "Creating something new", category: "creative" },
      { text: "Achieving measurable goals", category: "results-driven" }
    ]
  },
  {
    id: 5,
    question: "When learning something new, I prefer:",
    options: [
      { text: "Hands-on practice", category: "practical" },
      { text: "Reading and research", category: "theoretical" },
      { text: "Visual demonstrations", category: "visual" },
      { text: "Group discussions", category: "social" }
    ]
  },
  {
    id: 6,
    question: "I'm naturally drawn to work that involves:",
    options: [
      { text: "Data and numbers", category: "analytical" },
      { text: "People and relationships", category: "social" },
      { text: "Design and aesthetics", category: "creative" },
      { text: "Systems and processes", category: "methodical" }
    ]
  },
  {
    id: 7,
    question: "My biggest strength is:",
    options: [
      { text: "Communication skills", category: "social" },
      { text: "Problem-solving ability", category: "analytical" },
      { text: "Creativity and innovation", category: "creative" },
      { text: "Organization and planning", category: "methodical" }
    ]
  },
  {
    id: 8,
    question: "I prefer jobs that offer:",
    options: [
      { text: "High income potential", category: "financial" },
      { text: "Work-life balance", category: "balanced" },
      { text: "Career advancement", category: "ambitious" },
      { text: "Personal fulfillment", category: "purpose-driven" }
    ]
  }
];

export default function CareerTest() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveResults, setSaveResults] = useState(true);

  // NEW: Action Plan Mode
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [actionPlanMode, setActionPlanMode] = useState('simple'); // 'simple' or 'advanced'
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [actionPlan, setActionPlan] = useState(null);

  // NEW: Advanced Mode Inputs
  const [advancedInputs, setAdvancedInputs] = useState({
    timeline: '3_months',
    budget: 'low',
    learning_preference: 'online',
    time_commitment: '5-10_hours',
    biggest_challenge: '',
    specific_goals: '',
    preferred_industries: []
  });

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    currentStatus: "", // student, working, unemployed, career_change
    currentRole: "",
    currentField: "",
    experience_years: ""
  });

  // Step 2: Interests
  const [interests, setInterests] = useState([]);
  const availableInterests = [
    "Technology", "Healthcare", "Education", "Finance", "Marketing",
    "Sales", "Design", "Engineering", "Human Resources", "Law",
    "Media & Entertainment", "Non-profit", "Entrepreneurship", "Research"
  ];

  // Step 3: Skills
  const [skills, setSkills] = useState([]);
  const availableSkills = [
    "Leadership", "Communication", "Problem Solving", "Technical Skills",
    "Creativity", "Analysis", "Project Management", "Teamwork",
    "Public Speaking", "Writing", "Strategic Thinking", "Customer Service"
  ];

  // Step 4: Quiz Answers
  const [quizAnswers, setQuizAnswers] = useState({});

  // Step 5: Values & Priorities
  const [values, setValues] = useState({
    salary_importance: 5,
    work_life_balance: 5,
    career_growth: 5,
    job_stability: 5,
    making_impact: 5
  });

  // Results
  const [results, setResults] = useState(null);

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

  const progress = (step / 6) * 100;

  const handleQuizAnswer = (questionId, option) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: option
    });
  };

  // NEW: Generate Action Plan
  const generateActionPlan = async () => {
    if (!results) return;

    setGeneratingPlan(true);
    // Reset action plan display if generating a new one (especially useful when switching from advanced form to displaying plan)
    setActionPlan(null);

    try {
      let prompt = '';

      if (actionPlanMode === 'simple') {
        prompt = `Create a simple, actionable 30-day career action plan for someone with:

Career Recommendations:
${results.career_recommendations.slice(0, 2).map(c => `- ${c.career_title}`).join('\n')}

Strengths: ${results.strengths.join(', ')}
Development Areas: ${results.development_areas.join(', ')}

Create a plan with:
- Week 1-2 actions
- Week 3-4 actions
- Quick wins they can achieve
- Resources to explore

Keep it simple and motivating!`;
      } else {
        // Advanced mode with detailed inputs
        prompt = `Create a comprehensive, personalized career action plan:

CAREER PROFILE:
${results.career_recommendations.slice(0, 3).map(c => `- ${c.career_title} (${c.match_percentage}% match)`).join('\n')}

CURRENT SITUATION:
- Status: ${basicInfo.currentStatus}
- Experience: ${basicInfo.experience_years}
- Skills: ${skills.join(', ')}
- Interests: ${interests.join(', ')}

PERSONAL PREFERENCES:
- Timeline: ${advancedInputs.timeline.replace('_', ' ')}
- Budget: ${advancedInputs.budget}
- Learning Preference: ${advancedInputs.learning_preference}
- Time Commitment: ${advancedInputs.time_commitment.replace('_', '-')} per week
${advancedInputs.biggest_challenge ? `- Biggest Challenge: ${advancedInputs.biggest_challenge}` : ''}
${advancedInputs.specific_goals ? `- Specific Goals: ${advancedInputs.specific_goals}` : ''}
${advancedInputs.preferred_industries.length > 0 ? `- Target Industries: ${advancedInputs.preferred_industries.join(', ')}` : ''}

Create a detailed action plan with:
1. Phase breakdown (short-term, mid-term, long-term)
2. Specific skills to develop
3. Recommended courses/certifications
4. Networking strategies
5. Job search tactics
6. Weekly milestones
7. Success metrics

Make it highly personalized and actionable!`;
      }

      const planText = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setActionPlan(planText);
      setShowActionPlan(true);
    } catch (error) {
      alert('❌ Failed to generate plan: ' + error.message);
    } finally {
      setGeneratingPlan(false);
    }
  };


  const handleFinish = async () => {
    setLoading(true);

    try {
      const categoryScores = {};
      const answersData = QUESTIONS.map(q => {
        const selectedOption = quizAnswers[q.id];
        if (selectedOption && selectedOption.category) {
          categoryScores[selectedOption.category] = (categoryScores[selectedOption.category] || 0) + 1;
        }
        return {
          question: q.question,
          answer: selectedOption ? selectedOption.text : "Not answered",
          category: selectedOption ? selectedOption.category : "N/A"
        };
      });

      const topQuizCategories = Object.entries(categoryScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

      const careerDatabase = {
        "self_development": [
          { career_title: "Personal Development Coach", match_percentage: 85, description: "Help others achieve their personal goals", required_skills: ["Coaching", "Communication", "Empathy"], growth_potential: "High", salary_range: "$50,000 - $80,000" },
          { career_title: "Life Coach", match_percentage: 80, description: "Guide clients through life transitions", required_skills: ["Listening", "Goal Setting", "Motivation"], growth_potential: "High", salary_range: "$45,000 - $75,000" }
        ],
        "leadership": [
          { career_title: "Team Lead", match_percentage: 90, description: "Lead and inspire teams to success", required_skills: ["Leadership", "Communication", "Strategy"], growth_potential: "Very High", salary_range: "$70,000 - $120,000" },
          { career_title: "Project Manager", match_percentage: 85, description: "Manage projects from start to finish", required_skills: ["Planning", "Organization", "Problem Solving"], growth_potential: "High", salary_range: "$65,000 - $110,000" }
        ],
        "management": [
          { career_title: "Operations Manager", match_percentage: 88, description: "Optimize business operations", required_skills: ["Analysis", "Process Improvement", "Leadership"], growth_potential: "High", salary_range: "$60,000 - $100,000" },
          { career_title: "Business Analyst", match_percentage: 82, description: "Analyze and improve business processes", required_skills: ["Data Analysis", "Communication", "Critical Thinking"], growth_potential: "High", salary_range: "$55,000 - $90,000" }
        ],
        "business": [
          { career_title: "Business Consultant", match_percentage: 87, description: "Advise companies on strategy", required_skills: ["Strategy", "Analysis", "Communication"], growth_potential: "Very High", salary_range: "$70,000 - $150,000" },
          { career_title: "Entrepreneur", match_percentage: 85, description: "Build and run your own business", required_skills: ["Innovation", "Risk Taking", "Leadership"], growth_potential: "Variable", salary_range: "Variable" }
        ],
        "sales": [
          { career_title: "Sales Manager", match_percentage: 90, description: "Lead sales teams to exceed targets", required_skills: ["Sales", "Leadership", "Negotiation"], growth_potential: "High", salary_range: "$60,000 - $120,000" },
          { career_title: "Account Executive", match_percentage: 85, description: "Build client relationships and close deals", required_skills: ["Communication", "Persuasion", "Relationship Building"], growth_potential: "High", salary_range: "$50,000 - $100,000" }
        ],
        "marketing": [
          { career_title: "Marketing Manager", match_percentage: 88, description: "Develop and execute marketing strategies", required_skills: ["Creativity", "Analysis", "Communication"], growth_potential: "High", salary_range: "$60,000 - $110,000" },
          { career_title: "Digital Marketing Specialist", match_percentage: 83, description: "Drive online marketing campaigns", required_skills: ["Digital Tools", "Analytics", "Content Creation"], growth_potential: "Very High", salary_range: "$50,000 - $90,000" }
        ],
        "study_skills": [ // Mapped from learning styles or education-related categories
          { career_title: "Education Consultant", match_percentage: 86, description: "Help students excel academically", required_skills: ["Teaching", "Organization", "Mentoring"], growth_potential: "Moderate", salary_range: "$45,000 - $75,000" },
          { career_title: "Academic Advisor", match_percentage: 82, description: "Guide students in their academic journey", required_skills: ["Advising", "Communication", "Planning"], growth_potential: "Moderate", salary_range: "$40,000 - $70,000" }
        ]
      };

      // Mapping from quiz categories to broader career database keys
      const quizCategoryToCareerTypeMap = {
        "analytical": ["management", "business"],
        "methodical": ["management"],
        "action-oriented": ["sales", "business"],
        "leadership": ["leadership", "management"],
        "supportive": ["self_development"],
        "technical": ["management"],
        "dynamic": ["business", "sales"],
        "structured": ["management"],
        "creative": ["marketing", "business"],
        "social": ["self_development", "marketing"],
        "results-driven": ["sales", "management", "business"],
        "practical": ["study_skills"],
        "theoretical": ["study_skills"],
        "visual": ["study_skills"],
        "financial": ["business"],
        "balanced": ["self_development"],
        "ambitious": ["leadership", "business", "sales"],
        "purpose-driven": ["self_development"]
      };

      // Determine top career types based on mapped quiz categories
      const uniqueCareerTypes = new Set();
      topQuizCategories.forEach(quizCat => {
        if (quizCategoryToCareerTypeMap[quizCat]) {
          quizCategoryToCareerTypeMap[quizCat].forEach(careerType => uniqueCareerTypes.add(careerType));
        }
      });
      // Fallback if no specific mapping for top categories, or ensure we always get some results
      if (uniqueCareerTypes.size === 0) {
        uniqueCareerTypes.add("business"); // Default fallback
        uniqueCareerTypes.add("leadership");
        uniqueCareerTypes.add("marketing");
      }

      const finalTopCareerTypes = Array.from(uniqueCareerTypes).slice(0, 3); // Limit to top 3 distinct career types

      // Get recommendations from selected top career types
      let recommendations = [];
      finalTopCareerTypes.forEach(careerType => {
        if (careerDatabase[careerType]) {
          recommendations.push(...careerDatabase[careerType]);
        }
      });
      // Shuffle recommendations to get diverse results if multiple categories match
      recommendations.sort(() => Math.random() - 0.5);
      recommendations = recommendations.slice(0, 5); // Take up to 5 recommendations

      // Generate personality traits and strengths based on basicInfo, interests, skills, and top quiz categories
      const personalityTraits = [];
      if (topQuizCategories.includes("analytical")) personalityTraits.push("Analytical Thinker");
      if (topQuizCategories.includes("creative")) personalityTraits.push("Creative Innovator");
      if (topQuizCategories.includes("leadership")) personalityTraits.push("Natural Leader");
      if (topQuizCategories.includes("social")) personalityTraits.push("Collaborative & Communicative");
      if (topQuizCategories.includes("methodical")) personalityTraits.push("Organized & Systematic");
      if (personalityTraits.length === 0) personalityTraits.push("Adaptable", "Goal-Oriented"); // Default if no strong quiz categories

      const strengths = [];
      if (skills.length > 0) strengths.push(...skills.slice(0, 2)); // Top 2 selected skills
      if (basicInfo.currentStatus === "working" && basicInfo.experience_years !== "0") strengths.push("Experienced");
      if (topQuizCategories.includes("analytical")) strengths.push("Strong Analytical Skills");
      if (topQuizCategories.includes("social")) strengths.push("Effective Communicator");
      if (strengths.length < 2) strengths.push("Strong work ethic", "Problem-solving ability"); // Default if not enough derived

      const developmentAreas = [];
      // Simple logic for development areas: if certain quiz categories are low, suggest development there
      // Or based on common generic areas
      developmentAreas.push("Time Management", "Advanced Technical Skills", "Networking");
      if (!topQuizCategories.includes("creative")) developmentAreas.push("Creative Thinking");
      if (!topQuizCategories.includes("leadership")) developmentAreas.push("Leadership Development");
      if (!topQuizCategories.includes("analytical")) developmentAreas.push("Data Analysis Skills");


      const learningStyle = topQuizCategories.includes("practical") ? "Hands-on (Experiential)" :
                            topQuizCategories.includes("theoretical") ? "Research-based (Academic)" :
                            topQuizCategories.includes("visual") ? "Visual Learning" :
                            "Mixed (Blended)";

      const workEnvironmentPreference = topQuizCategories.includes("dynamic") ? "Fast-paced & Dynamic" :
                                        topQuizCategories.includes("structured") ? "Structured & Predictable" :
                                        topQuizCategories.includes("creative") ? "Creative & Flexible" :
                                        topQuizCategories.includes("social") ? "Collaborative & Social" :
                                        "Hybrid & Flexible";

      const mentorPreferences = {
        industry: Array.from(new Set([...finalTopCareerTypes, ...interests.slice(0,2)])), // Combine career types and some interests
        expertise: ["Career Development", "Skill Building", "Networking"],
        communication_style: "Supportive and Direct"
      };

      const result = {
        career_recommendations: recommendations,
        personality_traits: personalityTraits.slice(0, 3), // Limit traits to 3
        strengths: strengths.slice(0, 3), // Limit strengths to 3
        development_areas: developmentAreas.slice(0, 3), // Limit development areas to 3
        learning_style: learningStyle,
        work_environment_preference: workEnvironmentPreference,
        mentor_preferences: mentorPreferences
      };

      setResults(result);

      // Save results to database if user is logged in and saveResults is enabled
      if (user && saveResults) {
        await base44.entities.CareerTestResult.create({
          user_email: user.email,
          completed_date: new Date().toISOString(),
          basicInfo,
          interests,
          skills,
          quizAnswers: answersData, // Save processed quiz answers
          values,
          llm_analysis: result // Save the full generated result
        });
      }

      setStep(6);
    } catch (error) {
      console.error("Error generating results:", error);
      alert("Error generating results: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">What's your current situation?</Label>
              <Select value={basicInfo.currentStatus} onValueChange={(value) => setBasicInfo({ ...basicInfo, currentStatus: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">🎓 Student</SelectItem>
                  <SelectItem value="working">💼 Currently Working</SelectItem>
                  <SelectItem value="unemployed">🔍 Looking for Work</SelectItem>
                  <SelectItem value="career_change">🔄 Considering Career Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Current Job Title / Area of Study</Label>
              <Input
                value={basicInfo.currentRole}
                onChange={(e) => setBasicInfo({ ...basicInfo, currentRole: e.target.value })}
                placeholder="e.g., Marketing Student, Software Developer, Sales Manager"
              />
            </div>

            <div>
              <Label>Current Industry / Field</Label>
              <Input
                value={basicInfo.currentField}
                onChange={(e) => setBasicInfo({ ...basicInfo, currentField: e.target.value })}
                placeholder="e.g., Technology, Healthcare, Education"
              />
            </div>

            <div>
              <Label>Years of Experience</Label>
              <Select value={basicInfo.experience_years} onValueChange={(value) => setBasicInfo({ ...basicInfo, experience_years: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No experience / Student</SelectItem>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!basicInfo.currentStatus}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Next: Your Interests
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">What are you interested in? (Select 3-5)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableInterests.map((interest) => (
                  <Button
                    key={interest}
                    variant={interests.includes(interest) ? "default" : "outline"}
                    onClick={() => {
                      if (interests.includes(interest)) {
                        setInterests(interests.filter(i => i !== interest));
                      } else {
                        setInterests([...interests, interest]);
                      }
                    }}
                    className={interests.includes(interest) ? "bg-blue-600" : ""}
                  >
                    {interest}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={interests.length < 3}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Next: Your Skills
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">What are your strongest skills? (Select 3-5)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSkills.map((skill) => (
                  <Button
                    key={skill}
                    variant={skills.includes(skill) ? "default" : "outline"}
                    onClick={() => {
                      if (skills.includes(skill)) {
                        setSkills(skills.filter(s => s !== skill));
                      } else {
                        setSkills([...skills, skill]);
                      }
                    }}
                    className={skills.includes(skill) ? "bg-purple-600" : ""}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={skills.length < 3}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Next: Personality Quiz
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-slate-600 mb-4">Answer these questions to help us understand your work style</p>

            {QUESTIONS.map((q) => (
              <Card key={q.id} className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(q.id, option)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        quizAnswers[q.id]?.text === option.text
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(5)}
                disabled={Object.keys(quizAnswers).length < QUESTIONS.length}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Next: Your Values
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <p className="text-slate-600 mb-4">Rate the importance of these factors (1-10)</p>

            {[
              { key: 'salary_importance', label: '💰 High Salary' },
              { key: 'work_life_balance', label: '⚖️ Work-Life Balance' },
              { key: 'career_growth', label: '📈 Career Advancement' },
              { key: 'job_stability', label: '🛡️ Job Security' },
              { key: 'making_impact', label: '🌍 Making a Difference' }
            ].map((item) => (
              <div key={item.key}>
                <div className="flex justify-between mb-2">
                  <Label>{item.label}</Label>
                  <span className="font-bold text-blue-600">{values[item.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={values[item.key]}
                  onChange={(e) => setValues({ ...values, [item.key]: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get My Results
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 6:
        if (!results) return null;

        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <Card className="border-none shadow-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <CheckCircle className="w-16 h-16" />
                    <div>
                      <h1 className="text-4xl font-bold">Your Career Profile</h1>
                      <p className="text-green-100">Personalized recommendations based on your answers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ✨✨✨ ULTRA PROMINENT ACTION PLAN SECTION ✨✨✨ */}
              <div className="relative">
                {/* Animated glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl blur-lg opacity-75 animate-pulse"></div>
                
                <Card className="relative border-none shadow-2xl bg-white overflow-hidden">
                  {/* Top Banner */}
                  <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white text-center py-4">
                    <div className="flex items-center justify-center gap-3">
                      <Sparkles className="w-8 h-8 animate-bounce" />
                      <h2 className="text-3xl font-black uppercase tracking-wide">
                        🎯 Get Your Personalized Action Plan! 🚀
                      </h2>
                      <Sparkles className="w-8 h-8 animate-bounce" />
                    </div>
                    <p className="text-white/90 text-lg mt-2 font-semibold">
                      Choose Your Path Below ⬇️
                    </p>
                  </div>

                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* ⚡ SIMPLE MODE - LEFT SIDE */}
                      <div
                        onClick={() => {
                          setActionPlanMode('simple');
                          generateActionPlan();
                        }}
                        className="group p-8 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 transition-all cursor-pointer border-r-4 border-white relative overflow-hidden"
                      >
                        {/* Animated background on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <Rocket className="w-10 h-10 text-white" />
                            </div>
                            <div>
                              <Badge className="bg-orange-600 text-white mb-2 text-sm px-3 py-1">
                                ⚡ QUICK START
                              </Badge>
                              <h3 className="text-3xl font-black text-slate-900 mb-1">
                                Simple Mode
                              </h3>
                              <p className="text-slate-600 font-semibold">
                                Fast 30-day roadmap
                              </p>
                            </div>
                          </div>

                          <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-3 text-slate-700">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-semibold">✅ 4-week action steps</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-700">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-semibold">✅ Quick wins & resources</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-700">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-semibold">✅ Ready in 10 seconds</span>
                            </li>
                          </ul>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionPlanMode('simple');
                              generateActionPlan();
                            }}
                            disabled={generatingPlan}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-2xl py-8 text-xl font-black group-hover:scale-105 transition-transform"
                            size="lg"
                          >
                            {generatingPlan && actionPlanMode === 'simple' ? (
                              <>
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Rocket className="w-6 h-6 mr-3" />
                                Get Simple Plan NOW ⚡
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* 🎯 ADVANCED MODE - RIGHT SIDE */}
                      <div
                        onClick={() => {
                          setActionPlanMode('advanced');
                          if (actionPlanMode === 'simple' && actionPlan) setActionPlan(null);
                          setShowActionPlan(true);
                        }}
                        className="group p-8 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer relative overflow-hidden"
                      >
                        {/* Animated background on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <Target className="w-10 h-10 text-white" />
                            </div>
                            <div>
                              <Badge className="bg-purple-600 text-white mb-2 text-sm px-3 py-1">
                                🎯 PREMIUM
                              </Badge>
                              <h3 className="text-3xl font-black text-slate-900 mb-1">
                                Advanced Mode
                              </h3>
                              <p className="text-slate-600 font-semibold">
                                Detailed personalized plan
                              </p>
                            </div>
                          </div>

                          <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-3 text-slate-700">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Star className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-semibold">⭐ Custom timeline & budget</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-700">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Star className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-semibold">⭐ Phase-by-phase breakdown</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-700">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Star className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-semibold">⭐ Milestones & success metrics</span>
                            </li>
                          </ul>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionPlanMode('advanced');
                              if (actionPlanMode === 'simple' && actionPlan) setActionPlan(null);
                              setShowActionPlan(true);
                            }}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl py-8 text-xl font-black group-hover:scale-105 transition-transform"
                            size="lg"
                          >
                            <Target className="w-6 h-6 mr-3" />
                            Customize Advanced Plan 🎯
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Career Recommendations */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Top Career Matches
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {results.career_recommendations?.slice(0, 4).map((career, i) => (
                    <Card key={i} className="border-none shadow-xl hover:shadow-2xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-slate-900">{career.career_title}</h3>
                          <Badge className="bg-green-600 text-white text-lg">
                            {career.match_percentage}% Match
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm mb-4">{career.description}</p>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Required Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {career.required_skills?.map((skill, j) => (
                                <Badge key={j} variant="outline" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">Growth Potential</p>
                              <p className="font-semibold text-green-600">{career.growth_potential}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Salary Range</p>
                              <p className="font-semibold text-blue-600">{career.salary_range}</p>
                            </div>
                          </div>

                          {career.suggested_courses && career.suggested_courses.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-1">📚 Recommended Courses:</p>
                              <ul className="text-xs text-slate-600 space-y-0.5">
                                {career.suggested_courses.slice(0, 3).map((course, j) => (
                                  <li key={j}>• {course}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Personality & Strengths */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-purple-600" />
                      Personality Traits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {results.personality_traits?.map((trait, i) => (
                        <Badge key={i} className="bg-purple-600">{trait}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Your Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {results.strengths?.map((strength, i) => (
                        <li key={i} className="text-slate-700">✓ {strength}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-orange-600" />
                      Growth Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {results.development_areas?.map((area, i) => (
                        <li key={i} className="text-slate-700">→ {area}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Learning & Work Preferences */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Learning Style
                    </h3>
                    <Badge className="bg-blue-600 text-white text-lg">
                      {results.learning_style}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Work Environment
                    </h3>
                    <Badge className="bg-green-600 text-white text-lg">
                      {results.work_environment_preference}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* AI Mentor Suggestion */}
              {results.mentor_preferences && (
                <Card className="border-none shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Recommended Mentor Profile
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Industries:</p>
                        <div className="flex flex-wrap gap-1">
                          {results.mentor_preferences.industry?.map((ind, i) => (
                            <Badge key={i} variant="outline">{ind}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Expertise:</p>
                        <div className="flex flex-wrap gap-1">
                          {results.mentor_preferences.expertise?.map((exp, i) => (
                            <Badge key={i} variant="outline">{exp}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Communication:</p>
                        <Badge className="bg-indigo-600">{results.mentor_preferences.communication_style}</Badge>
                      </div>
                    </div>
                    <Link to={createPageUrl("CareerLink")}>
                      <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                        <Users className="w-4 h-4 mr-2" />
                        Find Mentors on Career Link
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Link to={createPageUrl("CareerLink")} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg" size="lg">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Explore Career Link
                  </Button>
                </Link>
                <Link to={createPageUrl("Courses")} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg" size="lg">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Browse Recommended Courses
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setResults(null);
                    setQuizAnswers({});
                    setStep(1); // Reset to the first step
                    // Also reset action plan related states
                    setShowActionPlan(false);
                    setActionPlan(null);
                    setAdvancedInputs({
                      timeline: '3_months',
                      budget: 'low',
                      learning_preference: 'online',
                      time_commitment: '5-10_hours',
                      biggest_challenge: '',
                      specific_goals: '',
                      preferred_industries: []
                    });
                  }}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Retake Test
                </Button>
              </div>
            </div>

            {/* ✨ NEW: Action Plan Dialog */}
            {showActionPlan && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-600 to-pink-600 text-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Rocket className="w-6 h-6" />
                        {actionPlanMode === 'simple' ? 'Your 30-Day Action Plan' : 'Your Personalized Career Roadmap'}
                      </CardTitle>
                      <Button
                        onClick={() => {
                          setShowActionPlan(false);
                          // Optionally reset actionPlan only if closing and it's an advanced plan in progress
                          if (actionPlanMode === 'advanced' && !actionPlan) {
                              setActionPlan(null);
                          }
                        }}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {actionPlanMode === 'advanced' && !actionPlan ? (
                      /* Advanced Mode Form */
                      <div className="space-y-6">
                        <p className="text-slate-600 mb-6">
                          Fill in more details to get a highly personalized action plan
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label>Timeline / How fast do you want results?</Label>
                            <Select
                              value={advancedInputs.timeline}
                              onValueChange={(v) => setAdvancedInputs({...advancedInputs, timeline: v})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1_month">⚡ 1 Month (Intensive)</SelectItem>
                                <SelectItem value="3_months">🎯 3 Months (Balanced)</SelectItem>
                                <SelectItem value="6_months">📅 6 Months (Steady)</SelectItem>
                                <SelectItem value="1_year">🌱 1 Year (Long-term)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Budget for Courses/Training</Label>
                            <Select
                              value={advancedInputs.budget}
                              onValueChange={(v) => setAdvancedInputs({...advancedInputs, budget: v})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">💰 Free Only</SelectItem>
                                <SelectItem value="low">💵 $0 - $500</SelectItem>
                                <SelectItem value="medium">💸 $500 - $2000</SelectItem>
                                <SelectItem value="high">💎 $2000+</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Learning Preference</Label>
                            <Select
                              value={advancedInputs.learning_preference}
                              onValueChange={(v) => setAdvancedInputs({...advancedInputs, learning_preference: v})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="online">💻 Online Courses</SelectItem>
                                <SelectItem value="in_person">🏫 In-Person Training</SelectItem>
                                <SelectItem value="self_paced">📚 Self-Study</SelectItem>
                                <SelectItem value="mentorship">👥 Mentorship</SelectItem>
                                <SelectItem value="mixed">🎯 Mixed Approach</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Time Commitment Per Week</Label>
                            <Select
                              value={advancedInputs.time_commitment}
                              onValueChange={(v) => setAdvancedInputs({...advancedInputs, time_commitment: v})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-5_hours">⏰ 1-5 hours</SelectItem>
                                <SelectItem value="5-10_hours">⏱️ 5-10 hours</SelectItem>
                                <SelectItem value="10-20_hours">📆 10-20 hours</SelectItem>
                                <SelectItem value="20+_hours">🚀 20+ hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Biggest Challenge / Obstacle</Label>
                          <Textarea
                            value={advancedInputs.biggest_challenge}
                            onChange={(e) => setAdvancedInputs({...advancedInputs, biggest_challenge: e.target.value})}
                            placeholder="e.g., Lack of experience, No network, Financial constraints..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Specific Goals (Optional)</Label>
                          <Textarea
                            value={advancedInputs.specific_goals}
                            onChange={(e) => setAdvancedInputs({...advancedInputs, specific_goals: e.target.value})}
                            placeholder="e.g., Land a job at a tech company, Start freelancing, Switch to marketing..."
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={generateActionPlan}
                          disabled={generatingPlan}
                          className="w-full bg-gradient-to-r from-orange-600 to-pink-600 py-6 text-lg font-bold"
                          size="lg"
                        >
                          {generatingPlan ? (
                            <>
                              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                              Generating Your Plan...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-6 h-6 mr-3" />
                              Generate Advanced Plan
                            </>
                          )}
                        </Button>
                      </div>
                    ) : actionPlan ? (
                      /* Show Generated Plan */
                      <div className="space-y-6">
                        <div className="prose max-w-none">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                              <h3 className="text-2xl font-bold text-green-900 m-0">
                                Your Plan is Ready! 🎉
                              </h3>
                            </div>
                            <p className="text-green-800 m-0">
                              {actionPlanMode === 'simple'
                                ? 'Follow this 30-day plan to kickstart your career journey!'
                                : 'Your personalized roadmap based on your specific goals and preferences.'}
                            </p>
                          </div>

                          <div className="bg-white rounded-xl p-6 whitespace-pre-wrap text-slate-800 leading-relaxed">
                            {actionPlan}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            onClick={() => {
                              const blob = new Blob([actionPlan], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Career_Action_Plan_${new Date().toISOString().split('T')[0]}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Plan
                          </Button>
                          <Button
                            onClick={() => {
                              setActionPlan(null); // Clear current plan
                              // If in advanced mode, show the form again for a new advanced plan
                              if (actionPlanMode === 'advanced') {
                                setGeneratingPlan(false); // Make sure button is enabled
                              } else {
                                // If simple mode, just clear and user can click button again
                                setShowActionPlan(false);
                              }
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            {actionPlanMode === 'advanced' ? 'Refine Plan' : 'Generate New Plan'}
                          </Button>
                          <Link to={createPageUrl("CareerLink")} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                              <Briefcase className="w-4 h-4 mr-2" />
                              Find Mentors
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-slate-600">Generating Your Plan...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          {step !== 6 && (
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          )}
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Career Path Assessment</h1>
          <p className="text-slate-600">
            Discover your ideal career based on your interests, skills, and values
          </p>
        </div>

        {step < 6 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">
                Step {step} of 5
              </span>
              <span className="text-sm text-slate-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        )}

        <Card className="border-none shadow-2xl">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
