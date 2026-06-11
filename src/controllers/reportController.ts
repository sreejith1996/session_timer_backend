import { Request, Response } from "express";
import { sendControllerError } from "../utils/controllerError";
import { SESSION_STATUS } from "../utils/constants";

type TaskRow = {
    id?: string;
    task_name?: string;
    task_description?: string | null;
}

type CompletedSessionRow = {
    id: string;
    task_id: string;
    planned_duration_in_seconds: number;
    created_at: string;
    tasks?: TaskRow | TaskRow[] | null;
}

type ReportSession = {
    id: string;
    taskId: string;
    taskName: string;
    plannedDurationInSeconds: number;
    startedAt: string;
    completedAt: string;
}

const secondsToMs = 1000;

const toQueryString = (value: unknown): string => {
    return typeof value === 'string' ? value.trim() : '';
}

const parseDateParam = (value: string, endOfDay = false): Date | null => {
    if (!value) {
        return null;
    }

    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    const date = dateOnlyPattern.test(value)
        ? new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

const getTask = (tasks: CompletedSessionRow['tasks']): TaskRow | null => {
    if (Array.isArray(tasks)) {
        return tasks[0] ?? null;
    }

    return tasks ?? null;
}

const addSecondsToIso = (isoDate: string, seconds: number): string => {
    return new Date(new Date(isoDate).getTime() + seconds * secondsToMs).toISOString();
}

const getUtcDateKey = (isoDate: string): string => {
    return isoDate.slice(0, 10);
}

const getLastSevenDaysStart = (): Date => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 6);
    date.setUTCHours(0, 0, 0, 0);

    return date;
}

const getCurrentWeekStart = (): Date => {
    const date = new Date();
    const day = date.getUTCDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    date.setUTCDate(date.getUTCDate() - daysSinceMonday);
    date.setUTCHours(0, 0, 0, 0);

    return date;
}

const summarizeSessions = (sessions: ReportSession[]) => {
    const totalCompletedSessions = sessions.length;
    const totalDurationInSeconds = sessions.reduce(
        (total, session) => total + session.plannedDurationInSeconds,
        0,
    );
    const longestSessionInSeconds = sessions.reduce(
        (longest, session) => Math.max(longest, session.plannedDurationInSeconds),
        0,
    );
    const averageSessionInSeconds = totalCompletedSessions
        ? Math.round(totalDurationInSeconds / totalCompletedSessions)
        : 0;
    const now = new Date();
    const lastSevenDaysStart = getLastSevenDaysStart();
    const currentWeekStart = getCurrentWeekStart();
    const lastSevenDaysSessions = sessions.filter(
        (session) => new Date(session.completedAt) >= lastSevenDaysStart,
    );
    const currentWeekSessions = sessions.filter((session) => {
        const completedAt = new Date(session.completedAt);

        return completedAt >= currentWeekStart && completedAt <= now;
    });

    return {
        totalCompletedSessions,
        totalDurationInSeconds,
        averageSessionInSeconds,
        longestSessionInSeconds,
        lastSevenDaysCompletedSessions: lastSevenDaysSessions.length,
        lastSevenDaysDurationInSeconds: lastSevenDaysSessions.reduce(
            (total, session) => total + session.plannedDurationInSeconds,
            0,
        ),
        currentWeekCompletedSessions: currentWeekSessions.length,
        currentWeekDurationInSeconds: currentWeekSessions.reduce(
            (total, session) => total + session.plannedDurationInSeconds,
            0,
        ),
    };
}

const buildDailyBuckets = (sessions: ReportSession[]) => {
    const bucketMap = new Map<string, { date: string; completedSessions: number; durationInSeconds: number }>();

    sessions.forEach((session) => {
        const date = getUtcDateKey(session.completedAt);
        const currentBucket = bucketMap.get(date) ?? {
            date,
            completedSessions: 0,
            durationInSeconds: 0,
        };

        currentBucket.completedSessions += 1;
        currentBucket.durationInSeconds += session.plannedDurationInSeconds;
        bucketMap.set(date, currentBucket);
    });

    return Array.from(bucketMap.values()).sort((firstBucket, secondBucket) =>
        firstBucket.date.localeCompare(secondBucket.date),
    );
}

const buildTaskSummaries = (sessions: ReportSession[]) => {
    const taskMap = new Map<string, {
        taskId: string;
        taskName: string;
        completedSessions: number;
        durationInSeconds: number;
        lastCompletedAt: string;
    }>();

    sessions.forEach((session) => {
        const currentTask = taskMap.get(session.taskId) ?? {
            taskId: session.taskId,
            taskName: session.taskName,
            completedSessions: 0,
            durationInSeconds: 0,
            lastCompletedAt: session.completedAt,
        };

        currentTask.completedSessions += 1;
        currentTask.durationInSeconds += session.plannedDurationInSeconds;

        if (new Date(session.completedAt) > new Date(currentTask.lastCompletedAt)) {
            currentTask.lastCompletedAt = session.completedAt;
        }

        taskMap.set(session.taskId, currentTask);
    });

    return Array.from(taskMap.values()).sort(
        (firstTask, secondTask) => secondTask.durationInSeconds - firstTask.durationInSeconds,
    );
}

const getSessionReports = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const supabase = req.supabase!;
        const startDate = parseDateParam(toQueryString(req.query.startDate));
        const endDate = parseDateParam(toQueryString(req.query.endDate), true);
        const taskId = toQueryString(req.query.taskId);

        if (startDate && endDate && startDate > endDate) {
            res.status(400).json({ error: 'startDate must be before endDate' });
            return;
        }

        let query = supabase
            .from('sessions')
            .select(`
                id,
                task_id,
                planned_duration_in_seconds,
                created_at,
                tasks (
                    id,
                    task_name,
                    task_description
                )
            `)
            .eq('user_id', userId)
            .eq('status', SESSION_STATUS.COMPLETED)
            .order('created_at', { ascending: false });

        if (taskId) {
            query = query.eq('task_id', taskId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        const allCompletedSessions = ((data ?? []) as CompletedSessionRow[])
            .filter((session) => session.created_at && session.planned_duration_in_seconds)
            .map((session) => {
                const task = getTask(session.tasks);
                const plannedDurationInSeconds = Number(session.planned_duration_in_seconds);
                const completedAt = addSecondsToIso(session.created_at, plannedDurationInSeconds);

                return {
                    id: session.id,
                    taskId: session.task_id,
                    taskName: task?.task_name ?? 'Untitled task',
                    plannedDurationInSeconds,
                    startedAt: new Date(session.created_at).toISOString(),
                    completedAt,
                };
            });

        const filteredSessions = allCompletedSessions.filter((session) => {
            const completedAt = new Date(session.completedAt);

            if (startDate && completedAt < startDate) {
                return false;
            }

            if (endDate && completedAt > endDate) {
                return false;
            }

            return true;
        });

        res.status(200).json({
            message: 'Session report received successfully',
            userId,
            info: {
                filters: {
                    startDate: startDate?.toISOString() ?? null,
                    endDate: endDate?.toISOString() ?? null,
                    taskId: taskId || null,
                },
                summary: summarizeSessions(filteredSessions),
                dailyBuckets: buildDailyBuckets(filteredSessions),
                taskSummaries: buildTaskSummaries(filteredSessions),
                sessions: filteredSessions.sort(
                    (firstSession, secondSession) =>
                        new Date(secondSession.completedAt).getTime() -
                        new Date(firstSession.completedAt).getTime(),
                ),
            },
        });
    } catch (error) {
        sendControllerError(res, error);
    }
}

export { getSessionReports };
