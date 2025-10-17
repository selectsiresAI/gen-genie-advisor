import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://gzvweejdtycxzxrjplpc.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dndlZWpkdHljeHp4cmpwbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDgzMDIsImV4cCI6MjA3NDEyNDMwMn0.-1zb66szqJj5jf5rIrU8H3EzQb9p-5X91G3ZePnX9FQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
