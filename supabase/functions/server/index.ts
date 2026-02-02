import { Hono, type Context } from "https://esm.sh/hono@4.3.11";
import { cors } from "https://esm.sh/hono@4.3.11/cors";
import { logger } from "https://esm.sh/hono@4.3.11/logger";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Initialize Hono withBasePath to match Supabase Function gateway (/functions/v1/server)
const app = new Hono().basePath("/server");

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// Helper for error responses
const errorResponse = (c: Context, message: string, status: number = 500) => {
  return c.json({ error: message, success: false }, status);
};

// --- ROUTES ---

// Health Check (Matches /functions/v1/server/)
app.get("/", (c: Context) => c.json({ status: "ok", message: "Sarana Care Server is running", service: "edge-function" }));

// 1. Get All Complaints (Matches /functions/v1/server/complaints)
app.get("/complaints", async (c: Context) => {
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        categories(id, name),
        users(id, name, email, role:roles(name)),
        complaint_progress(*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return c.json(data);
  } catch (err: any) {
    return errorResponse(c, err.message);
  }
});

// 2. Create Complaint
app.post("/complaints", async (c: Context) => {
  try {
    const body = await c.req.json();
    const { data, error } = await supabase
      .from("complaints")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return c.json({ ...data, success: true });
  } catch (err: any) {
    return errorResponse(c, err.message);
  }
});

// 3. Update Complaint Status & Add Progress Log
app.put("/complaints/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { status, description } = await c.req.json();

    // Add progress entry
    const { error: progressError } = await supabase
      .from("complaint_progress")
      .insert([{
        complaint_id: id,
        status,
        description: description || `Status diubah menjadi ${status}`
      }]);

    if (progressError) throw progressError;

    // Update the complaint record
    const { data, error } = await supabase
      .from("complaints")
      .update({ current_status: status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return c.json({ ...data, success: true });
  } catch (err: any) {
    return errorResponse(c, err.message);
  }
});

// 4. Get User Profile (Join with roles)
app.get("/profile/:authUserId", async (c: Context) => {
  try {
    const authUserId = c.req.param("authUserId");
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        role:roles(name)
      `)
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return errorResponse(c, "Profile not found", 404);

    return c.json({
      id: data.id,
      userId: data.auth_user_id,
      name: data.name,
      email: data.email,
      role: data.role?.name || "siswa",
      success: true
    });
  } catch (err: any) {
    return errorResponse(c, err.message);
  }
});

// 5. Get Categories
app.get("/categories", async (c: Context) => {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) throw error;
    return c.json(data);
  } catch (err: any) {
    return errorResponse(c, err.message);
  }
});

Deno.serve(app.fetch);




