
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LanguageProvider, useLanguage, LanguageSelector } from "@/components/LanguageSelector";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationCenter from "@/components/NotificationCenter";
import AppGuide from "@/components/AppGuide"; // Added import
import {
  BookOpen,
  Home,
  Route,
  MessageSquare,
  Calendar,
  Building2,
  Vote,
  FileDown,
  Bot,
  LogOut,
  ChevronDown,
  Settings,
  Video,
  Brain,
  GraduationCap,
  Lightbulb,
  Crown,
  Shield,
  Sparkles,
  CreditCard,
  LogIn,
  Users,
  Search,
  CheckSquare,
  CalendarDays,
  Target,
  Gamepad2,
  Menu,
  X,
  Briefcase,
  Presentation,
  DollarSign,
  UserCog,
  Image,
  Award,
  Star,
  User,
  Phone,
  Mail,
  Camera,
  Clipboard,
  Code,
  Database,
  Globe,
  Layers,
  Map,
  Package,
  Scissors,
  Sliders,
  Zap
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getIconComponent = (iconName) => {
  const icons = {
    Home, BookOpen, Route, MessageSquare, Calendar, Building2, Vote, FileDown, Bot,
    Video, Brain, Target, Users, Briefcase, Presentation, Image, Settings, CheckSquare,
    Gamepad2, DollarSign, UserCog, Shield, Award, CreditCard, Star, User, Phone, Mail,
    Camera, Clipboard, Code, Database, Globe, Layers, Map, Package, Scissors, Sliders,
    Zap
  };
  return icons[iconName] || Home;
};

function LayoutContent({ children, currentPageName }) {
  const { t } = useLanguage();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false); // Added state for guide

  const { data: dynamicNavItems = [] } = useQuery({
    queryKey: ['appNavigation'],
    queryFn: () => base44.entities.AppNavigation.filter({ is_active: true }),
    initialData: []
  });

  const { data: generatedPages = [] } = useQuery({
    queryKey: ['generatedPages'],
    queryFn: () => base44.entities.GeneratedPage.filter({ is_active: true }),
    initialData: []
  });

  const navigationItems = dynamicNavItems
    .sort((a, b) => a.order - b.order)
    .map(item => {
      const IconComponent = getIconComponent(item.icon_name);
      const isGenerated = generatedPages.some(p => p.page_name === item.page_name);
      
      return {
        title: item.title,
        url: isGenerated ? `${createPageUrl('DynamicPageRenderer')}?page=${item.page_name}` : createPageUrl(item.page_name),
        icon: IconComponent,
        requiredRole: item.required_role,
        isGenerated
      };
    })
    .filter(item => {
      if (item.requiredRole === 'all') return true;
      if (item.requiredRole === 'admin') return user?.role === 'admin';
      if (item.requiredRole === 'premium') return user?.subscription_status === 'premium' || user?.role === 'admin';
      return true;
    });

  const getAdminItems = (adminLevel) => {
    const items = [];

    if (adminLevel === 'top_tier_admin') {
      items.push(
        { title: "🧭 Navigation Manager", url: createPageUrl("NavigationAdmin"), icon: Settings },
        { title: "🏆 Certificaten", url: createPageUrl("Certificates"), icon: Award },
        { title: "Course Admin", url: createPageUrl("CourseAdmin"), icon: Settings },
        { title: "Admin Settings", url: createPageUrl("AdminSettings"), icon: Settings },
        { title: "Approvals", url: createPageUrl("AdminApprovals"), icon: CheckSquare },
        { title: "PSA-OOT", url: createPageUrl("PsaOotAdmin"), icon: Gamepad2 },
        { title: "💳 Subscription Plans", url: createPageUrl("SubscriptionPlanAdmin"), icon: DollarSign },
        { title: "👥 Manage User Subs", url: createPageUrl("UserSubscriptionAdmin"), icon: UserCog },
        { title: "🚨 Account Strikes", url: createPageUrl("AccountStrikes"), icon: Shield },
        { title: "🔓 Unblock Users", url: createPageUrl("UnblockImageAccess"), icon: Shield },
        { title: "💰 Cost Monitor", url: createPageUrl("UsageMonitor"), icon: CreditCard }
      );
    }
    else if (adminLevel === 'super_admin') {
      items.push(
        { title: "🏆 Certificaten", url: createPageUrl("Certificates"), icon: Award },
        { title: "Course Admin", url: createPageUrl("CourseAdmin"), icon: Settings },
        { title: "Admin Settings", url: createPageUrl("AdminSettings"), icon: Settings },
        { title: "Approvals", url: createPageUrl("AdminApprovals"), icon: CheckSquare },
        { title: "PSA-OOT", url: createPageUrl("PsaOotAdmin"), icon: Gamepad2 },
        { title: "💳 Subscription Plans", url: createPageUrl("SubscriptionPlanAdmin"), icon: DollarSign },
        { title: "👥 Manage User Subs", url: createPageUrl("UserSubscriptionAdmin"), icon: UserCog },
        { title: "🚨 Account Strikes", url: createPageUrl("AccountStrikes"), icon: Shield },
        { title: "🔓 Unblock Users", url: createPageUrl("UnblockImageAccess"), icon: Shield },
        { title: "💰 Cost Monitor", url: createPageUrl("UsageMonitor"), icon: CreditCard }
      );
    }
    else if (adminLevel === 'supervisor_admin') {
      items.push(
        { title: "🏆 Certificaten", url: createPageUrl("Certificates"), icon: Award },
        { title: "Course Admin", url: createPageUrl("CourseAdmin"), icon: Settings },
        { title: "PSA-OOT", url: createPageUrl("PsaOotAdmin"), icon: Gamepad2 },
        { title: "💳 Subscription Plans", url: createPageUrl("SubscriptionPlanAdmin"), icon: DollarSign },
        { title: "👥 Manage User Subs", url: createPageUrl("UserSubscriptionAdmin"), icon: UserCog },
        { title: "🚨 Account Strikes", url: createPageUrl("AccountStrikes"), icon: Shield },
        { title: "🔓 Unblock Users", url: createPageUrl("UnblockImageAccess"), icon: Shield },
        { title: "💰 Cost Monitor", url: createPageUrl("UsageMonitor"), icon: CreditCard }
      );
    }

    return items;
  };

  const adminItems = user ? getAdminItems(user.admin_level) : [];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const currentUser = await base44.auth.me();

          if (!currentUser.trial_start_date) {
            const now = new Date();
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 60);

            await base44.auth.updateMe({
              trial_start_date: now.toISOString(),
              trial_end_date: trialEnd.toISOString(),
              subscription_status: 'free_trial'
            });

            currentUser.trial_start_date = now.toISOString();
            currentUser.trial_end_date = trialEnd.toISOString();
            currentUser.subscription_status = 'free_trial';
          }

          if (currentUser.role === 'admin' && currentUser.subscription_status !== 'premium') {
            await base44.auth.updateMe({
              subscription_status: 'premium'
            });
            currentUser.subscription_status = 'premium';
          }

          // Show guide on EVERY login if not seen yet
          if (!currentUser.has_seen_guide) {
            setShowGuide(true);
            await base44.auth.updateMe({ has_seen_guide: true });
          }

          setUser(currentUser);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    fetchUser();

    const interval = setInterval(async () => {
      try {
        if (await base44.auth.isAuthenticated()) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error refetching user in interval:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isPremium = user?.subscription_status === 'premium';
  const isFreeTrial = user?.subscription_status === 'free_trial';

  const getSubscriptionBadge = () => {
    if (isPremium) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white border-none shadow-lg">
          <Crown className="w-3 h-3 mr-1" />
          {t('premium')}
        </Badge>
      );
    } else if (isFreeTrial) {
      return (
        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-none shadow-md">
          <Sparkles className="w-3 h-3 mr-1" />
          {t('freeTrial')}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-none shadow-md">
          <Shield className="w-3 h-3 mr-1" />
          {t('standard')}
        </Badge>
      );
    }
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 239 84% 67%;
          --primary-foreground: 0 0% 100%;
          --secondary: 262 83% 58%;
          --accent: 217 91% 60%;
        }

        .logo-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        @media (max-width: 768px) {
          .mobile-menu-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 40;
            animation: fadeIn 0.2s ease-out;
            backdrop-filter: blur(4px);
          }

          .mobile-menu {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 85%;
            max-width: 320px;
            background: white;
            z-index: 50;
            animation: slideInLeft 0.3s ease-out;
            overflow-y: auto;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }

          .mobile-menu a,
          .mobile-menu button {
            min-height: 48px;
          }

          .sidebar-desktop {
            display: none !important;
          }
        }
      `}</style>

      <GlobalSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        currentGroup={null}
      />

      <AppGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Sidebar className="sidebar-desktop hidden lg:block border-r border-slate-200 bg-white/90 backdrop-blur-xl shadow-2xl">
          <SidebarHeader className="border-b border-slate-200 p-6 bg-gradient-to-r from-white to-purple-50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
                  <GraduationCap className="w-7 h-7 text-white transform -rotate-3" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h2 className="logo-text text-2xl">Pro-Session</h2>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">Professional Development</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 rounded-xl mb-1.5 group ${
                          location.pathname === item.url || location.pathname + location.search === item.url
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                            : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-slate-700 hover:scale-102'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className={`w-5 h-5 ${location.pathname === item.url || location.pathname + location.search === item.url ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                          <span className="font-semibold text-sm">{item.title}</span>
                          {item.isGenerated && (
                            <Sparkles className="w-3 h-3 ml-auto" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {adminItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-bold text-orange-600 uppercase tracking-wider px-3 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
                  {user?.admin_level === 'top_tier_admin' ? 'Top Tier Admin' :
                   user?.admin_level === 'super_admin' ? 'Super Admin' :
                   user?.admin_level === 'supervisor_admin' ? 'Supervisor' : 'Admin'}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`transition-all duration-200 rounded-xl mb-1.5 ${
                            location.pathname === item.url
                              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-105'
                            : 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 text-slate-700'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4 bg-gradient-to-r from-white to-purple-50">
            {isAuthenticated && user && !loading ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl p-3 transition-all">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-base">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getSubscriptionBadge()}
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">{user.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 shadow-xl">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold text-slate-900">Account Status</p>
                    <div className="mt-2">
                      {getSubscriptionBadge()}
                    </div>
                  </div>
                  <Link to={createPageUrl("Subscription")}>
                    <DropdownMenuItem className="cursor-pointer py-3">
                      <CreditCard className="w-4 h-4 mr-2" />
                      <div>
                        <p className="font-semibold">{t('mySubscription')}</p>
                        <p className="text-xs text-slate-500">{t('viewPlans')}</p>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl("NotificationSettings")}>
                    <DropdownMenuItem className="cursor-pointer py-3">
                      <Settings className="w-4 h-4 mr-2" />
                      <div>
                        <p className="font-semibold">Notification Settings</p>
                        <p className="text-xs text-slate-500">Manage notifications</p>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-semibold cursor-pointer py-3">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                {t('signIn')}
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        {mobileMenuOpen && (
          <>
            <div className="mobile-menu-overlay lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="mobile-menu lg:hidden">
              <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="logo-text text-lg font-bold">Pro-Session</h2>
                    <p className="text-[8px] text-slate-500 uppercase tracking-wide">Professional Development</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="hover:bg-white/50">
                  <X className="w-6 h-6 text-slate-700" />
                </Button>
              </div>

              {isAuthenticated && user ? (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-base truncate">{user.full_name || 'User'}</p>
                      <p className="text-xs text-slate-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    {getSubscriptionBadge()}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link to={createPageUrl("Subscription")} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        <CreditCard className="w-4 h-4 mr-1" />
                        <span className="text-xs">Subscription</span>
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      <span className="text-xs">Logout</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      base44.auth.redirectToLogin();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-bold shadow-xl"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In / Login
                  </Button>
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Login to access all features
                  </p>
                </div>
              )}

              <div className="p-3 space-y-1">
                <p className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Navigation</p>
                {navigationItems.map((item) => (
                  <Link key={item.title} to={item.url} onClick={() => setMobileMenuOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                      location.pathname === item.url || location.pathname + location.search === item.url
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'hover:bg-slate-100 text-slate-700 active:bg-slate-200'
                    }`}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm flex-1">{item.title}</span>
                      {item.isGenerated && (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </div>
                  </Link>
                ))}

                {adminItems.length > 0 && (
                  <>
                    <div className="px-4 py-3 text-xs font-bold text-orange-600 uppercase flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
                      Admin
                    </div>
                    {adminItems.map((item) => (
                      <Link key={item.title} to={item.url} onClick={() => setMobileMenuOpen(false)}>
                        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                          location.pathname === item.url
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                            : 'hover:bg-orange-50 text-slate-700 active:bg-orange-100'
                        }`}>
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-semibold text-sm">{item.title}</span>
                        </div>
                      </Link>
                    ))}
                  </>
                )}

                {isAuthenticated && user && (
                  <div className="pt-2 mt-2 border-t">
                    <Link to={createPageUrl("NotificationSettings")} onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700">
                        <Settings className="w-5 h-5" />
                        <span className="font-semibold text-sm">Notification Settings</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <main className="flex-1 flex flex-col">
          <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 shadow-lg sticky top-0 z-30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden flex-shrink-0 hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6 text-slate-700" />
                </Button>

                <SidebarTrigger className="hidden lg:block hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-2 rounded-lg transition-all" />
                
                <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                    <GraduationCap className="w-5 h-5 sm:w-6 h-6 text-white" />
                  </div>
                  <h1 className="logo-text text-base sm:text-lg font-bold hidden xs:block">Pro-Session</h1>
                </div>

                {isAuthenticated && (
                  <Button
                    variant="outline"
                    className="ml-auto mr-2 hidden sm:flex w-32 md:w-48 lg:w-64 justify-start text-slate-500 hover:text-slate-900 hover:border-blue-400"
                    onClick={() => setShowSearch(true)}
                  >
                    <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="flex-1 text-left text-sm truncate">Search...</span>
                    <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </Button>
                )}

                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden ml-auto flex-shrink-0 hover:bg-blue-50"
                    onClick={() => setShowSearch(true)}
                  >
                    <Search className="w-5 h-5 text-slate-700" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
                <LanguageSelector />
                
                {isAuthenticated && user && !loading ? (
                  <>
                    <Button
                      onClick={() => setShowGuide(true)}
                      variant="outline"
                      size="icon"
                      className="hover:bg-blue-50 border-blue-200"
                      title="App Guide"
                    >
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Link to={createPageUrl("XPShop")}>
                      <Button variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none hover:from-yellow-500 hover:to-orange-600 shadow-lg">
                        <Star className="w-4 h-4" />
                        <span className="font-bold hidden sm:inline">{user.xp_points || 0} XP</span>
                        <span className="font-bold sm:hidden">{user.xp_points || 0}</span>
                      </Button>
                    </Link>
                    <NotificationCenter user={user} />
                    <div className="hidden sm:flex items-center gap-2">
                      {getSubscriptionBadge()}
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}
