import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  GraduationCap,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Zap,
  Trophy,
  Briefcase,
  Heart,
  Rocket
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const QUESTIONS = [
  {
    id: 1,
    question: "Where are you currently in your professional/academic journey?",
    type: "single",
    options: [
      { value: "student_early", label: "Early student (Year 1-2) - Just starting", points: { beginner: 20 }, categories: ["study_skills", "self_development"] },
      { value: "student_mid", label: "Mid-level student (Year 3) - Building expertise", points: { beginner: 10, intermediate: 15 }, categories: ["study_skills", "business"] },
      { value: "student_final", label: "Final year student - Preparing for career", points: { intermediate: 20 }, categories: ["business", "leadership"] },
      { value: "early_career", label: "Early career professional (0-3 years)", points: { intermediate: 15, advanced: 10 }, categories: ["business", "management"] },
      { value: "mid_career", label: "Mid-career professional (4-7 years)", points: { advanced: 20 }, categories: ["leadership", "management"] },
      { value: "senior", label: "Senior professional/Leader (8+ years)", points: { advanced: 10, expert: 20 }, categories: ["leadership", "business"] }
    ]
  },
  {
    id: 2,
    question: "What's the PRIMARY thing driving your desire to learn and grow right now?",
    type: "single",
    options: [
      { value: "grades", label: "Academic success - Better grades and understanding", points: { beginner: 15 }, categories: ["study_skills"] },
      { value: "job_hunt", label: "Career entry - Landing my first/next job", points: { beginner: 10, intermediate: 10 }, categories: ["business", "self_development"] },
      { value: "promotion", label: "Career advancement - Promotion or leadership role", points: { intermediate: 10, advanced: 15 }, categories: ["leadership", "management"] },
      { value: "entrepreneurship", label: "Entrepreneurship - Starting or growing my business", points: { advanced: 15, expert: 15 }, categories: ["business", "sales"] },
      { value: "fulfillment", label: "Personal fulfillment - Finding purpose and meaning", points: { intermediate: 10, expert: 10 }, categories: ["self_development"] },
      { value: "income", label: "Financial growth - Significantly increase earnings", points: { advanced: 10, expert: 10 }, categories: ["sales", "business"] },
      { value: "impact", label: "Making impact - Influence and help others succeed", points: { advanced: 15, expert: 15 }, categories: ["leadership", "self_development"] }
    ]
  },
  {
    id: 3,
    question: "How do you typically handle a major challenge or setback?",
    type: "single",
    options: [
      { value: "ask_help", label: "I immediately seek help from mentors or experts", points: { beginner: 15 }, categories: ["self_development"] },
      { value: "research", label: "I research and learn everything I can about it first", points: { beginner: 10, intermediate: 10 }, categories: ["study_skills", "self_development"] },
      { value: "plan", label: "I analyze the situation and create a detailed action plan", points: { intermediate: 15, advanced: 10 }, categories: ["management", "business"] },
      { value: "team", label: "I bring my team together to brainstorm solutions", points: { advanced: 20 }, categories: ["leadership", "management"] },
      { value: "pivot", label: "I quickly adapt and try different innovative approaches", points: { advanced: 10, expert: 15 }, categories: ["business", "leadership"] },
      { value: "teach", label: "I see it as a teaching moment and help others avoid it", points: { expert: 20 }, categories: ["leadership", "self_development"] }
    ]
  },
  {
    id: 4,
    question: "What are your BIGGEST growth areas right now? (Select ALL that apply)",
    type: "multiple",
    options: [
      { value: "time_mgmt", label: "⏰ Time management - I'm always overwhelmed and behind", categories: ["study_skills", "self_development"] },
      { value: "confidence", label: "💪 Confidence - Impostor syndrome and self-doubt", categories: ["self_development"] },
      { value: "speaking", label: "🎤 Public speaking - Presenting ideas clearly", categories: ["leadership", "self_development"] },
      { value: "writing", label: "✍️ Writing - Reports, emails, proposals", categories: ["study_skills", "business"] },
      { value: "leadership", label: "👥 Leadership - Motivating and guiding others", categories: ["leadership", "management"] },
      { value: "strategy", label: "🎯 Strategic thinking - Long-term planning", categories: ["management", "business"] },
      { value: "sales", label: "💼 Sales/Negotiation - Closing deals, persuading", categories: ["sales", "business"] },
      { value: "networking", label: "🤝 Networking - Building professional relationships", categories: ["business", "sales"] },
      { value: "focus", label: "🧠 Focus - Avoiding distractions and procrastination", categories: ["study_skills", "self_development"] },
      { value: "delegation", label: "📋 Delegation - Trusting others with tasks", categories: ["management", "leadership"] }
    ]
  },
  {
    id: 5,
    question: "When you imagine yourself in 5 years, what does success look like?",
    type: "single",
    options: [
      { value: "expert_contributor", label: "I'm a recognized expert, contributing meaningfully to my field", points: { intermediate: 15, advanced: 10 }, categories: ["study_skills", "business"] },
      { value: "team_leader", label: "I'm leading a successful team or department", points: { advanced: 20 }, categories: ["leadership", "management"] },
      { value: "business_owner", label: "I own and run a thriving business or consultancy", points: { expert: 25 }, categories: ["business", "sales"] },
      { value: "senior_exec", label: "I'm in senior management making strategic decisions", points: { advanced: 15, expert: 15 }, categories: ["leadership", "management"] },
      { value: "mentor", label: "I'm mentoring and developing the next generation", points: { expert: 20 }, categories: ["leadership", "self_development"] },
      { value: "freedom", label: "I have location/time freedom while earning well", points: { advanced: 10, expert: 15 }, categories: ["business", "self_development"] },
      { value: "exploring", label: "Still exploring and figuring out my path", points: { beginner: 15 }, categories: ["self_development"] }
    ]
  },
  {
    id: 6,
    question: "How comfortable are you with feedback - both giving and receiving it?",
    type: "single",
    options: [
      { value: "avoid", label: "I avoid it - feedback feels like criticism", points: { beginner: 15 }, categories: ["self_development"] },
      { value: "receive_only", label: "I can receive it, but struggle to give honest feedback", points: { beginner: 10, intermediate: 10 }, categories: ["self_development", "management"] },
      { value: "comfortable", label: "I'm comfortable with both when needed", points: { intermediate: 15, advanced: 10 }, categories: ["management", "leadership"] },
      { value: "proactive", label: "I actively seek feedback and provide it regularly", points: { advanced: 20 }, categories: ["leadership", "management"] },
      { value: "culture_builder", label: "I create feedback cultures - it's core to my leadership", points: { expert: 25 }, categories: ["leadership"] }
    ]
  },
  {
    id: 7,
    question: "What's your natural learning style and approach?",
    type: "single",
    options: [
      { value: "structured", label: "I need step-by-step structured courses with clear guidance", points: { beginner: 15 }, categories: ["study_skills"] },
      { value: "mixed", label: "I mix structured learning with self-exploration", points: { intermediate: 15 }, categories: ["study_skills", "self_development"] },
      { value: "doing", label: "I learn best by jumping in and doing - trial and error", points: { intermediate: 10, advanced: 10 }, categories: ["business"] },
      { value: "teaching", label: "I learn by teaching and explaining to others", points: { advanced: 15, expert: 10 }, categories: ["leadership", "self_development"] },
      { value: "creating", label: "I learn by creating my own projects and systems", points: { expert: 20 }, categories: ["business", "leadership"] }
    ]
  },
  {
    id: 8,
    question: "Realistically, how many hours per week can you commit to learning?",
    type: "single",
    options: [
      { value: "1-2", label: "1-2 hours - I'm extremely busy", points: { beginner: 10 } },
      { value: "3-5", label: "3-5 hours - Consistent weekly commitment", points: { intermediate: 15 } },
      { value: "6-10", label: "6-10 hours - Serious about development", points: { advanced: 15 } },
      { value: "10-15", label: "10-15 hours - Major life priority right now", points: { advanced: 10, expert: 10 } },
      { value: "15+", label: "15+ hours - Full-time focus on growth", points: { expert: 10 } }
    ]
  },
  {
    id: 9,
    question: "What's your STRONGEST professional capability right now?",
    type: "single",
    options: [
      { value: "analytical", label: "🔍 Analytical thinking - Breaking down complex problems", categories: ["management", "business"] },
      { value: "creative", label: "🎨 Creativity & Innovation - Thinking outside the box", categories: ["marketing", "business"] },
      { value: "people", label: "❤️ People skills - Empathy, relationships, collaboration", categories: ["leadership", "self_development"] },
      { value: "execution", label: "⚡ Execution - Getting things done efficiently", categories: ["management", "study_skills"] },
      { value: "persuasion", label: "💬 Persuasion - Influencing and convincing others", categories: ["sales", "leadership"] },
      { value: "learning", label: "📚 Quick learning - Mastering new things fast", categories: ["study_skills", "self_development"] },
      { value: "vision", label: "🔮 Visionary - Seeing opportunities others miss", categories: ["leadership", "business"] }
    ]
  },
  {
    id: 10,
    question: "When do you feel MOST energized, alive, and in your element?",
    type: "single",
    options: [
      { value: "learning_new", label: "When I'm learning something completely new", categories: ["self_development", "study_skills"] },
      { value: "leading_team", label: "When I'm leading and inspiring a team", categories: ["leadership", "management"] },
      { value: "solving_problems", label: "When I'm solving complex strategic problems", categories: ["business", "management"] },
      { value: "helping_others", label: "When I'm helping others grow and succeed", categories: ["leadership", "self_development"] },
      { value: "achieving_goals", label: "When I'm hitting targets and achieving results", categories: ["sales", "business"] },
      { value: "creating", label: "When I'm creating something from nothing", categories: ["business", "marketing"] },
      { value: "presenting", label: "When I'm presenting ideas to audiences", categories: ["leadership", "sales"] }
    ]
  },
  {
    id: 11,
    question: "How do you handle failure or making mistakes?",
    type: "single",
    options: [
      { value: "hard", label: "I take it hard - it affects my confidence for a while", points: { beginner: 15 }, categories: ["self_development"] },
      { value: "learn", label: "I analyze what went wrong and learn from it", points: { intermediate: 15 }, categories: ["self_development", "study_skills"] },
      { value: "quickly", label: "I bounce back quickly and try a different approach", points: { advanced: 15 }, categories: ["business", "leadership"] },
      { value: "share", label: "I share the lessons publicly to help others", points: { expert: 20 }, categories: ["leadership", "self_development"] }
    ]
  },
  {
    id: 12,
    question: "What's your relationship with taking risks?",
    type: "single",
    options: [
      { value: "avoid", label: "I prefer safe, proven paths - risks make me anxious", points: { beginner: 15 }, categories: ["self_development"] },
      { value: "calculated", label: "I take calculated risks after careful analysis", points: { intermediate: 15, advanced: 10 }, categories: ["management", "business"] },
      { value: "comfortable", label: "I'm comfortable with risk - growth requires it", points: { advanced: 20 }, categories: ["business", "leadership"] },
      { value: "thrive", label: "I thrive on risk - I'm most alive when stakes are high", points: { expert: 20 }, categories: ["business", "sales"] }
    ]
  }
];

