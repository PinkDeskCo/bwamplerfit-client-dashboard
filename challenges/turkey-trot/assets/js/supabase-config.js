"use strict";

const SUPABASE_URL =
    "https://goawuuhfetalynfpebfm.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_KiqQgQCSTcnEmiI9BJsS7Q_xQlpGtca";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
          {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );