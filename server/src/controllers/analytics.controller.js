import { pool } from '../config/db.js';

const ALLOWED_RANGES = new Set([7, 30, 90]);

function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dateKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export async function getDashboardAnalytics(req, res, next) {
  try {
    const days = ALLOWED_RANGES.has(Number(req.query.days)) ? Number(req.query.days) : 30;
    const userId = req.user.id;

    const [workspaceRows] = await pool.execute(
      `SELECT id, title, created_at, updated_at
       FROM workplaces
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY)
       ORDER BY created_at ASC`,
      [userId],
    );

    const [[workspaceTotalRow]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM workplaces WHERE user_id = ?',
      [userId],
    );

    const [activityRows] = await pool.execute(
      `SELECT id, event_type, entity_type, entity_id, description, created_at
       FROM activity_events
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 12`,
      [userId],
    );

    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setHours(0, 0, 0, 0);
    currentStart.setDate(currentStart.getDate() - days + 1);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);

    const currentWorkspaces = workspaceRows.filter((row) => new Date(row.created_at) >= currentStart).length;
    const previousWorkspaces = workspaceRows.filter((row) => {
      const created = new Date(row.created_at);
      return created >= previousStart && created < currentStart;
    }).length;

    const buckets = new Map();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(currentStart);
      date.setDate(currentStart.getDate() + i);
      buckets.set(date.toISOString().slice(0, 10), 0);
    }
    workspaceRows.forEach((row) => {
      const key = dateKey(row.created_at);
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
    });

    let admin = null;
    if (req.user.role === 'admin') {
      const [[totals]] = await pool.query(
        `SELECT
          COUNT(*) AS total_users,
          SUM(is_active = 1) AS active_users,
          SUM(created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)) AS current_users,
          SUM(created_at >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY)
              AND created_at < DATE_SUB(CURDATE(), INTERVAL ${days} DAY)) AS previous_users
         FROM users`,
      );
      const totalUsers = Number(totals.total_users || 0);
      const activeUsers = Number(totals.active_users || 0);
      const currentUsers = Number(totals.current_users || 0);
      const previousUsers = Number(totals.previous_users || 0);
      admin = {
        totalUsers,
        activeUsers,
        retentionRate: totalUsers ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0,
        newUsers: currentUsers,
        userGrowth: percentChange(currentUsers, previousUsers),
      };
    }

    return res.json({
      rangeDays: days,
      summary: {
        totalWorkspaces: Number(workspaceTotalRow.total || 0),
        newWorkspaces: currentWorkspaces,
        workspaceChange: percentChange(currentWorkspaces, previousWorkspaces),
        activityCount: activityRows.length,
      },
      workspaceTrend: Array.from(buckets, ([date, count]) => ({ date, count })),
      recentEvents: activityRows.map((event) => ({
        id: Number(event.id),
        type: event.event_type,
        entityType: event.entity_type,
        entityId: event.entity_id ? Number(event.entity_id) : null,
        description: event.description,
        createdAt: event.created_at,
      })),
      admin,
    });
  } catch (error) {
    next(error);
  }
}
