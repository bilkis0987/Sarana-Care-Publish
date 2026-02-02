import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { UploadCloud, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Category {
  id: string;
  name: string;
}

interface ComplaintFormProps {
  userId?: string; // The public.users.id
  onSuccess?: () => void;
}

export function ComplaintForm({ userId, onSuccess }: ComplaintFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const SERVER_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/server`;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/categories`, {
          headers: { 
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
          }
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories", error);
        toast.error("Gagal memuat kategori fasilitas");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [SERVER_URL]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFiles([selectedFile]);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      toast.success("File siap diupload!");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFiles([selectedFile]);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      toast.success("File siap diupload!");
    }
  };

  const removeFile = () => {
    setFiles([]);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!title || !location || !description || !categoryId) {
      toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    if (!userId) {
      toast.error("Sesi tidak valid. Silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Sedang memproses laporan...");

    try {
      let imageUrl = undefined;
      
      if (files.length > 0) {
        let file = files[0];
        
        // --- AUTO-RESIZE / COMPRESSION LOGIC ---
        try {
          // Create a canvas to resize the image
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = bitmap.width;
          let height = bitmap.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(bitmap, 0, 0, width, height);

          // Convert back to blob (compressed)
          const compressedBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.7); // 70% quality, JPG format for best compression
          });

          // Create new file from compressed blob
          file = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
          });
          
          console.log(`Compressed: ${(file.size / 1024).toFixed(2)} KB`);
        } catch (compressError) {
          console.warn("Compression failed, using original file", compressError);
          // Fallback to original file if compression fails
        }
        // ----------------------------------------

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Ensure session is fresh before upload to avoid "exp" claim errors
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error("Sesi Anda telah berakhir. Silakan log out dan login kembali.");
        }

        const { error: uploadError } = await supabase.storage
          .from('pengaduan')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pengaduan')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      const payload = {
        title,
        category_id: categoryId,
        location,
        description,
        user_id: userId,
        image_url: imageUrl,
      };

      const res = await fetch(`${SERVER_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Gagal mengirim laporan");

      toast.success("Laporan berhasil dikirim!", {
        description: "Status: PENDING. Kami akan segera memproses laporan Anda.",
      });
      toast.dismiss(loadingToast);

      setTitle("");
      setCategoryId("");
      setLocation("");
      setDescription("");
      setFiles([]);
      setPreviewUrl(null);
      
      if (onSuccess) onSuccess();

    } catch (error) {
      toast.error("Terjadi kesalahan saat mengirim laporan");
      toast.dismiss(loadingToast);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-none animate-in fade-in duration-500">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-6">
        <CardTitle className="text-primary text-xl font-bold">Form Aspirasi Siswa</CardTitle>
        <CardDescription>
          Standar UKK 2025/2026: Sampaikan keluhan mengenai sarana sekolah secara resmi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">Judul Laporan *</label>
            <Input 
              id="title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Lampu Kelas Mati" 
              className="focus-visible:ring-primary rounded-xl" 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">Kategori *</label>
            <select 
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCategories}
              className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{loadingCategories ? "Memuat..." : "Pilih Kategori"}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium text-gray-700">Lokasi Kejadian *</label>
          <Input 
            id="location" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Contoh: Lab Komputer 1" 
            className="focus-visible:ring-primary rounded-xl" 
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi Detail *</label>
          <textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex min-h-[120px] w-full rounded-xl border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Jelaskan detail kerusakan..."
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-700">Bukti Foto (Opsional)</label>
          
          {previewUrl ? (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden group shadow-lg border-2 border-primary/20">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={removeFile}
                  className="rounded-full h-10 w-10 p-0 shadow-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer overflow-hidden relative",
                dragActive ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-gray-300 hover:border-primary/50 hover:bg-gray-50/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
               <input 
                type="file" 
                className="hidden" 
                id="file-upload" 
                onChange={handleChange}
                accept="image/*"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-3">
                <div className="p-4 bg-primary/5 text-primary rounded-2xl border border-primary/10 shadow-sm transition-transform group-hover:scale-110">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-800">
                    Klik untuk upload atau drag & drop
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    PNG, JPG, ATAU WEBP (MAX. 5MB)
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3 bg-gray-50/50 p-6 rounded-b-[2rem]">
        <Button variant="outline" className="border-gray-300 rounded-xl" onClick={() => onSuccess && onSuccess()}>Batal</Button>
        <Button 
          variant="cta" 
          className="px-8 shadow-md hover:shadow-lg transition-all rounded-xl font-bold" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Kirim Pengaduan
        </Button>
      </CardFooter>
    </Card>
  )
}
