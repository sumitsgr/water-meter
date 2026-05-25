import pool from '../db.js';

export async function getAllDevices(req, res) {
  try {
    const { zone_id, ward_id, status, search } = req.query;

    let query = `
      SELECT 
        md.id, md.device_id, md.meter_id, md.meter_type, md.meter_size,
        md.cust_name, md.cust_address, md.mobile_no,
        md.location_lat, md.location_lng, md.installation_date, md.status,
        z.title as zone_name,
        l.title as locality_name,
        w.title as ward_name,
        tld.reading as last_reading,
        tld.update_time as last_seen
      FROM master_device md
      LEFT JOIN zones z ON md.zone_id = z.id
      LEFT JOIN localities l ON md.locality_id = l.id
      LEFT JOIN wards w ON md.ward_id = w.id
      LEFT JOIN trans_last_data tld ON md.device_id = tld.device_id
      WHERE 1=1
    `;

    const params = [];

    if (zone_id) { query += ' AND md.zone_id = ?'; params.push(zone_id); }
    if (ward_id) { query += ' AND md.ward_id = ?'; params.push(ward_id); }
    if (status !== undefined) { query += ' AND md.status = ?'; params.push(status); }
    if (search) {
      query += ' AND (md.cust_name LIKE ? OR md.device_id LIKE ? OR md.meter_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY md.id DESC';

    const [rows] = await pool.query(query, params);
    res.json({ error: 0, total: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}

export async function getDeviceById(req, res) {
  try {
    const { device_id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        md.*,
        z.title as zone_name,
        l.title as locality_name,
        w.title as ward_name,
        tld.reading as last_reading,
        tld.update_time as last_seen
      FROM master_device md
      LEFT JOIN zones z ON md.zone_id = z.id
      LEFT JOIN localities l ON md.locality_id = l.id
      LEFT JOIN wards w ON md.ward_id = w.id
      LEFT JOIN trans_last_data tld ON md.device_id = tld.device_id
      WHERE md.device_id = ?
    `, [device_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 1, message: 'Device not found.' });
    }

    res.json({ error: 0, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}

export async function getDeviceConsumption(req, res) {
  try {
    const { device_id } = req.params;
    const { type = 'daily', days = 30 } = req.query;

    let query;
    if (type === 'monthly') {
      query = `
        SELECT device_id, opening_reading, closing_reading, 
               consumption, consumption_month as date
        FROM monthly_consumption
        WHERE device_id = ?
        ORDER BY consumption_month DESC
        LIMIT 12
      `;
    } else {
      query = `
        SELECT device_id, opening_reading, closing_reading,
               consumption, consumption_date as date
        FROM daily_consumption
        WHERE device_id = ?
        ORDER BY consumption_date DESC
        LIMIT ?
      `;
    }

    const params = type === 'monthly' ? [device_id] : [device_id, parseInt(days)];
    const [rows] = await pool.query(query, params);

    res.json({ error: 0, data: rows.reverse() }); // oldest first for charts
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}

export async function getDeviceAlarms(req, res) {
  try {
    const { device_id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM alarms WHERE device_id = ? ORDER BY record_time DESC',
      [device_id]
    );
    res.json({ error: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 1, message: 'Server error.' });
  }
}