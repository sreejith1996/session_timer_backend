//Get tasks controller

import { Request, Response } from "express";
import { sendControllerError } from "../utils/controllerError";

const createTask = async (req: Request, res: Response) => {
    
    try {
        const userId = req.user!.id;
    
        const supabase = req.supabase!;
        
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                user_id: userId,
                task_name: req.body.taskName,
                task_description: req.body.taskDescription
            }).select().single();
        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Task created successfully!',
            userId,
            info: data
        })
    } catch (error) {
        sendControllerError(res, error);
    }
}

const getAllTasks = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
    
        const supabase = req.supabase!;
    
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
    
        if (error) {
            throw error;
        }
    
        res.status(200).json({
            message: 'Tasks received successfully',
            userId,
            info: data
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

// TODO: get all sessions for a given task.

export { getAllTasks, createTask }