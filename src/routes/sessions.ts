import { Request, Response, Router } from 'express';
import express from 'express';

const router = express.Router();

router.get('/api/v1/sessions', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const supabase = req.supabase!;

        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        res.status(200).json({
            message: 'Retrieved sessions successfully',
            userId,
            info: data
        }); 
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            error: message
        });
    }
    
})

router.post('api/v1/session/start', async () => {
    
});

router.post('api/v1/session/pause', async () => {

});

router.post('api/v1/session/resume', async () => {

})

export default router;