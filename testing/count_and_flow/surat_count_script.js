"use strict";
require("dotenv").config();
const { DateTime, Settings } = require("luxon");
const mysql = require("mysql");
const cron = require("node-cron");

Settings.defaultZone = process.env.SCRIPT_TIMEZONE;

let connection = mysql.createPool({
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
	connectionLimit: 50,
	dateStrings: ["DATE", "DATETIME"],
	supportBigNumbers: true,
	bigNumberStrings: true,
});

function doQuery(query, user_data_arr = []) {
	return new Promise((resolve, reject) => {
		connection.query(query, user_data_arr, function selectCb(err, results) {
			if (err) {
				console.log(err);
				return reject(err);
			} else {
				return resolve(results);
			}
		});
	});
}

// cron.schedule("*/20 * * * *", async () => {
// Running at every 20th minute

cron.schedule("*/15 * * * *", async () => {
	// Running at minute 30

	try {
		let zone_ids, locality_ids, ward_ids;
		await Promise.all([
			doQuery("SELECT id FROM zones;"),
			doQuery("SELECT id FROM locality;"),
			doQuery("SELECT id FROM wards;"),
		]).then((values) => {
			zone_ids = values[0];
			locality_ids = values[1];
			ward_ids = values[2];
		});

		// console.log("*** zone_ids ***", zone_ids, "\n*** locality_ids ***", locality_ids, "\n*** ward_ids ***", ward_ids);

		// update wards
		console.log("*** updating wards ***");
		let yesterday = DateTime.local().minus({ days: 1 }).toFormat("yyyy-MM-dd");
		let last_month = DateTime.local().minus({ month: 1 }).endOf("month").toFormat("yyyy-MM-dd");

		for (let i = 0; i < ward_ids.length; i++) {
			let ward_id = ward_ids[i].id;

			let device_records, zone_id, locality_id;

			await Promise.all([
				doQuery(`SELECT zone_id, locality_id FROM wards WHERE id = ${ward_id};`),
				doQuery(
					`SELECT md.*, tld.reading, tld.update_time, COALESCE(dc.reading, 0) as prev_reading, COALESCE(mc.reading, 0) as month_reading FROM master_device md LEFT JOIN trans_last_data tld ON md.device_id = tld.device_id LEFT JOIN (SELECT * FROM daily_consumption WHERE insert_time = "${yesterday}") dc ON md.device_id = dc.device_id LEFT JOIN (SELECT * FROM monthly_consumption WHERE insert_time = "${last_month}") mc ON md.device_id = mc.device_id WHERE md.ward_id = ${ward_id};`
				),
			]).then((values) => {
				zone_id = values[0][0].zone_id;
				locality_id = values[0][0].locality_id;
				device_records = values[1];
			});

			if (device_records.length > 0) {
				let total_connected = 0,
					today_flow = 0,
					monthly_flow = 0;

				for (let j = 0; j < device_records.length; j++) {
					let device = device_records[j];
					let conn_status = 0;

					if (device.update_time != "") {
						let minutes = Math.trunc(
							DateTime.local().diff(DateTime.fromSQL(device.update_time), "minutes").toObject().minutes
						);
						if (minutes < 60 * 24 * 7) {
							conn_status = 1;
						} else {
							conn_status = 0;
						}
					} else {
						conn_status = 0;
					}
					if (conn_status === 1) {
						total_connected += 1;
					}
					if (device.prev_reading === null) {
						device.prev_reading = 0;
					}
					if (device.reading === null) {
						device.reading = 0;
					}
					if (device.month_reading === null) {
						device.month_reading = 0;
					}

					today_flow += parseFloat(device.reading) - parseFloat(device.prev_reading);
					monthly_flow += parseFloat(device.reading) - parseFloat(device.month_reading);
				}

				await Promise.all([
					doQuery(
						`INSERT INTO ward_records SET zone_id = ${zone_id}, locality_id = ${locality_id}, ward_id = ${ward_id}, total_device = ${device_records.length}, total_connected = ${total_connected}, today_flow = '${today_flow}', monthly_flow = '${monthly_flow}', update_time = NOW();`
					),

					doQuery(
						`UPDATE ward_master SET total_device = ${device_records.length}, total_connected = ${total_connected}, today_flow = '${today_flow}', monthly_flow = '${monthly_flow}', update_time = NOW() WHERE ward_id = ${ward_id};`
					),
				]).then((values) => {
					console.log("*** WARD REPORT UPDATE COMPLETE > IF ***");
				});
			} else {
				console.log("*** NO RECORDS ***");

				await Promise.all([
					doQuery(
						`INSERT INTO ward_records SET zone_id = ${zone_id}, locality_id = ${locality_id}, ward_id = ${ward_id}, total_device = 0, total_connected = 0, today_flow = '0', monthly_flow = '0', update_time = NOW();`
					),

					doQuery(
						`UPDATE ward_master SET total_device = 0, total_connected = 0, today_flow = '0', monthly_flow = '0', update_time = NOW() WHERE ward_id = ${ward_id};`
					),
				]).then((values) => {
					console.log(`*** WARD REPORT UPDATE COMPLETE > ELSE ***`);
				});
			}
		}

		// update locality
		console.log("*** updating locality ***");
		for (let i = 0; i < locality_ids.length; i++) {
			let locality_id = locality_ids[i].id;

			let zone_id, ward_records;

			await Promise.all([
				doQuery(`SELECT zone_id FROM locality WHERE id = ${locality_id};`),
				doQuery(`SELECT * FROM ward_master WHERE locality_id = ${locality_id};`),
			]).then((values) => {
				zone_id = values[0][0].zone_id;
				ward_records = values[1];
			});

			if (ward_records.length > 0) {
				let total_device = 0,
					total_connected = 0,
					today_flow = 0,
					monthly_flow = 0;

				for (let j = 0; j < ward_records.length; j++) {
					let ward = ward_records[j];

					total_device += parseInt(ward.total_device);
					total_connected += parseInt(ward.total_connected);
					today_flow += parseFloat(ward.today_flow);
					monthly_flow += parseFloat(ward.monthly_flow);
				}

				await Promise.all([
					doQuery(
						`INSERT INTO locality_records SET zone_id = ${zone_id}, locality_id = ${locality_id}, total_ward = ${ward_records.length}, total_device = ${total_device}, total_connected = ${total_connected}, today_flow = '${today_flow}', monthly_flow = '${monthly_flow}', update_time = NOW();`
					),
					doQuery(
						`UPDATE locality_master SET total_ward = ${ward_records.length}, total_device = ${total_device}, total_connected = ${total_connected}, today_flow = '${today_flow}', monthly_flow = '${monthly_flow}', update_time = NOW() WHERE locality_id = ${locality_id};`
					),
				]).then((values) => {
					console.log("*** LOCALITY REPORT UPDATE COMPLETE > IF ***");
				});
			} else {
				console.log("*** NO RECORDS ***");

				await Promise.all([
					doQuery(
						`INSERT INTO locality_records SET zone_id = ${zone_id}, locality_id = ${locality_id}, total_ward = 0, total_device = 0, total_connected = 0, today_flow = '0', monthly_flow = '0', update_time = NOW();`
					),
					doQuery(
						`UPDATE locality_master SET total_ward = 0, total_device = 0, total_connected = 0, today_flow = '0', monthly_flow = '0', update_time = NOW() WHERE locality_id = ${locality_id};`
					),
				]).then((values) => {
					console.log("*** LOCALITY REPORT UPDATE COMPLETE > ELSE ***");
				});
			}
		}

		// update zones
		console.log("*** updating zones ***");
		for (let i = 0; i < zone_ids.length; i++) {
			let zone_id = zone_ids[i].id;

			let locality_records = await doQuery(`SELECT * FROM locality_master WHERE zone_id = ${zone_id}`);

			if (locality_records.length > 0) {
				let total_ward = 0,
					total_device = 0,
					total_connected = 0,
					today_flow = 0,
					monthly_flow = 0;

				for (let j = 0; j < locality_records.length; j++) {
					let locality = locality_records[j];

					total_ward += parseInt(locality.total_ward);
					total_device += parseInt(locality.total_device);
					total_connected += parseInt(locality.total_connected);
					today_flow += parseFloat(locality.today_flow);
					monthly_flow += parseFloat(locality.monthly_flow);
				}

				await Promise.all([
					doQuery(
						`INSERT INTO zone_records SET zone_id = ${zone_id}, total_locality = ${locality_records.length}, total_ward = ${total_ward}, total_device = ${total_device}, total_connected = ${total_connected}, today_flow = '${today_flow}', monthly_flow = '${monthly_flow}', update_time = NOW();`
					),
					doQuery(
						`UPDATE zone_master SET total_locality = ${locality_records.length}, total_ward = ${total_ward}, total_device = ${total_device}, total_connected = ${total_connected}, today_flow = '${today_flow}', monthly_flow = '${monthly_flow}', update_time = NOW() WHERE zone_id = ${zone_id};`
					),
				]).then((values) => {
					console.log("*** ZONE REPORT UPDATE COMPLETE > IF ***");
				});
			} else {
				console.log("*** NO RECORDS ***");

				await Promise.all([
					doQuery(
						`INSERT INTO zone_records SET zone_id = ${zone_id}, total_locality = 0, total_ward = 0, total_device = 0, total_connected = 0, today_flow = '0', monthly_flow = '0', update_time = NOW();`
					),
					doQuery(
						`UPDATE zone_master SET total_locality = 0, total_ward = 0, total_device = 0, total_connected = 0, today_flow = '0', monthly_flow = '0', update_time = NOW() WHERE zone_id = ${zone_id};`
					),
				]).then((values) => {
					console.log("*** ZONE REPORT UPDATE COMPLETE > ELSE ***");
				});
			}
		}

		// update alarms
		console.log("*** updating alarms ***");
		for (let i = 0; i < ward_ids.length; i++) {
			let ward_id = ward_ids[i].id;

			let zone_id,
				tuple_exists,
				device_records,
				alarm_obj = {
					meter_cover_opened: 0,
					fitting_removed: 0,
					magnetic_affected: 0,
					battery_cover_opened: 0,
					leakage_penalty: 0,
					meter_disabled: 0,
					reverse_flow: 0,
					battery_dead: 0,
					first_boot: 0,
					periodic: 0,
					reconnection: 0,
					manual_connection: 0,
					downlink_issue: 0,
				};

			await Promise.all([
				doQuery(`SELECT zone_id FROM wards WHERE id = ${ward_id};`),
				doQuery(`SELECT id FROM alarm_master WHERE ward_id = ${ward_id};`),
				doQuery(
					`SELECT tld.* FROM trans_last_data tld LEFT JOIN master_device md ON tld.device_id = md.device_id WHERE md.ward_id = ${ward_id};`
				),
			]).then((values) => {
				zone_id = values[0][0].zone_id;
				if (values[1].length > 0) tuple_exists = values[1][0].id;
				device_records = values[2];
			});

			if (device_records.length > 0) {
				for (let j = 0; j < device_records.length; j++) {
					let device = device_records[j];

					alarm_obj.meter_cover_opened += parseInt(device.meter_cover_opened);
					alarm_obj.fitting_removed += parseInt(device.fitting_removed);
					alarm_obj.magnetic_affected += parseInt(device.magnetic_affected);
					alarm_obj.battery_cover_opened += parseInt(device.battery_cover_opened);
					alarm_obj.leakage_penalty += parseInt(device.leakage_penalty);
					alarm_obj.meter_disabled += parseInt(device.meter_disabled);
					alarm_obj.reverse_flow += parseInt(device.reverse_flow);
					alarm_obj.battery_dead += parseInt(device.battery_dead);
					alarm_obj.first_boot += parseInt(device.first_boot);
					alarm_obj.periodic += parseInt(device.periodic);
					alarm_obj.reconnection += parseInt(device.reconnection);
					alarm_obj.manual_connection += parseInt(device.manual_connection);
					alarm_obj.downlink_issue += parseInt(device.downlink_issue);
				}

				if (tuple_exists) {
					let update_alarm = await doQuery(
						`UPDATE alarm_master SET ?, update_time = NOW() WHERE ward_id = ${ward_id};`,
						[alarm_obj]
					);

					if (update_alarm.changedRows === 1) {
						console.log(`*** ALARMS FOR WARD ${ward_id} COMPLETE > IF ***`);
					}
				} else {
					let insert_alarm = await doQuery(
						`INSERT INTO alarm_master SET zone_id = ${zone_id}, ward_id = ${ward_id}, ?, update_time = NOW();`,
						[alarm_obj]
					);

					if (insert_alarm.affectedRows === 1) {
						console.log(`*** ALARMS FOR WARD ${ward_id} COMPLETE > IF ***`);
					}
				}
			} else {
				console.log("*** NO DEVICES FOUND, ADDING DEFAULT DATA ***");

				if (tuple_exists) {
					let update_alarm = await doQuery(
						`UPDATE alarm_master SET ?, update_time = NOW() WHERE ward_id = ${ward_id};`,
						[alarm_obj]
					);

					if (update_alarm.changedRows === 1) {
						console.log(`*** ALARMS FOR WARD ${ward_id} COMPLETE > ELSE ***`);
					}
				} else {
					let insert_alarm = await doQuery(
						`INSERT INTO alarm_master SET zone_id = ${zone_id}, ward_id = ${ward_id}, ?, update_time = NOW();`,
						[alarm_obj]
					);

					if (insert_alarm.affectedRows === 1) {
						console.log(`*** ALARMS FOR WARD ${ward_id} COMPLETE > ELSE ***`);
					}
				}
			}
		}
	} catch (err) {
		console.log("Error is: ", err);
	}
});

