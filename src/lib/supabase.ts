import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dummy.supabase.co";
const supabaseKey = "sb_publishable_dummy";

export const supabase = createClient(supabaseUrl, supabaseKey);
