import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zsivxacdmgtzaqmbrhgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzaXZ4YWNkbWd0emFxbWJyaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjQwMjMsImV4cCI6MjEwMzk0MDAyM30.yWMIa-gAg8Ywqbz3Y8P02ZjJpK9GmkLhj6uYSAcCwEA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
