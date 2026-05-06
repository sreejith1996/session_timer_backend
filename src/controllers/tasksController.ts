//Get tasks controller

import { Request, Response } from "express";

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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(error);
        res.status(500).json({error: message});
    }
    // Create my task
    // with task_name, task_description, 
    // one user can create max of 50 task,
    // gives back a success message 
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
        const message = error instanceof Error ? error.message: String(error);
        console.log(error);
        res.status(500).json({ error: message });
    }
}

export { getAllTasks, createTask }