import pool from '../db.js';

export async function getDashboardSummary(req, res) {
  try {
    const [[deviceCount]] = await pool.query('SELECT COUNT(*) as total FROM master_device WHERE status = 1');
    const [[alarmCount]] = await pool.query('SELECT COUNT(*) as total FROM alarms WHERE resolved = 0');
    const [[todayFlow]] = await pool.query('SELECT ROUND(SUM(today_flow), 2) as total FROM zone_stats');
    const [[monthlyFlow]] = await pool.query('SELECT ROUND(SUM(monthly_flow), 2) as total FROM zone_stats');

    res.json({
      error: 0,
      data: {
        total_devices: deviceCount.total,
        active_alarms: alarmCount.total,
        today_flow: todayFlow.total,
        monthly_flow: monthlyFlow.total
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}

export async function getZoneStats(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        z.id, z.title, z.areacode,
        zs.total_devices, zs.active_devices,
        zs.today_flow, zs.monthly_flow, zs.update_time
      FROM zones z
      LEFT JOIN zone_stats zs ON z.id = zs.zone_id
      WHERE z.status = 1
    `);
    res.json({ error: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}