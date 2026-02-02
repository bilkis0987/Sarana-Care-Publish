import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("siswa"); // 'siswa' | 'admin'

  // State for password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [adminSecretCode, setAdminSecretCode] = useState("");
  const [isConfirmingAdmin, setIsConfirmingAdmin] = useState(false);
  const ADMIN_SECRET = "bilkisganteng";

  const SERVER_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/server`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;
      toast.success("Selamat datang kembali!");
      onAuthSuccess();
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Admin Validation Sequence
    if (regRole === "admin") {
      const normalizedInput = adminSecretCode.trim().toLowerCase();
      const normalizedSecret = ADMIN_SECRET.toLowerCase();
      
      if (normalizedInput !== normalizedSecret) {
        toast.error("KODE RAHASIA SALAH! Akses Admin ditolak.");
        return;
      }

      // Show confirmation if not verified yet
      if (!isConfirmingAdmin) {
        setIsConfirmingAdmin(true);
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regName,
            role: regRole,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      toast.success("Akun berhasil dibuat! Silakan masuk.");
      setActiveTab("login");
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("User already registered")) {
        toast.error("Email ini sudah terdaftar. Silakan masuk ke akun Anda.");
        setActiveTab("login");
      } else {
        toast.error(error.message || "Gagal mendaftar");
      }
      setIsConfirmingAdmin(false); // Reset confirmation on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden font-sans">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 px-4"
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 p-2.5 border border-gray-100"
          >
            <img src="/logo.png" alt="Sarana Care Logo" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className={`text-3xl font-black tracking-tight transition-colors duration-500 ${activeTab === "register" ? "text-status-success" : "text-primary"}`}>
            SARANA CARE
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm uppercase tracking-widest">
            {activeTab === "login" ? "Kredensial Sesi" : "Daftar Akun Baru"}
          </p>
        </div>

        <Card className="glass border-white/20 shadow-2xl rounded-3xl overflow-hidden shadow-primary/5">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100/50 rounded-2xl h-12">
                <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
                  Masuk
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-status-success data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
                  Daftar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleLogin} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Alamat Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        className="pl-11 h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="nama@sekolah.sch.id" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" title="Kata Sandi" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Kata Sandi</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="password" 
                        type={showLoginPassword ? "text" : "password"} 
                        className="pl-11 pr-11 h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-xs transition-all active:scale-95" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Akses Dashboard"}
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleRegister} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nama Lengkap</Label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-status-success transition-colors" />
                      <Input 
                        id="reg-name" 
                        className="pl-11 h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-status-success/20 transition-all font-medium"
                        placeholder="Nama Lengkap Anda" 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Sekolah</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-status-success transition-colors" />
                      <Input 
                        id="reg-email" 
                        type="email" 
                        className="pl-11 h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-status-success/20 transition-all font-medium"
                        placeholder="nama@sekolah.sch.id" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" title="Kata Sandi" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password Baru</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-status-success transition-colors" />
                      <Input 
                        id="reg-password" 
                        type={showRegPassword ? "text" : "password"} 
                        className="pl-11 pr-11 h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-status-success/20 transition-all font-medium"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 rounded-lg text-gray-400 hover:text-status-success hover:bg-status-success/5 transition-all"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Pilih Peran</Label>
                    <RadioGroup 
                      defaultValue="siswa" 
                      value={regRole} 
                      onValueChange={(val) => {
                        setRegRole(val);
                        setAdminSecretCode(""); 
                        setIsConfirmingAdmin(false); // Reset confirmation on role change
                      }} 
                      className="flex gap-4 p-2 bg-gray-50/50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center space-x-2 flex-1 justify-center py-1">
                        <RadioGroupItem value="siswa" id="r-siswa" className="text-status-success focus:ring-status-success" />
                        <Label htmlFor="r-siswa" className="text-xs font-bold cursor-pointer">Siswa</Label>
                      </div>
                      <div className="flex items-center space-x-2 flex-1 justify-center py-1">
                        <RadioGroupItem value="admin" id="r-admin" className="text-status-success focus:ring-status-success" />
                        <Label htmlFor="r-admin" className="text-xs font-bold cursor-pointer">Admin</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <AnimatePresence>
                    {regRole === "admin" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden pl-[4px]"
                      >
                        <Label htmlFor="admin-code" className="text-[10px] font-black uppercase tracking-wider text-status-success ml-1">Kode Otoritas Admin</Label>
                        <div className="relative group pb-[5px]">
                          <ShieldCheck className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-status-success/70 transition-colors" />
                          <Input 
                            id="admin-code" 
                            type="password"
                            className="w-[calc(100%-5px)] pl-10 h-10 rounded-xl bg-status-success/5 border border-status-success/20 focus:bg-white focus:ring-2 focus:ring-status-success/20 transition-all font-bold text-sm placeholder:text-status-success/20"
                            placeholder="KODE RAHASIA" 
                            value={adminSecretCode}
                            onChange={(e) => setAdminSecretCode(e.target.value)}
                            required 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {isConfirmingAdmin && regRole === "admin" && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-2xl space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[13px] font-black text-gray-900 uppercase">Konfirmasi Akses Admin</p>
                            <p className="text-[11px] text-muted-foreground leading-tight mt-1">
                              Anda sedang mendaftar sebagai Administrator. Akun ini memiliki wewenang penuh untuk mengubah status laporan. Lanjutkan?
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1 h-9 rounded-xl text-xs font-bold"
                            onClick={() => setIsConfirmingAdmin(false)}
                          >
                            Batal
                          </Button>
                          <Button 
                            type="button" 
                            className="flex-1 h-9 rounded-xl bg-status-warning hover:bg-orange-600 text-white text-xs font-bold border-none"
                            onClick={() => handleRegister()}
                          >
                            Ya, Konfirmasi
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isConfirmingAdmin && (
                    <Button type="submit" className="w-full h-12 rounded-2xl bg-status-success hover:bg-green-600 shadow-lg shadow-green-200 font-bold uppercase tracking-widest text-xs transition-all active:scale-95 border-none" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Buat Akun Saya"}
                    </Button>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="pb-6 pt-2 justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
              © {new Date().getFullYear()} Sarana Care
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
