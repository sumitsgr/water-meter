import pool from '../db.js';

export async function getAllAlarms(req, res) {
  try {
    const { resolved } = req.query;

    let query = `
      SELECT 
        a.*, md.cust_name, md.cust_address,
        z.title as zone_name, w.title as ward_name
      FROM alarms a
      LEFT JOIN master_device md ON a.device_id = md.device_id
      LEFT JOIN zones z ON md.zone_id = z.id
      LEFT JOIN wards w ON md.ward_id = w.id
      WHERE 1=1
    `;

    const params = [];
    if (resolved !== undefined) {
      query += ' AND a.resolved = ?';
      params.push(resolved);
    }

    query += ' ORDER BY a.record_time DESC';

    const [rows] = await pool.query(query, params);
    res.json({ error: 0, total: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}

export async function resolveAlarm(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'UPDATE alarms SET resolved = 1 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 1, message: 'Alarm not found.' });
    }

    res.json({ error: 0, message: 'Alarm resolved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}