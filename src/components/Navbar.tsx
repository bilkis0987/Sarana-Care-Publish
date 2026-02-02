import { Menu, Bell, User, LogOut, Trash2, CheckCheck, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { motion } from "motion/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Clock, Info } from "lucide-react"

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'status_change' | 'new_report';
}

interface NavbarProps { 
  onMenuClick: () => void;
  onNavigate: (page: string) => void;
  userRole?: "admin" | "siswa";
  onLogout?: () => void;
  currentPage: string;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export function Navbar({ 
  onMenuClick, onNavigate, userRole, onLogout, currentPage, notifications, unreadCount, onMarkAllRead, onClearAll, onDeleteNotification, onMarkAsRead 
}: NavbarProps) {

  const handleNav = (tab: string) => {
    onNavigate(tab);
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/20 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden text-gray-600 hover:bg-primary/5" onClick={onMenuClick}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav('dashboard')}>
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-12 h-12 flex items-center justify-center p-1.5 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
            >
              <img 
                src="/logo.png" 
                alt="Sarana Care Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=SC&background=0B5ED7&color=fff';
                }}
              />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-primary tracking-tighter hidden min-[400px]:block leading-none">
                SARANA <span className="text-gray-900 font-light">CARE</span>
              </h1>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] hidden min-[400px]:block leading-none mt-1">
                Sistem Pengaduan
              </span>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2 px-2 py-1.5 bg-gray-100/50 rounded-2xl border border-white/50 backdrop-blur-sm">
          <Button 
            variant="ghost"
            className={`text-xs font-bold uppercase tracking-wider px-5 h-9 rounded-xl transition-all duration-300 ${currentPage === "dashboard" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary hover:bg-white/50"}`}
            onClick={() => handleNav("dashboard")}
          >
            Dashboard
          </Button>
          <Button 
            variant="ghost"
            className={`text-xs font-bold uppercase tracking-wider px-5 h-9 rounded-xl transition-all duration-300 ${currentPage === "history" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary hover:bg-white/50"}`}
            onClick={() => handleNav("history")}
          >
            Aspirasi
          </Button>
          <Button 
            variant="ghost"
            className={`text-xs font-bold uppercase tracking-wider px-5 h-9 rounded-xl transition-all duration-300 ${currentPage === "tracking" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary hover:bg-white/50"}`}
            onClick={() => handleNav("tracking")}
          >
            Lacak
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-gray-50 text-gray-500 hover:text-primary hover:bg-white transition-all shadow-inner">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/20"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 glass rounded-2xl border-white/20 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
                  <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Notifikasi</h3>
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">{unreadCount} Baru</Badge>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-xs text-muted-foreground font-medium italic">Belum ada notifikasi baru.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 border-b border-gray-50 hover:bg-white/80 transition-colors cursor-pointer group relative ${!notif.isRead ? 'bg-primary/5' : ''}`}
                        onClick={() => !notif.isRead && onMarkAsRead(notif.id)}
                      >
                        <div className="flex gap-3 pr-8">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.type === 'status_change' ? 'bg-status-success/10 text-status-success' : 'bg-primary/10 text-primary'}`}>
                            {notif.type === 'status_change' ? <Info className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-[13px] font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">{notif.title}</h4>
                              {notif.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
                              ) : (
                                <div className="flex items-center gap-1 text-[9px] font-black text-primary animate-pulse uppercase tracking-[0.1em]">
                                  BARU <Eye className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug">{notif.message}</p>
                            <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tighter">{notif.time}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-8 -translate-y-1/2 h-8 w-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notif.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 bg-gray-50 flex gap-2 border-t border-gray-100">
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
                        onClick={onMarkAllRead}
                      >
                        Tandai Baca
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 hover:text-red-600 shadow-none border-none"
                      onClick={onClearAll}
                    >
                      Hapus Semua
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          
          {userRole === 'siswa' && (
            <Button 
              variant="cta" 
              size="sm" 
              className="hidden sm:flex h-10 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 font-bold text-xs uppercase tracking-wider"
              onClick={() => handleNav("form")}
            >
              Lapor Fasilitas
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-[#4FC3F7] p-[1.5px] cursor-pointer shadow-md"
              >
                <div className="w-full h-full rounded-[9px] bg-white flex items-center justify-center text-primary transition-colors hover:bg-gray-50">
                  <User className="w-5 h-5" />
                </div>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 glass-dark text-white border-white/10 rounded-2xl p-2">
              <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest opacity-70 px-3 py-2">
                Manajemen Akun
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={onLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl cursor-pointer p-3 focus:bg-red-500/10 focus:text-red-300">
                <LogOut className="w-4 h-4 mr-3" /> 
                <span className="font-bold text-xs uppercase tracking-wider">Keluar Sesi</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
