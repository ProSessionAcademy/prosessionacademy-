import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Clock, Award, Play, Lock, Filter, LogIn, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const levelColors = {
  beginner: "bg-green-100 text-green-700 border-green-200",
  intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  advanced: "bg-purple-100 text-purple-700 border-purple-200",
  expert: "bg-orange-100 text-orange-700 border-orange-200"
};

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

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
        console.error("Error fetching user or authentication status:", error);
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const allCourses = await base44.entities.Course.list('-created_date');
      return allCourses.filter(course => !course.is_student_course);
    },
    initialData: [],
  });

  const handleStartCourse = (courseId) => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.pathname);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    const matchesType = typeFilter === "all" ||
                        (typeFilter === "professional" && !course.is_student_course) ||
                        (typeFilter === "student" && course.is_student_course);
    return matchesSearch && matchesCategory && matchesLevel && matchesType;
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "self_development", label: "Self Development" },
    { value: "leadership", label: "Leadership" },
    { value: "management", label: "Management" },
    { value: "business", label: "Business" },
    { value: "sales", label: "Sales" },
    { value: "marketing", label: "Marketing" },
    { value: "study_skills", label: "Study Skills" }
  ];

  const levels = [
    { value: "all", label: "All Levels", icon: "🎯" },
    { value: "beginner", label: "Beginner", icon: "🌱" },
    { value: "intermediate", label: "Intermediate", icon: "📈" },
    { value: "advanced", label: "Advanced", icon: "🚀" },
    { value: "expert", label: "Expert", icon: "👑" }
  ];

  const types = [
    { value: "all", label: "All Courses", icon: "📚" },
    { value: "professional", label: "Professional", icon: "💼" },
    { value: "student", label: "Academic", icon: "🎓" }
  ];

  if (!isAuthenticated && user === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="max-w-md w-full border-none shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Login Required</h2>
              <p className="text-slate-600 mb-6 text-lg">Please log in to access courses and start learning</p>
              <Button onClick={() => base44.auth.redirectToLogin()} size="lg" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg py-6 text-lg">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Professional Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-5"></div>
            <div className="relative p-8 lg:p-12">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                    Course Library
                  </h1>
                  <p className="text-lg text-slate-600">
                    Professional development & academic courses for everyone
                  </p>
                </div>
              </div>
              
              {!isAuthenticated && (
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
                  <p className="text-blue-900 font-medium">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Browse courses freely. <button onClick={() => base44.auth.redirectToLogin()} className="underline font-bold">Login</button> to start learning!
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Course Request Highlight */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-white">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Lightbulb className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                      💡 Can't Find What You Need?
                    </h2>
                    <p className="text-white/95 text-lg">
                      Request a course and we'll create it for you!
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("CourseRequest")}>
                  <Button className="bg-white text-orange-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-6 font-bold">
                    <Lightbulb className="w-6 h-6 mr-2" />
                    Request Course
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Filters */}
        <Card className="border-none shadow-xl bg-white">
          <CardContent className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg border-2 border-slate-200 focus:border-blue-500 rounded-xl shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-bold text-slate-700">Filters</span>
              </div>

              {/* Type Filter */}
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Course Type</p>
                <div className="flex gap-3 flex-wrap">
                  {types.map(type => (
                    <Button
                      key={type.value}
                      variant={typeFilter === type.value ? "default" : "outline"}
                      onClick={() => setTypeFilter(type.value)}
                      size="sm"
                      className={`rounded-xl ${
                        typeFilter === type.value
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'border-2 hover:bg-slate-50'
                      }`}
                    >
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Category</p>
                <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                  <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto gap-2 bg-slate-100 p-2 rounded-xl">
                    {categories.map(cat => (
                      <TabsTrigger
                        key={cat.value}
                        value={cat.value}
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-4 py-2 whitespace-nowrap"
                      >
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Level Filter */}
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Difficulty Level</p>
                <div className="flex gap-3 flex-wrap">
                  {levels.map(level => (
                    <Button
                      key={level.value}
                      variant={levelFilter === level.value ? "default" : "outline"}
                      onClick={() => setLevelFilter(level.value)}
                      size="sm"
                      className={`rounded-xl ${
                        levelFilter === level.value
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'border-2 hover:bg-slate-50'
                      }`}
                    >
                      <span className="mr-2">{level.icon}</span>
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(categoryFilter !== "all" || levelFilter !== "all" || typeFilter !== "all" || searchQuery) && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <span className="font-semibold text-blue-900">
                  Showing {filteredCourses.length} course(s)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setLevelFilter("all");
                    setTypeFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-4 font-medium">Loading courses...</p>
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
              >
                <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col bg-white">
                  <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className={`absolute top-4 right-4 ${levelColors[course.level]} border-2 shadow-lg`}>
                      {course.level}
                    </Badge>
                  </div>

                  <CardHeader className="pb-3">
                    <Badge variant="outline" className="w-fit mb-2 text-xs bg-slate-50">
                      {course.category?.replace(/_/g, ' ')}
                    </Badge>
                    <CardTitle className="text-xl line-clamp-2 text-slate-900">
                      {course.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col space-y-4">
                    <p className="text-slate-600 line-clamp-3 flex-1">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {course.duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration_hours}h</span>
                        </div>
                      )}
                      {course.instructor && (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Award className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{course.instructor}</span>
                        </div>
                      )}
                    </div>

                    {isAuthenticated ? (
                      <Link to={`${createPageUrl("Learning")}?courseId=${course.id}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md py-6">
                          <Play className="w-5 h-5 mr-2" />
                          Start Course
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleStartCourse(course.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md py-6"
                      >
                        <Lock className="w-5 h-5 mr-2" />
                        Login to Start
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCourses.length === 0 && (
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-16 text-center">
              <BookOpen className="w-20 h-20 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your search or filters</p>
              <Button
                onClick={() => {
                  setCategoryFilter("all");
                  setLevelFilter("all");
                  setTypeFilter("all");
                  setSearchQuery("");
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}