import express from "express";
import { Request, Response } from "express";
import { getAllTasks, createTask} from "../controllers/tasksController";
import { validateData } from "../middleware/validateData";
import { CreateTaskSchema } from "../schema/tasksSchema";


const router = express.Router();

router.post('/api/v1/task', validateData(CreateTaskSchema), createTask);

router.get('/api/v1/tasks', getAllTasks);

export default router;