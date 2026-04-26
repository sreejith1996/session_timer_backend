import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user;
    req.token = token
    next()

}


function _createUserClient(accessToken: string) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseRoleKey) {
        return createClient(
            supabaseUrl,
            supabaseRoleKey,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    }
                }
            }
        )
    } else {
        throw Error('Could not find supabase url or key');
    }
}

function attachSupabaseClient(req: Request, res: Response, next: NextFunction) {
    req.supabase = _createUserClient(req.token!);
    next();
}

export { authenticate, attachSupabaseClient };