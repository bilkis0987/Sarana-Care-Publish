import { X, LayoutDashboard, History, PlusCircle, Activity, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: string) => void
  userRole?: "admin" | "siswa"
  onLogout?: () => void
}

export function Sidebar({ isOpen, onClose, onNavigate, userRole, onLogout }: SidebarProps) {
  const handleNav = (page: string) => {
    onNavigate(page);
    onClose();
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-primary" },
    { id: "history", label: "Aspirasi Saya", icon: History, color: "text-primary" },
    { id: "tracking", label: "Lacak Status", icon: Activity, color: "text-status-warning" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-300 md:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar Panel */}
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[280px] glass z-50 shadow-2xl md:hidden border-r border-white/20"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 15 }}
                  className="w-10 h-10 p-1.5 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center overflow-hidden"
                >
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=SC&background=0B5ED7&color=fff';
                    }}
                  />
                </motion.div>
                <span className="text-xl font-black text-primary tracking-tighter">NAVIGASI</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:bg-primary/5 rounded-xl">
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex flex-col p-4 pt-6 gap-3">
              {menuItems.map((item) => (
                <Button 
                  key={item.id}
                  variant="ghost" 
                  className="justify-start gap-4 h-14 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-primary/5 hover:text-primary rounded-2xl group transition-all" 
                  onClick={() => handleNav(item.id)}
                >
                  <div className={`p-2.5 rounded-xl bg-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  {item.label}
                </Button>
              ))}
              
              {userRole === 'siswa' && (
                <Button 
                  variant="cta" 
                  className="justify-start gap-4 h-14 mt-4 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20" 
                  onClick={() => handleNav("form")}
                >
                  <div className="p-2.5 rounded-xl bg-white/20 text-white">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  Lapor Fasilitas
                </Button>
              )}
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 border-t border-white/10 bg-black/5">
               <Button 
                 variant="ghost" 
                 className="w-full justify-start gap-4 h-14 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all"
                 onClick={onLogout}
               >
                 <div className="p-2.5 rounded-xl bg-red-500/10">
                   <LogOut className="w-5 h-5" />
                 </div>
                 Keluar Sesi
               </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
