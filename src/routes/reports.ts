import express from 'express';
import { getSessionReports } from '../controllers/reportController';

const router = express.Router();

router.get('/api/v1/reports/sessions', getSessionReports);

export default router;
