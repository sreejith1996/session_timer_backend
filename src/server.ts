import express from 'express';
import type { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from './middleware/auth';

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(authenticate);

function createUserClient(accessToken : string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(supabaseUrl && supabaseRoleKey){
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

app.get('/api/protected', async (req, res) => {
  try {
    if (!req.user || !req.token) {
      console.log(req.user, req.token);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const email = req.user.email;

    const supabase = createUserClient(req.token)

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)

    if(error){
      console.log(error);
      throw error;
    }

    res.json({
      message: `Hello ${email}`,
      userId,
      info:data
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error)
    res.status(500).json({ error: message})
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

