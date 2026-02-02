"use client";

import { useState, useEffect } from "react";
import { Navbar, type NotificationItem } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { ComplaintCard } from "@/components/ComplaintCard";
import { ComplaintForm } from "@/components/ComplaintForm";
import { AuthPage } from "@/components/AuthPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle2, Clock, AlertTriangle, Filter, ChevronRight, LogOut, Loader2, Activity, Search, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Complaint {
  id: string;
  title: string;
  location: string;
  category: string;
  category_id: string;
  current_status: 'pending' | 'proses' | 'selesai';
  description: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  categories?: { name: string };
  complaint_progress?: any[];
  users?: { name: string };
}

interface UserProfile {
  id: string; // The public.users.id
  userId: string; // The auth.users.id
  role: "admin" | "siswa";
  name: string;
  email: string;
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger re-fetch
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Load cleared notifications and read status from localStorage on mount/session change
  useEffect(() => {
    if (userProfile?.id) {
      const savedClearedIds = localStorage.getItem(`clearedNotifs_${userProfile.id}`);
      if (savedClearedIds) {
        setClearedNotifIds(JSON.parse(savedClearedIds));
      }
      
      const savedReadStatus = localStorage.getItem(`readNotifs_${userProfile.id}`);
      if (savedReadStatus) {
        const readIds = JSON.parse(savedReadStatus) as string[];
        setNotifications(prev => prev.map(n => readIds.includes(n.id) ? { ...n, isRead: true } : n));
      }
    }
  }, [userProfile?.id]);

  // Persist cleared notifications to localStorage
  useEffect(() => {
    if (userProfile?.id) {
      localStorage.setItem(`clearedNotifs_${userProfile.id}`, JSON.stringify(clearedNotifIds));
    }
  }, [clearedNotifIds, userProfile?.id]);

  // Persist read status to localStorage
  useEffect(() => {
    if (userProfile?.id && notifications.length > 0) {
      const readIds = notifications.filter(n => n.isRead).map(n => n.id);
      localStorage.setItem(`readNotifs_${userProfile.id}`, JSON.stringify(readIds));
    }
  }, [notifications, userProfile?.id]);