// cron.schedule("0 0 0 * * *", async () => {
// 	// Running every day
// 	try {
// 		console.log(
// 			`Adding daily consumption, Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
// 				"ttt"
// 			)}`
// 		);
// 		let yesterday = DateTime.local().minus({ days: 1 }).toFormat("yyyy-MM-dd");

// 		doQuery(
// 			"INSERT INTO daily_consumption (device_id, reading, consumption, reading_time, insert_time) SELECT device_id, reading, IFNULL((SELECT (tld.reading - reading) FROM daily_consumption WHERE device_id = tld.device_id ORDER BY id DESC LIMIT 1), 0), update_time, ? FROM trans_last_data tld;",
// 			[yesterday]
// 		).then((res) => {
// 			console.log("*** Daily Consumption Added ***");
// 		});
// 	} catch (err) {
// 		console.log("Error is: ", err);
// 	}
// });

// cron.schedule("20 0 0 1 * *", async () => {
// 	// Running every month
// 	try {
// 		console.log(
// 			`Adding monthly consumption, Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
// 				"ttt"
// 			)}`
// 		);
// 		let yesterday = DateTime.local().minus({ days: 1 }).toFormat("yyyy-MM-dd");

// 		doQuery(
// 			"INSERT INTO monthly_consumption (device_id, reading, consumption, reading_time, insert_time) SELECT device_id, reading, IFNULL((SELECT (tld.reading - mc.reading) FROM monthly_consumption mc WHERE mc.device_id = tld.device_id ORDER BY mc.id DESC LIMIT 1), 0), update_time, ? FROM trans_last_data tld;",
// 			[yesterday]
// 		).then((res) => {
// 			console.log("*** Monthly Consumption Added ***");
// 		});
// 	} catch (err) {
// 		console.log("Error is: ", err);
// 	}
// });

console.log("*** Count script running ***");
