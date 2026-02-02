import { MapPin, Calendar, Clock, ArrowRight, CheckCircle, XCircle, Loader2, User, Activity } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ComplaintCardProps {
  id: string
  title: string
  location: string
  date: string
  status: string
  description: string
  imageUrl?: string
  categoryName?: string
  isAdmin?: boolean
  onStatusChange?: () => void
  index?: number
  uploaderName?: string
  progress?: any[]
}

export function ComplaintCard({ 
  id, title, location, date, status, description, imageUrl, categoryName, isAdmin, onStatusChange, index = 0, uploaderName, progress = [] 
}: ComplaintCardProps) {
  const [updating, setUpdating] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "selesai": return "success"
      case "proses": return "warning"
      case "pending": return "default"
      default: return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "selesai": return "bg-status-success"
      case "proses": return "bg-primary"
      case "pending": return "bg-status-warning"
      default: return "bg-gray-400"
    }
  }

  const getModalBgColor = (status: string) => {
    switch (status) {
      case "selesai": return "bg-[#f2fdf5]" // Soft Success Green
      case "proses": return "bg-[#f0f7ff]"  // Soft Process Blue
      case "pending": return "bg-[#fff9f2]"  // Soft Pending Orange
      default: return "bg-white"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "selesai": return "Selesai"
      case "proses": return "Proses"
      case "pending": return "Menunggu"
      default: return status
    }
  }

  const handleUpdateStatus = async (newStatus: string, actionDescription?: string) => {
    setUpdating(true);
    const SERVER_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/server`;
    
    try {
      const res = await fetch(`${SERVER_URL}/complaints/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        },
        body: JSON.stringify({ 
          status: newStatus,
          description: actionDescription
        })
      });

      if (!res.ok) throw new Error("Gagal update status");
      
      toast.success(`Laporan telah di-update ke status: ${newStatus.toUpperCase()}`);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      toast.error("Terjadi kesalahan saat update status");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
    >
      <Card className="glass shadow-glass border-none overflow-hidden hover:shadow-2xl transition-all duration-500 group relative flex flex-col h-full rounded-2xl">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${getStatusColor(status)} opacity-80 z-10`} />
        
        <CardHeader className="p-5 pb-2">
          <div className="flex justify-between items-start mb-3">
            <Badge variant={getStatusVariant(status)} className="px-3 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-sm transition-transform group-hover:scale-105">
              {getStatusLabel(status)}
            </Badge>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center bg-gray-100/50 px-2 py-1 rounded-md">
              <Calendar className="w-3 h-3 mr-1.5 text-primary/70" /> {date}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors duration-300 tracking-tight">{title}</h3>
          <div className="flex items-center text-xs font-medium text-muted-foreground mt-2">
            <div className="p-1 rounded-md bg-primary/5 mr-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            {location}
          </div>
          {categoryName && (
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100/80 text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200/50">
              Kategori: {categoryName}
            </div>
          )}
          
          {uploaderName && (
            <div className="flex items-center mt-3 pt-3 border-t border-gray-100/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                <User className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                 Oleh: <span className="text-primary">{uploaderName}</span>
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-5 pt-2 flex-grow">
          {imageUrl && (
            <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden mt-2 relative group-hover:shadow-md transition-shadow duration-500">
               <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
               <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-5 pt-0 flex flex-col gap-3 mt-auto">
          <div className="h-px w-full bg-gray-100/50" />
          <div className="w-full flex justify-between items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="font-semibold text-primary hover:text-primary hover:bg-primary/5 rounded-lg px-3 -ml-2 text-xs transition-all flex items-center gap-1.5">
                    Lihat Detail
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className={`w-[95vw] sm:max-w-2xl max-h-[90vh] border-white/20 shadow-2xl overflow-y-auto p-0 gap-0 rounded-[2rem] ${getModalBgColor(status)} transition-colors duration-500 custom-scrollbar`}>
                  <div className={`h-2 w-full ${getStatusColor(status)}`} />
                  <div className="p-8 relative">
                    <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-white/40 to-transparent pointer-events-none" />
                    <DialogHeader className="mb-6 relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant={getStatusVariant(status)} className="px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
                          {getStatusLabel(status)}
                        </Badge>
                        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-xl">
                          <Calendar className="w-3.5 h-3.5 mr-2 text-primary" /> {date}
                        </div>
                      </div>
                      <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">
                        {title}
                      </DialogTitle>
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-xl">
                          <MapPin className="w-4 h-4 mr-2" /> {location}
                        </div>
                        {categoryName && (
                          <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                            {categoryName}
                          </div>
                        )}
                      </div>
                    </DialogHeader>

                    <div className="space-y-6">
                      {imageUrl && (
                        <div className="w-full h-64 rounded-2xl overflow-hidden shadow-lg border-4 border-white/50">
                          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Deskripsi Laporan</h4>
                        <p className="text-gray-700 leading-relaxed font-medium">
                          {description}
                        </p>
                      </div>

                      {/* Timeline / Progress Section */}
                      <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5" /> JALUR PROGRES
                        </h4>
                        <div className="space-y-4">
                          {/* Default "Laporan Terkirim" state */}
                          <div className="flex gap-3 relative">
                            <div className="w-px h-full bg-gray-200 absolute left-2.5 top-6 z-0" />
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 z-10">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-none">Laporan Berhasil Terkirim</p>
                              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tight font-medium">{date}</p>
                            </div>
                          </div>

                          {/* Dynamic Progress From Database */}
                          {progress && [...progress].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((step, sIdx) => (
                            <div key={sIdx} className="flex gap-3 relative">
                              {sIdx < progress.length - 1 && <div className="w-px h-full bg-gray-200 absolute left-2.5 top-6 z-0" />}
                              <div className={`w-5 h-5 rounded-full ${sIdx === progress.length - 1 ? 'bg-status-success/20 animate-pulse' : 'bg-gray-200'} flex items-center justify-center shrink-0 z-10`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${sIdx === progress.length - 1 ? 'bg-status-success' : 'bg-gray-400'}`} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900 leading-none capitalize">Status: {step.status}</p>
                                <p className="text-[10px] text-gray-600 mt-1 font-medium">{step.description}</p>
                                <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">{new Date(step.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit'})}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-[#4FC3F7] p-[1.5px] mr-3">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary">
                              <User className="w-5 h-5" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelapor</p>
                            <p className="text-sm font-bold text-gray-900">{uploaderName || 'Anonim'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Laporan</p>
                          <p className="text-xs font-mono font-bold text-primary">#{id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {!isAdmin && (
                 <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                   #{id.slice(0, 8)}
                 </div>
              )}
          </div>

          <AnimatePresence>
            {isAdmin && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full overflow-hidden"
              >
                <div className="flex gap-2.5 w-full pt-1">
                  {status === "pending" && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-primary hover:bg-primary/90 h-9 rounded-xl text-xs font-bold shadow-sm"
                      onClick={() => handleUpdateStatus("proses", "Laporan sedang diproses oleh petugas.")}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                      PROSES
                    </Button>
                  )}
                  {status === "proses" && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700 h-9 rounded-xl text-xs font-bold shadow-sm"
                      onClick={() => handleUpdateStatus("selesai", "Fasilitas telah selesai diperbaiki.")}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                      SELESAI
                    </Button>
                  )}
                  {status === "selesai" && (
                    <div className="w-full text-center py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-green-100">
                      LAPORAN TUNTAS
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