  const SERVER_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/server`;

  // 1. Check Session & Fetch Profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/profile/${userId}`, {
        headers: { 
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Complaints
  useEffect(() => {
    if (!session) return;

    const fetchComplaints = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/complaints`, {
          headers: { 
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
          }
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data);
          
          // Generate notifications while preserving read status for existing ones
          setNotifications(prev => {
            const currentNotifs = [...prev];
            // Get read IDs from localStorage if available to sync new notifications
            const savedReadStatus = typeof window !== 'undefined' && userProfile?.id 
              ? localStorage.getItem(`readNotifs_${userProfile.id}`) 
              : null;
            const readIds = savedReadStatus ? JSON.parse(savedReadStatus) as string[] : [];

            return data.slice(0, 5)
              .filter((c: Complaint) => !clearedNotifIds.includes(`notif-${c.id}-${c.current_status}`))
              .map((c: Complaint) => {
                const id = `notif-${c.id}-${c.current_status}`; 
                const existing = currentNotifs.find(n => n.id === id);
                
                if (existing) return existing; 
                
                return {
                  id,
                  title: c.current_status === 'pending' ? 'Laporan Baru' : 'Update Status',
                  message: c.current_status === 'pending' 
                    ? `Laporan "${c.title}" telah diterima.` 
                    : `Status laporan "${c.title}" berubah menjadi ${c.current_status.toUpperCase()}.`,
                  time: new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                  isRead: readIds.includes(id), // Use persisted read status
                  type: c.current_status === 'pending' ? 'new_report' : 'status_change'
                };
              });
          });
        }
      } catch (error) {
        console.error("Error fetching complaints", error);
      }
    };

    fetchComplaints();
  }, [session, refreshTrigger]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Filter complaints based on Role & Status & Page Context
  const visibleComplaints = complaints.filter(c => {
    // 1. Role & Privacy Filter:
    // Admin sees everything. 
    // On 'history' page, everyone sees everything (Public History).
    // On other pages (like 'tracking'), students only see their own reports.
    const isOwner = c.user_id === userProfile?.id;
    const isAdmin = userProfile?.role === "admin";
    const isHistoryPage = currentPage === "history";
    
    if (!isAdmin && !isHistoryPage && !isOwner) return false;

    // 2. Status Filter:
    if (currentPage === "tracking" && statusFilter === "all") {
      if (c.current_status === "selesai") return false;
    } else if (statusFilter !== "all" && c.current_status !== statusFilter) {
      return false;
    }

    // 3. Search Filter:
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(query) || 
        c.location.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Stats (Global from DB)
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.current_status === "pending").length,
    process: complaints.filter(c => c.current_status === "proses").length,
    done: complaints.filter(c => c.current_status === "selesai").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !userProfile) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthPage onAuthSuccess={() => refreshData()} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-gray-900">
      <Toaster position="top-right" richColors />
      <Navbar 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onNavigate={navigate} 
        userRole={userProfile.role}
        onLogout={handleLogout}
        currentPage={currentPage}
        notifications={notifications}
        unreadCount={notifications.filter(n => !n.isRead).length}
        onMarkAllRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          toast.success("Semua notifikasi ditandai sudah dibaca");
        }}
        onClearAll={() => {
          // Track cleared IDs to prevent them from coming back on next fetch
          const currentlyDisplayedIds = notifications.map(n => n.id);
          setClearedNotifIds(prev => [...prev, ...currentlyDisplayedIds]);
          setNotifications([]);
          toast.success("Semua notifikasi telah dihapus");
        }}
        onDeleteNotification={(id) => {
          setClearedNotifIds(prev => [...prev, id]);
          setNotifications(prev => prev.filter(n => n.id !== id));
          toast.success("Notifikasi dihapus");
        }}
        onMarkAsRead={(id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={navigate} 
        userRole={userProfile.role}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* DASHBOARD VIEW */}
        {currentPage === "dashboard" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Hero/Welcome Section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-primary via-[#0B5ED7] to-[#4FC3F7] p-8 md:p-12 text-white shadow-2xl shadow-primary/20 group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-xl text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] mb-6 backdrop-blur-md">
                      PORTAL {userProfile.role === 'admin' ? 'ADMINISTRATOR' : 'SISWA'}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
                      Halo, {userProfile.name.split(' ')[0]} 👋
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed max-w-lg mb-8">
                      {userProfile.role === 'admin' 
                        ? "Siap untuk membantu meningkatkan kualitas fasilitas sekolah hari ini?" 
                        : "Laporkan kerusakan atau berikan saran untuk fasilitas sekolah yang lebih baik."}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      {userProfile.role === 'siswa' ? (
                        <Button 
                          onClick={() => navigate("form")}
                          className="bg-white text-primary hover:bg-gray-100 font-bold px-8 h-12 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                          Lapor Sekarang
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => navigate("history")}
                          className="bg-white text-primary hover:bg-gray-100 font-bold px-8 h-12 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                          Kelola Laporan
                        </Button>
                      )}
                      <Button 
                        variant="link" 
                        className="text-white hover:text-white/100 font-bold decoration-2 underline-offset-4"
                        onClick={() => navigate("history")}
                      >
                        Bantuan & Info
                      </Button>
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
                  className="hidden lg:flex w-64 h-64 items-center justify-center relative"
                >
                  <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
                  <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-inner">
                    <img src="/logo.png" alt="Hero Logo" className="w-32 h-32 object-contain animate-float" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard 
                index={0}
                title="Total Aspirasi" 
                value={stats.total} 
                icon={FileText} 
                color="text-primary" 
                bgIconColor="bg-primary/5"
              />
              <StatsCard 
                index={1}
                title="Menunggu" 
                value={stats.pending} 
                icon={Clock} 
                color="text-status-warning" 
                bgIconColor="bg-status-warning/10"
              />
              <StatsCard 
                index={2}
                title="Proses" 
                value={stats.process} 
                icon={Activity} 
                color="text-primary" 
                bgIconColor="bg-primary/10"
              />
              <StatsCard 
                index={3}
                title="Selesai" 
                value={stats.done} 
                icon={CheckCircle2} 
                color="text-status-success" 
                bgIconColor="bg-status-success/10"
              />
            </div>

            {/* In Progress Section */}
            {complaints.filter(c => c.current_status === 'proses').length > 0 && (
              <div className="pt-6">
                <div className="flex items-center justify-between mb-6 px-1">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-primary rounded-full block" />
                      SEDANG DIPROSES
                    </h2>
                    <p className="text-xs font-medium text-muted-foreground mt-1 ml-4 italic">
                      3 fasilitas yang sedang dalam tahap perbaikan.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {complaints
                    .filter(c => c.current_status === 'proses')
                    .slice(0, 3)
                    .map((item, idx) => (
                      <ComplaintCard 
                        key={`process-${item.id}`} 
                        id={item.id}
                        title={item.title}
                        location={item.location}
                        status={item.current_status}
                        description={item.description}
                        imageUrl={item.image_url}
                        date={new Date(item.created_at).toLocaleDateString('id-ID')}
                        categoryName={item.categories?.name}
                        index={idx}
                        isAdmin={userProfile.role === 'admin'}
                        onStatusChange={refreshData}
                        uploaderName={(item.users as any)?.name}
                        progress={item.complaint_progress}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Recent Complaints Section */}
            <div className="pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2 px-1">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full block" />
                    LAPORAN TERKINI
                  </h2>
                  <p className="text-sm font-medium text-muted-foreground mt-1 ml-4 italic">
                    Tinjau 6 laporan terbaru yang masuk ke sistem.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-primary font-bold hover:bg-primary/5 rounded-xl px-4 flex items-center gap-2 group transition-all" 
                  onClick={() => navigate("history")}
                >
                  Indeks Laporan <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {complaints.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-20 glass rounded-[2rem] shadow-sm border border-dashed border-gray-300"
                  >
                    <div className="flex flex-col items-center gap-4">
                       <FileText className="w-12 h-12 text-gray-200" />
                       <p className="text-gray-400 font-medium italic">Belum ada data pengaduan untuk ditampilkan.</p>
                       <Button variant="outline" size="sm" onClick={() => navigate("form")} className="rounded-xl border-gray-200 text-xs font-bold">MULAI LAPOR</Button>
                    </div>
                  </motion.div>
                ) : (
                  complaints.slice(0, 6).map((item, idx) => (
                    <ComplaintCard 
                      key={item.id} 
                      id={item.id}
                      title={item.title}
                      location={item.location}
                      status={item.current_status}
                      description={item.description}
                      imageUrl={item.image_url}
                      date={new Date(item.created_at).toLocaleDateString('id-ID')}
                      categoryName={item.categories?.name}
                      index={idx}
                      isAdmin={userProfile.role === 'admin'}
                      onStatusChange={refreshData}
                      uploaderName={(item.users as any)?.name}
                      progress={item.complaint_progress}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMPLAINT FORM VIEW (Student Only) */}
        {currentPage === "form" && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
             <div className="mb-6">
                <Button variant="ghost" className="text-muted-foreground hover:text-gray-900 pl-0" onClick={() => navigate("dashboard")}>
                  ← Kembali ke Dashboard
                </Button>
             </div>
             <ComplaintForm 
               userId={userProfile.id} 
               onSuccess={() => {
                 refreshData();
                 navigate("history");
               }} 
             />
          </div>
        )}

        {/* HISTORY VIEW */}
        {(currentPage === "history" || currentPage === "tracking") && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <span className={`w-1.5 h-8 ${currentPage === "tracking" ? "bg-status-warning" : "bg-primary"} rounded-full block`} />
                  {currentPage === "tracking" ? "MONITORING STATUS" : "HISTORI ASPIRASI"}
                </h1>
                <p className="text-xs font-medium text-muted-foreground mt-1 ml-4 italic">
                  {currentPage === "tracking" 
                    ? "Pantau progres laporan aktif yang sedang ditangani petugas secara real-time." 
                    : "Arsip lengkap seluruh aspirasi dan laporan fasilitas Anda."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative group w-full md:w-64">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                   <Input 
                      placeholder="Cari judul atau lokasi..." 
                      className="pl-9 pr-9 h-10 rounded-xl bg-white border-gray-200 focus:ring-primary/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
                   {searchQuery && (
                     <button 
                       onClick={() => setSearchQuery("")}
                       className="absolute right-3 top-2.5 text-muted-foreground hover:text-red-500 transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   )}
                </div>
                <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-xl">
                      <Filter className="w-4 h-4" /> 
                      {statusFilter === "all" ? "Filter" : statusFilter.toUpperCase()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 glass rounded-2xl border-white/20">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest opacity-50">Filter Status</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem 
                      className="rounded-xl font-medium text-sm cursor-pointer"
                      onClick={() => setStatusFilter("all")}
                    >
                      Semua Laporan
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-xl font-medium text-sm cursor-pointer text-status-warning"
                      onClick={() => setStatusFilter("pending")}
                    >
                      Menunggu (Pending)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-xl font-medium text-sm cursor-pointer text-primary"
                      onClick={() => setStatusFilter("proses")}
                    >
                      Sedang Proses
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-xl font-medium text-sm cursor-pointer text-status-success"
                      onClick={() => setStatusFilter("selesai")}
                    >
                      Selesai
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {userProfile.role === 'siswa' && (
                  <Button variant="cta" onClick={() => navigate("form")}>
                    + Baru
                  </Button>
                )}
              </div>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleComplaints.length === 0 ? (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  Belum ada pengaduan yang ditemukan.
                </div>
              ) : (
                visibleComplaints.map((item) => (
                  <ComplaintCard 
                    key={item.id} 
                    id={item.id}
                    title={item.title}
                    location={item.location}
                    status={item.current_status}
                    description={item.description}
                    imageUrl={item.image_url}
                    date={new Date(item.created_at).toLocaleDateString('id-ID')}
                    categoryName={item.categories?.name}
                    isAdmin={userProfile.role === 'admin'}
                    onStatusChange={refreshData}
                    uploaderName={(item.users as any)?.name}
                    progress={item.complaint_progress}
                  />
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
