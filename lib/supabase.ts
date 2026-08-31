import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysxmucurscmlrgdkeqyv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzeG11Y3Vyc2NtbHJnZGtlcXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzQ5NDksImV4cCI6MjA5MDExMDk0OX0.fPCDCYccQkDtr-B2sFm3ZxYPXM5t0OLM2PpiGBAvfe4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)