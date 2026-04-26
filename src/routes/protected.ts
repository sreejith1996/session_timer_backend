import express from "express";
import { Request, Response } from "express";

const router = express.Router();


router.get('/api/protected', async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.token) {
        console.log(req.user, req.token);
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const userId = req.user.id;
      const email = req.user.email;
  
      const supabase = req.supabase!;
  
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
  
      if (error) {
        console.log(error);
        throw error;
      }
  
      res.json({
        message: `Hello ${email}`,
        userId,
        info: data
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error)
      res.status(500).json({ error: message })
    }
  });

export default router;