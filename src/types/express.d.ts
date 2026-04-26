import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

declare global{
    namespace Express {
        interface Request {
            user?: User
            token?: string | undefined
            supabase?: SupabaseClient<any, "public", "public", any, any>
        }
    }
    interface Error {
        status?: number
    }
}