"use strict";

// import "dotenv/config";
// import { DateTime, Settings } from "luxon";
// import mysql from "mysql";
// import { schedule } from "node-cron";
require("dotenv").config();
const { DateTime, Settings } = require("luxon");
const mysql = require("mysql");
const { schedule } = require("node-cron");

// Configure the time zone
Settings.defaultZone = process.env.SCRIPT_TIMEZONE;

let pool = mysql.createPool({
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
		pool.query(query, user_data_arr, function selectCb(err, results) {
			if (err) {
				console.log(err);
				return reject(err);
			} else {
				return resolve(results);
			}
		});
	});
}

// manual trigger

schedule("0 0 0,1,2,3 * * *", async () => {
	// Running every day at 00:00(mm:ss) past hour 0, 1, 2, and 3.
	try {
		let today = DateTime.local();
		let yesterday = today.minus({ days: 1 }).toFormat("yyyy-MM-dd");
		let prev_month_last_date = today.minus({ month: 1 }).endOf("month").toFormat("yyyy-MM-dd");

		console.log(`Adding consumption data, Date: ${today.toFormat("DDD")}, Time: ${today.toFormat("ttt")}`);

		if (today.day === 1 && today.hour === 0) {
			console.time("time_taken_1");
			console.log("Adding new monthly data & new daily data");

			let prev_month_start = today.minus({ month: 1 }).startOf("month").toFormat("yyyy-MM-dd HH:mm:ss");
			let yesterday_start = today.minus({ days: 1 }).startOf("day").toFormat("yyyy-MM-dd HH:mm:ss");
			let yesterday_end = today.minus({ days: 1 }).endOf("day").toFormat("yyyy-MM-dd HH:mm:ss");

			let tld_records, prev_month_start_records, yesterday_start_records, yesterday_end_records;

			// yesterday_end === prev_month_end

			await Promise.all([
				doQuery(`SELECT device_id, reading, update_time FROM trans_last_data tld;`),

				doQuery(`SELECT device_id, reading, insert_time
				FROM trans_received_data trd1
				INNER JOIN (
					SELECT MAX(id) AS max_id
					FROM trans_received_data
					WHERE DATE(insert_time) < '${prev_month_start}'
					GROUP BY device_id ) trd2
				ON trd1.id = trd2.max_id;`),

				doQuery(`SELECT device_id, reading, insert_time
				FROM trans_received_data trd1
				INNER JOIN (
					SELECT MAX(id) AS max_id
					FROM trans_received_data
					WHERE DATE(insert_time) < '${yesterday_start}'
					GROUP BY device_id ) trd2
				ON trd1.id = trd2.max_id;`),

				doQuery(`SELECT device_id, reading, insert_time
				FROM trans_received_data trd1
				INNER JOIN (
					SELECT MAX(id) AS max_id
					FROM trans_received_data
					WHERE DATE(insert_time) <= '${yesterday_end}'
					GROUP BY device_id ) trd2
				ON trd1.id = trd2.max_id;`),
			]).then((values) => {
				tld_records = values[0];
				prev_month_start_records = values[1];
				yesterday_start_records = values[2];
				yesterday_end_records = values[3];
			});

			let prev_month_start_data = {};
			if (prev_month_start_records.length > 0) {
				for (let i = 0; i < prev_month_start_records.length; i++) {
					prev_month_start_data[prev_month_start_records[i].device_id] = {
						// device_id: prev_month_start_records[i].device_id,
						reading: prev_month_start_records[i].reading,
						insert_time: prev_month_start_records[i].insert_time,
					};
				}
			}

			let yesterday_start_data = {};
			if (yesterday_start_records.length > 0) {
				for (let i = 0; i < yesterday_start_records.length; i++) {
					yesterday_start_data[yesterday_start_records[i].device_id] = {
						// device_id: yesterday_start_records[i].device_id,
						reading: yesterday_start_records[i].reading,
						insert_time: yesterday_start_records[i].insert_time,
					};
				}
			}

			let yesterday_end_data = {};
			if (yesterday_end_records.length > 0) {
				for (let i = 0; i < yesterday_end_records.length; i++) {
					yesterday_end_data[yesterday_end_records[i].device_id] = {
						// device_id: yesterday_end_records[i].device_id,
						reading: yesterday_end_records[i].reading,
						insert_time: yesterday_end_records[i].insert_time,
					};
				}
			}

			let daily_insert_query =
				"INSERT INTO daily_consumption (device_id, reading, consumption, reading_time, insert_time) VALUES ";
			let monthly_insert_query =
				"INSERT INTO monthly_consumption (device_id, reading, consumption, reading_time, insert_time) VALUES ";
			let daily_insert_sub_query = "";
			let monthly_insert_sub_query = "";

			for (let i = 0; i < tld_records.length; i++) {
				let daily_reading,
					monthly_reading,
					daily_consumption,
					monthly_consumption,
					daily_reading_time,
					monthly_reading_time;

				let dev_id_pmsd_exist = tld_records[i].device_id in prev_month_start_data;
				let dev_id_ysd_exist = tld_records[i].device_id in yesterday_start_data;
				let dev_id_yed_exist = tld_records[i].device_id in yesterday_end_data;

				if (dev_id_ysd_exist && dev_id_yed_exist) {
					daily_consumption =
						parseFloat(yesterday_end_data[tld_records[i].device_id].reading) -
						parseFloat(yesterday_start_data[tld_records[i].device_id].reading);

					daily_reading = yesterday_end_data[tld_records[i].device_id].reading;
					daily_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
				} else if (dev_id_ysd_exist && !dev_id_yed_exist) {
					// device is offline
					daily_consumption = 0;
					daily_reading = tld_records[i].reading;
					daily_reading_time = tld_records[i].update_time;
				} else if (!dev_id_ysd_exist && dev_id_yed_exist) {
					// no previous reading to subtract
					daily_consumption = yesterday_end_data[tld_records[i].device_id].reading;
					daily_reading = yesterday_end_data[tld_records[i].device_id].reading;
					daily_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
				} else {
					// data never received
					daily_consumption = 0;
					daily_reading = tld_records[i].reading;
					daily_reading_time = tld_records[i].update_time;
				}

				if (dev_id_pmsd_exist && dev_id_yed_exist) {
					monthly_consumption =
						parseFloat(yesterday_end_data[tld_records[i].device_id].reading) -
						parseFloat(prev_month_start_data[tld_records[i].device_id].reading);

					monthly_reading = yesterday_end_data[tld_records[i].device_id].reading;
					monthly_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
				} else if (dev_id_pmsd_exist && !dev_id_yed_exist) {
					// device is offline
					monthly_consumption = 0;
					monthly_reading = tld_records[i].reading;
					monthly_reading_time = tld_records[i].update_time;
				} else if (!dev_id_pmsd_exist && dev_id_yed_exist) {
					// no previous reading to subtract
					monthly_consumption = yesterday_end_data[tld_records[i].device_id].reading;
					monthly_reading = yesterday_end_data[tld_records[i].device_id].reading;
					monthly_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
				} else {
					// data never received
					monthly_consumption = 0;
					monthly_reading = tld_records[i].reading;
					monthly_reading_time = tld_records[i].update_time;
				}

				daily_insert_sub_query += `('${tld_records[i].device_id}', ${daily_reading}, ${daily_consumption}, '${daily_reading_time}', '${yesterday}'), `;

				monthly_insert_sub_query += `('${tld_records[i].device_id}', ${monthly_reading}, ${monthly_consumption}, '${monthly_reading_time}', '${prev_month_last_date}'), `;
			}

			monthly_insert_sub_query = monthly_insert_sub_query.slice(0, -2);
			monthly_insert_query += monthly_insert_sub_query;
			monthly_insert_query += ";";

			daily_insert_sub_query = daily_insert_sub_query.slice(0, -2);
			daily_insert_query += daily_insert_sub_query;
			daily_insert_query += ";";

			// run queries
			let daily_insert_results = await doQuery(daily_insert_query);
			console.log(`Total new daily data rows inserted: ${daily_insert_results.affectedRows}`);

			let monthly_insert_results = await doQuery(monthly_insert_query);
			console.log(`Total new monthly data rows inserted: ${monthly_insert_results.affectedRows}`);

			console.timeEnd("time_taken_1");
		} else if (today.hour === 0 || today.hour === 1 || today.hour === 2 || today.hour === 3) {
			if ((today.day === 2 || today.day === 3 || today.day === 4) && today.hour === 0) {
				console.time("time_taken_2");
				console.log("Checking for missed monthly data");

				let no_of_devices, data_already_added;

				// yesterday !== prev_month_last_date
				await Promise.all([
					doQuery(`SELECT COUNT(*) AS no_of_devices FROM trans_last_data;`),
					doQuery(`SELECT device_id FROM monthly_consumption WHERE insert_time = '${prev_month_last_date}';`),
				]).then((values) => {
					no_of_devices = parseInt(values[0][0].no_of_devices);
					data_already_added = values[1];
				});

				// a check if everything did not work perfectly well previously
				if (no_of_devices > data_already_added.length) {
					console.log(`Missed monthly data detected`);

					let prev_month_start = today.minus({ month: 1 }).startOf("month").toFormat("yyyy-MM-dd HH:mm:ss");
					let prev_month_end = today.minus({ month: 1 }).endOf("month").toFormat("yyyy-MM-dd HH:mm:ss");

					let already_added_devids = "";
					if (data_already_added.length > 0) {
						for (let i = 0; i < data_already_added.length; i++) {
							already_added_devids += `'${data_already_added[i].device_id}', `;
						}

						already_added_devids = already_added_devids.slice(0, -2);
					}

					if (already_added_devids === "") {
						already_added_devids = "''";
					}

					let tld_records, prev_month_start_records, prev_month_end_records;

					await Promise.all([
						doQuery(
							`SELECT device_id, reading, update_time FROM trans_last_data tld WHERE device_id NOT IN (${already_added_devids});`
						),

						doQuery(`SELECT device_id, reading, insert_time
						FROM trans_received_data trd1
						INNER JOIN (
							SELECT MAX(id) AS max_id
							FROM trans_received_data
							WHERE DATE(insert_time) < '${prev_month_start}' AND device_id NOT IN (${already_added_devids})
							GROUP BY device_id ) trd2
						ON trd1.id = trd2.max_id;`),

						doQuery(`SELECT device_id, reading, insert_time
						FROM trans_received_data trd1
						INNER JOIN (
							SELECT MAX(id) AS max_id
							FROM trans_received_data
							WHERE DATE(insert_time) <= '${prev_month_end}' AND device_id NOT IN (${already_added_devids})
							GROUP BY device_id ) trd2
						ON trd1.id = trd2.max_id;`),
					]).then((values) => {
						tld_records = values[0];
						prev_month_start_records = values[1];
						prev_month_end_records = values[2];
					});

					let prev_month_start_data = {};
					if (prev_month_start_records.length > 0) {
						for (let i = 0; i < prev_month_start_records.length; i++) {
							prev_month_start_data[prev_month_start_records[i].device_id] = {
								// device_id: prev_month_start_records[i].device_id,
								reading: prev_month_start_records[i].reading,
								insert_time: prev_month_start_records[i].insert_time,
							};
						}
					}

					let prev_month_end_data = {};
					if (prev_month_end_records.length > 0) {
						for (let i = 0; i < prev_month_end_records.length; i++) {
							prev_month_end_data[prev_month_end_records[i].device_id] = {
								// device_id: prev_month_end_records[i].device_id,
								reading: prev_month_end_records[i].reading,
								insert_time: prev_month_end_records[i].insert_time,
							};
						}
					}

					let monthly_insert_query =
						"INSERT INTO monthly_consumption (device_id, reading, consumption, reading_time, insert_time) VALUES ";
					let monthly_insert_sub_query = "";

					for (let i = 0; i < tld_records.length; i++) {
						let monthly_reading, monthly_consumption, monthly_reading_time;

						let dev_id_pmsd_exist = tld_records[i].device_id in prev_month_start_data;
						let dev_id_pmed_exist = tld_records[i].device_id in prev_month_end_data;

						if (dev_id_pmsd_exist && dev_id_pmed_exist) {
							monthly_consumption =
								parseFloat(prev_month_end_data[tld_records[i].device_id].reading) -
								parseFloat(prev_month_start_data[tld_records[i].device_id].reading);

							monthly_reading = prev_month_end_data[tld_records[i].device_id].reading;
							monthly_reading_time = prev_month_end_data[tld_records[i].device_id].insert_time;
						} else if (dev_id_pmsd_exist && !dev_id_pmed_exist) {
							// device is offline
							monthly_consumption = 0;
							monthly_reading = tld_records[i].reading;
							monthly_reading_time = tld_records[i].update_time;
						} else if (!dev_id_pmsd_exist && dev_id_pmed_exist) {
							// no previous reading to subtract
							monthly_consumption = prev_month_end_data[tld_records[i].device_id].reading;
							monthly_reading = prev_month_end_data[tld_records[i].device_id].reading;
							monthly_reading_time = prev_month_end_data[tld_records[i].device_id].insert_time;
						} else {
							// data never received
							monthly_consumption = 0;
							monthly_reading = tld_records[i].reading;
							monthly_reading_time = tld_records[i].update_time;
						}

						monthly_insert_sub_query += `('${tld_records[i].device_id}', ${monthly_reading}, ${monthly_consumption}, '${monthly_reading_time}', '${prev_month_last_date}'), `;
					}

					monthly_insert_sub_query = monthly_insert_sub_query.slice(0, -2);
					monthly_insert_query += monthly_insert_sub_query;
					monthly_insert_query += ";";

					// run queries
					let monthly_insert_results = await doQuery(monthly_insert_query);
					console.log(`Total missed monthly data rows inserted: ${monthly_insert_results.affectedRows}`);
				} else {
					console.log(`All the monthly data has already been added`);
				}

				console.timeEnd("time_taken_2");
			} // missed monthly data

			if (today.hour === 0) {
				console.time("time_taken_3");
				console.log("Adding new daily data");

				let yesterday_start = today.minus({ days: 1 }).startOf("day").toFormat("yyyy-MM-dd HH:mm:ss");
				let yesterday_end = today.minus({ days: 1 }).endOf("day").toFormat("yyyy-MM-dd HH:mm:ss");

				let tld_records, yesterday_start_records, yesterday_end_records;

				await Promise.all([
					doQuery(`SELECT device_id, reading, update_time FROM trans_last_data tld;`),

					doQuery(`SELECT device_id, reading, insert_time
					FROM trans_received_data trd1
					INNER JOIN (
						SELECT MAX(id) AS max_id
						FROM trans_received_data
						WHERE DATE(insert_time) < '${yesterday_start}'
						GROUP BY device_id ) trd2
					ON trd1.id = trd2.max_id;`),

					doQuery(`SELECT device_id, reading, insert_time
					FROM trans_received_data trd1
					INNER JOIN (
						SELECT MAX(id) AS max_id
						FROM trans_received_data
						WHERE DATE(insert_time) <= '${yesterday_end}'
						GROUP BY device_id ) trd2
					ON trd1.id = trd2.max_id;`),
				]).then((values) => {
					tld_records = values[0];
					yesterday_start_records = values[1];
					yesterday_end_records = values[2];
				});

				let yesterday_start_data = {};
				if (yesterday_start_records.length > 0) {
					for (let i = 0; i < yesterday_start_records.length; i++) {
						yesterday_start_data[yesterday_start_records[i].device_id] = {
							// device_id: yesterday_start_records[i].device_id,
							reading: yesterday_start_records[i].reading,
							insert_time: yesterday_start_records[i].insert_time,
						};
					}
				}

				let yesterday_end_data = {};
				if (yesterday_end_records.length > 0) {
					for (let i = 0; i < yesterday_end_records.length; i++) {
						yesterday_end_data[yesterday_end_records[i].device_id] = {
							// device_id: yesterday_end_records[i].device_id,
							reading: yesterday_end_records[i].reading,
							insert_time: yesterday_end_records[i].insert_time,
						};
					}
				}

				let daily_insert_query =
					"INSERT INTO daily_consumption (device_id, reading, consumption, reading_time, insert_time) VALUES ";
				let daily_insert_sub_query = "";

				for (let i = 0; i < tld_records.length; i++) {
					let daily_reading, daily_consumption, daily_reading_time;

					let dev_id_ysd_exist = tld_records[i].device_id in yesterday_start_data;
					let dev_id_yed_exist = tld_records[i].device_id in yesterday_end_data;

					if (dev_id_ysd_exist && dev_id_yed_exist) {
						daily_consumption =
							parseFloat(yesterday_end_data[tld_records[i].device_id].reading) -
							parseFloat(yesterday_start_data[tld_records[i].device_id].reading);

						daily_reading = yesterday_end_data[tld_records[i].device_id].reading;
						daily_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
					} else if (dev_id_ysd_exist && !dev_id_yed_exist) {
						// device is offline
						daily_consumption = 0;
						daily_reading = tld_records[i].reading;
						daily_reading_time = tld_records[i].update_time;
					} else if (!dev_id_ysd_exist && dev_id_yed_exist) {
						// no previous reading to subtract
						daily_consumption = yesterday_end_data[tld_records[i].device_id].reading;
						daily_reading = yesterday_end_data[tld_records[i].device_id].reading;
						daily_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
					} else {
						// data never received
						daily_consumption = 0;
						daily_reading = tld_records[i].reading;
						daily_reading_time = tld_records[i].update_time;
					}

					daily_insert_sub_query += `('${tld_records[i].device_id}', ${daily_reading}, ${daily_consumption}, '${daily_reading_time}', '${yesterday}'), `;
				}

				daily_insert_sub_query = daily_insert_sub_query.slice(0, -2);
				daily_insert_query += daily_insert_sub_query;
				daily_insert_query += ";";

				// run queries
				let daily_insert_results = await doQuery(daily_insert_query);
				console.log(`Total new daily data rows inserted: ${daily_insert_results.affectedRows}`);
				console.timeEnd("time_taken_3");
			} else {
				console.time("time_taken_4");
				console.log("Checking for missed daily data");

				let no_of_devices, data_already_added;

				await Promise.all([
					doQuery(`SELECT COUNT(*) AS no_of_devices FROM trans_last_data;`),
					doQuery(`SELECT device_id FROM daily_consumption WHERE insert_time = '${yesterday}';`),
				]).then((values) => {
					no_of_devices = parseInt(values[0][0].no_of_devices);
					data_already_added = values[1];
				});

				// a check if everything did not work perfectly well previously
				if (no_of_devices > data_already_added.length) {
					console.log(`Missed daily data detected`);

					let yesterday_start = today.minus({ days: 1 }).startOf("day").toFormat("yyyy-MM-dd HH:mm:ss");
					let yesterday_end = today.minus({ days: 1 }).endOf("day").toFormat("yyyy-MM-dd HH:mm:ss");

					let already_added_devids = "";
					if (data_already_added.length > 0) {
						for (let i = 0; i < data_already_added.length; i++) {
							already_added_devids += `'${data_already_added[i].device_id}', `;
						}

						already_added_devids = already_added_devids.slice(0, -2);
					}

					if (already_added_devids === "") {
						already_added_devids = "''";
					}

					let tld_records, yesterday_start_records, yesterday_end_records;

					await Promise.all([
						doQuery(
							`SELECT device_id, reading, update_time FROM trans_last_data tld WHERE device_id NOT IN (${already_added_devids});`
						),

						doQuery(`SELECT device_id, reading, insert_time
						FROM trans_received_data trd1
						INNER JOIN (
							SELECT MAX(id) AS max_id
							FROM trans_received_data
							WHERE DATE(insert_time) < '${yesterday_start}' AND device_id NOT IN (${already_added_devids})
							GROUP BY device_id ) trd2
						ON trd1.id = trd2.max_id;`),

						doQuery(`SELECT device_id, reading, insert_time
						FROM trans_received_data trd1
						INNER JOIN (
							SELECT MAX(id) AS max_id
							FROM trans_received_data
							WHERE DATE(insert_time) <= '${yesterday_end}' AND device_id NOT IN (${already_added_devids})
							GROUP BY device_id ) trd2
						ON trd1.id = trd2.max_id;`),
					]).then((values) => {
						tld_records = values[0];
						yesterday_start_records = values[1];
						yesterday_end_records = values[2];
					});

					let yesterday_start_data = {};
					if (yesterday_start_records.length > 0) {
						for (let i = 0; i < yesterday_start_records.length; i++) {
							yesterday_start_data[yesterday_start_records[i].device_id] = {
								// device_id: yesterday_start_records[i].device_id,
								reading: yesterday_start_records[i].reading,
								insert_time: yesterday_start_records[i].insert_time,
							};
						}
					}

					let yesterday_end_data = {};
					if (yesterday_end_records.length > 0) {
						for (let i = 0; i < yesterday_end_records.length; i++) {
							yesterday_end_data[yesterday_end_records[i].device_id] = {
								// device_id: yesterday_end_records[i].device_id,
								reading: yesterday_end_records[i].reading,
								insert_time: yesterday_end_records[i].insert_time,
							};
						}
					}

					let daily_insert_query =
						"INSERT INTO daily_consumption (device_id, reading, consumption, reading_time, insert_time) VALUES ";
					let daily_insert_sub_query = "";

					for (let i = 0; i < tld_records.length; i++) {
						let daily_reading, daily_consumption, daily_reading_time;

						let dev_id_ysd_exist = tld_records[i].device_id in yesterday_start_data;
						let dev_id_yed_exist = tld_records[i].device_id in yesterday_end_data;

						if (dev_id_ysd_exist && dev_id_yed_exist) {
							daily_consumption =
								parseFloat(yesterday_end_data[tld_records[i].device_id].reading) -
								parseFloat(yesterday_start_data[tld_records[i].device_id].reading);

							daily_reading = yesterday_end_data[tld_records[i].device_id].reading;
							daily_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
						} else if (dev_id_ysd_exist && !dev_id_yed_exist) {
							// device is offline
							daily_consumption = 0;
							daily_reading = tld_records[i].reading;
							daily_reading_time = tld_records[i].update_time;
						} else if (!dev_id_ysd_exist && dev_id_yed_exist) {
							// no previous reading to subtract
							daily_consumption = yesterday_end_data[tld_records[i].device_id].reading;
							daily_reading = yesterday_end_data[tld_records[i].device_id].reading;
							daily_reading_time = yesterday_end_data[tld_records[i].device_id].insert_time;
						} else {
							// data never received
							daily_consumption = 0;
							daily_reading = tld_records[i].reading;
							daily_reading_time = tld_records[i].update_time;
						}

						daily_insert_sub_query += `('${tld_records[i].device_id}', ${daily_reading}, ${daily_consumption}, '${daily_reading_time}', '${yesterday}'), `;
					}

					daily_insert_sub_query = daily_insert_sub_query.slice(0, -2);
					daily_insert_query += daily_insert_sub_query;
					daily_insert_query += ";";

					// run queries
					let daily_insert_results = await doQuery(daily_insert_query);
					console.log(`Total missed daily data rows inserted: ${daily_insert_results.affectedRows}`);
				} else {
					console.log(`All the daily data has already been added`);
				}

				console.timeEnd("time_taken_4");
			} // missed daily data else
		} // else if
	} catch (err) {
		console.log("Error is: ", err);
	}
});

console.log(`Water consumption script running`);
