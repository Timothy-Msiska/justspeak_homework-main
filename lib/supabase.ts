'use client';

import { createClient } from '@supabase/supabase-js';

// ✅ Load values from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Create a Supabase client for browser / client usage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);