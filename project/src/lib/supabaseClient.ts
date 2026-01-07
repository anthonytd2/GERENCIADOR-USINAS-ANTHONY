import { createClient } from '@supabase/supabase-js';

// SUBSTITUA COM SUAS CHAVES DO SUPABASE (Pegue no painel do Supabase -> Settings -> API)
const SUPABASE_URL = 'https://cmtssvyztjncmcwqjnwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtdHNzdnl6dGpuY21jd3FqbndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTc1ODMsImV4cCI6MjA4MzI3MzU4M30.rMoAgILaPWeV7_T2eYXbD0S6l-iHpTNiuSlIdqKUsho';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);