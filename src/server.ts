import express from 'express';
import type { Application, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { attachSupabaseClient, authenticate } from './middleware/auth';
import protectedRouter from './routes/protected';
import tasksRouter from './routes/tasks';
import sessionRouter from './routes/sessions';
import logger from './middleware/logger';
import errorHandler from './middleware/error';
import { Request, Response } from 'express';

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200);
  return res.json({
    status: "UP"
  })
});

app.use(authenticate, attachSupabaseClient, logger);
app.use(protectedRouter);
app.use(tasksRouter);
app.use(sessionRouter);

// Consume all errors 
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error('Not Found');
  error.status = 400;
  next(error);
})

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

