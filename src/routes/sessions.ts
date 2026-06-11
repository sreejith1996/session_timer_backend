import { Request, Response, Router } from 'express';
import express from 'express';
import { deleteSession, getCurrent, getSessions, pauseSession, resumeSession, startSession } from '../controllers/sessionsController';

const router = express.Router();

router.get('/api/v1/sessions', getSessions)

router.post('/api/v1/session/start', startSession);

router.post('/api/v1/session/pause', pauseSession);

router.post('/api/v1/session/resume', resumeSession);

router.post('/api/v1/session/current', getCurrent);

router.delete('/api/v1/session/:sessionId', deleteSession);

export default router;