export default function AssessmentTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multipleAnswers, setMultipleAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [user, setUser] = useState(null);

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

  const { data: allCourses = [] } = useQuery({
    queryKey: ['allCoursesForAssessment'],
    queryFn: () => base44.entities.Course.list(),
    initialData: [],
  });

  const currentQ = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const handleAnswer = (value) => {
    if (currentQ.type === "multiple") {
      if (multipleAnswers.includes(value)) {
        setMultipleAnswers(multipleAnswers.filter(v => v !== value));
      } else {
        setMultipleAnswers([...multipleAnswers, value]);
      }
    } else {
      setAnswers({ ...answers, [currentQuestion]: value });
    }
  };

  const nextQuestion = () => {
    if (currentQ.type === "multiple") {
      setAnswers({ ...answers, [currentQuestion]: multipleAnswers });
      setMultipleAnswers([]);
    }
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const canProceed = () => {
    if (currentQ.type === "multiple") {
      return multipleAnswers.length > 0;
    }
    return answers[currentQuestion] !== undefined;
  };

  const calculateResults = () => {
    const levelScores = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    const categoryPreferences = {};

    QUESTIONS.forEach((q, idx) => {
      const answer = answers[idx];
      if (!answer) return;

      if (Array.isArray(answer)) {
        answer.forEach(val => {
          const option = q.options.find(opt => opt.value === val);
          if (option?.categories) {
            option.categories.forEach(cat => {
              categoryPreferences[cat] = (categoryPreferences[cat] || 0) + 1;
            });
          }
        });
      } else {
        const option = q.options.find(opt => opt.value === answer);
        if (option?.points) {
          Object.keys(option.points).forEach(level => {
            levelScores[level] += option.points[level];
          });
        }
        if (option?.categories) {
          option.categories.forEach(cat => {
            categoryPreferences[cat] = (categoryPreferences[cat] || 0) + 1;
          });
        }
      }
    });

    const maxScore = Math.max(...Object.values(levelScores));
    const recommendedLevel = Object.keys(levelScores).find(level => levelScores[level] === maxScore) || "intermediate";

    const sortedCategories = Object.entries(categoryPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const recommendedCourses = allCourses
      .filter(course => {
        const matchesLevel = course.level === recommendedLevel;
        const matchesCategory = sortedCategories.includes(course.category);
        const notStudentCourse = !course.is_student_course && !course.academic_year;
        return matchesLevel && matchesCategory && notStudentCourse;
      })
      .slice(0, 6);

    const totalScore = Math.round((maxScore / 250) * 100);

    setResults({
      level: recommendedLevel,
      levelScores,
      categories: sortedCategories,
      recommendedCourses,
      score: totalScore
    });
    setShowResults(true);
  };

  const getLevelBadgeColor = (level) => {
    const colors = {
      beginner: "from-green-500 to-emerald-600",
      intermediate: "from-blue-500 to-indigo-600",
      advanced: "from-purple-500 to-pink-600",
      expert: "from-orange-500 to-red-600"
    };
    return colors[level] || "from-gray-500 to-gray-600";
  };

  const getLevelDescription = (level) => {
    const descriptions = {
      beginner: "You're building your foundation! Focus on core skills and fundamental knowledge to establish a strong base.",
      intermediate: "You have solid fundamentals! Time to deepen your expertise and take on more complex challenges.",
      advanced: "You're at a high level! Focus on leadership, strategy, and mastering advanced concepts.",
      expert: "You're operating at mastery level! Focus on innovation, teaching others, and creating lasting impact."
    };
    return descriptions[level];
  };

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="border-none shadow-2xl overflow-hidden">
            <div className={`h-32 bg-gradient-to-r ${getLevelBadgeColor(results.level)} relative`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Trophy className="w-16 h-16 mx-auto mb-2" />
                  <h2 className="text-3xl font-bold">Assessment Complete!</h2>
                </div>
              </div>
            </div>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-3xl font-bold text-blue-900">{results.score}%</p>
                  <p className="text-sm text-blue-700">Readiness Score</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-900 capitalize">{results.level}</p>
                  <p className="text-sm text-purple-700">Recommended Level</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                  <Target className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                  <p className="text-3xl font-bold text-pink-900">{results.recommendedCourses.length}</p>
                  <p className="text-sm text-pink-700">Perfect Matches</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Your Learning Profile</h3>
                <p className="text-slate-600 mb-4">{getLevelDescription(results.level)}</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Level Breakdown:</p>
                  {Object.entries(results.levelScores).map(([level, score]) => (
                    <div key={level} className="flex items-center gap-3">
                      <span className="text-sm capitalize w-24 text-slate-600">{level}</span>
                      <Progress value={(score / 250) * 100} className="flex-1 h-2" />
                      <span className="text-sm font-semibold text-slate-700">{score} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Your Top Focus Areas:</h3>
                <div className="flex gap-2 flex-wrap">
                  {results.categories.map(cat => (
                    <Badge key={cat} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm">
                      {cat.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Your Personalized Course Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {results.recommendedCourses.length > 0 ? (
                results.recommendedCourses.map(course => (
                  <Link key={course.id} to={createPageUrl(`Learning?courseId=${course.id}`)}>
                    <Card className="h-full hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-400">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1 line-clamp-1">{course.title}</h4>
                            <p className="text-xs text-slate-600 mb-2 line-clamp-2">{course.description}</p>
                            <div className="flex gap-2">
                              <Badge className={`text-xs ${levelColors[course.level]}`}>{course.level}</Badge>
                              <Badge variant="outline" className="text-xs">{course.category?.replace(/_/g, ' ')}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-slate-500 mb-4">Check out all courses to find what suits you!</p>
                  <Link to={createPageUrl("Courses")}>
                    <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600">
                      Browse All Courses
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Link to={createPageUrl("Courses")}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore All Courses
              </Button>
            </Link>
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full border-none shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-purple-100 text-purple-700">
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </Badge>
            <span className="text-sm text-slate-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {currentQuestion + 1}
            </div>
            {currentQ.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = currentQ.type === "multiple" 
              ? multipleAnswers.includes(option.value)
              : answers[currentQuestion] === option.value;

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <span className="font-medium text-slate-900">{option.label}</span>
                </div>
              </button>
            );
          })}

          {currentQ.type === "multiple" && (
            <p className="text-xs text-slate-500 text-center pt-2">Select all that apply</p>
          )}

          <Button
            onClick={nextQuestion}
            disabled={!canProceed()}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {currentQuestion < QUESTIONS.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Get My Results
                <Sparkles className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const levelColors = {
  beginner: "bg-green-100 text-green-700 border-green-200",
  intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  advanced: "bg-purple-100 text-purple-700 border-purple-200",
  expert: "bg-orange-100 text-orange-700 border-orange-200"
};