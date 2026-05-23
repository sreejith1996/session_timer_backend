import { Request, Response } from "express";
import { sendControllerError } from "../utils/controllerError";

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
        //TODO: validation
        const { data, error } = await supabase!
            .from('sessions')
            .insert({
                user_id: userId,
                task_id: req.body.taskId,
                status: req.body.status,
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
    //TODO: update the status in sessions table to paused, statuses = active, paused, completed, cancelled.
    const userId = req.user!.id;
    const supabase = req.supabase;

    try {
        const { data, error } = await supabase!
            .from('session_pauses')
            .insert({
                user_id: userId,
                session_id: req.body.sessionId,
                paused_at: new Date().toISOString(),
                resumed_at: null
            }).select().single();

        if (error) {
            throw error;
        }

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
            .from('session_pauses')
            .update({
                user_id: userId,
                session_id: req.body.sessionId,
                resumed_at: new Date().toISOString()
            })
            .eq('session_id', req.body.sessionId)
            .is('resumed_at', null).select();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Paused session successfully',
            userId,
            info: data
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

//TODO: Get sessions for a specific task id



//TODO: If user starts the session quickly or hits the endpoint pauses, if resume is null, give an error to the user.

//TODO: If the number of pauses > 5, then do not allow the user to pause, just cancel the session

//TODO: 

export { getSessions, startSession, pauseSession, resumeSession }