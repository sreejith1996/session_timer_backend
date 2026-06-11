import { Request, Response } from "express";
import { sendControllerError } from "../utils/controllerError";
import { SESSION_STATUS } from "../utils/constants";

const getSessions = async (req: Request, res: Response) => {
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
        sendControllerError(res, error);
    }

}

const startSession = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const supabase = req.supabase;

    try {
        const { data, error } = await supabase!
            .from('sessions')
            .insert({
                user_id: userId,
                task_id: req.body.taskId,
                status: SESSION_STATUS.ACTIVE,
                planned_duration_in_seconds: req.body.plannedDurationInSec
            }).select().single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Session started!',
            userId,
            info: data
        })
    } catch (error) {
        sendControllerError(res, error);
    }
}

const pauseSession = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const supabase = req.supabase;

    try {
        
        const { data, error } =  await supabase!.rpc('handle_pause_session', {
            p_user_id: userId,
            p_session_id: req.body.sessionId,
            p_status: SESSION_STATUS.PAUSED,
            p_paused_at: new Date().toISOString()
        });

        if(error) throw error;


        res.status(201).json({
            message: 'Paused session successfully',
            userId,
            info: data
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

const resumeSession = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const supabase = req.supabase;

    try {
        const { data, error } = await supabase!
            .rpc('handle_resume_session', {
                p_user_id: userId,
                p_session_id: req.body.sessionId,
                p_status: SESSION_STATUS.ACTIVE,
                p_resumed_at: new Date().toISOString()
            })

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Resumed session successfully',
            userId,
            info: data
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

const getCurrent = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const supabase = req.supabase;

    try {
        const { data, error } =  await supabase!.rpc('get_session_elapsed_time', {
            p_session_id: req.body.sessionId
        });
        if (error) throw error;
        if (data[0]?.active_elapsed_seconds >= data[0]?.planned_duration_in_seconds) {
            const { data: newData, error: newError } = await supabase!
                .from('sessions')
                .update({
                    user_id: userId,
                    task_id: req.body.taskId,
                    status: SESSION_STATUS.COMPLETED,
                }).eq('id', req.body.sessionId).select().single();
            
            if(newError){
                throw newError;
            }

            res.status(200).json({
                message: 'Current status received successfully!',
                userId,
                info: newData
            });
            return;
        }
        res.status(200).json({
            message: 'Current status received successfully!',
            userId,
            info: data
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

const getOngoingSession = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    try {
        const { data, error } = await supabase
            .from('session_pauses')
            .select(`
                id,
                session_id,
                paused_at,
                resumed_at,
                sessions!inner (
                    id,
                    user_id,
                    task_id,
                    status,
                    planned_duration_in_seconds
                )
            `)
            .is('resumed_at', null)
            .eq('sessions.user_id', userId)
            .order('paused_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        res.status(200).json({
            message: data ? 'Ongoing session found' : 'No ongoing session found',
            userId,
            info: data
                ? {
                    pause: {
                        id: data.id,
                        sessionId: data.session_id,
                        pausedAt: data.paused_at,
                        resumedAt: data.resumed_at
                    },
                    session: data.sessions
                }
                : null
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

const deleteSession = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const { sessionId } = req.params;

    try {
        const { data, error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', userId)
            .select()
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            res.status(404).json({
                error: 'Session not found'
            });
            return;
        }

        res.status(200).json({
            message: 'Deleted session successfully',
            userId,
            info: data
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

export { getSessions, startSession, pauseSession, resumeSession, getCurrent, getOngoingSession, deleteSession }
