// Lightweight re-export of the central supabase client.
// This file previously created a separate client which caused session/storage
// inconsistencies. We now re-export the client from the canonical
// `src/services/supabase.ts` so all imports reference the same instance.

export { supabase } from '@/services/supabase';