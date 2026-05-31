import { Request, Response, Router } from 'express';
import express from 'express';
import { getCurrent, getSessions, pauseSession, resumeSession, startSession } from '../controllers/sessionsController';

const router = express.Router();

router.get('/api/v1/sessions', getSessions)

router.post('/api/v1/session/start', startSession);

router.post('/api/v1/session/pause', pauseSession);

router.post('/api/v1/session/resume', resumeSession);

router.post('/api/v1/session/current', getCurrent);

export default router;