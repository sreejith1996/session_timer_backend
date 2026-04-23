import express from 'express';
import type { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(cors({ origin: 'https://laughing-spork-q76gvvj4pgp24xx4-5173.app.github.dev' }));


function createUserClient(accessToken : string) {
  console.log(accessToken);
  return createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUABASE_SERVICE_ROLE_KEY || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      }
    }
  )
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

    if(error) throw error;

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
  res.send('Hello world')
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

