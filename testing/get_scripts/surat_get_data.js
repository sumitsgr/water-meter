"use strict";

import "dotenv/config";
import { DateTime, Settings } from "luxon";
import mysql from "mysql";
import fs from "fs";
import path, { dirname } from "path";
import express, { json } from "express";
import { fileURLToPath } from "url";

Settings.defaultZone = process.env.SCRIPT_TIMEZONE;
const app = express();
const location = "chandigarh";
app.use(json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let connection = mysql.createPool({
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
	connectionLimit: 50,
	// multipleStatements: true,
	dateStrings: ["DATE", "DATETIME"],
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

function pad(str, max) {
	str = str.toString();
	return str.length < max ? pad("0" + str, max) : str;
}

function split_every_n(str, n, arr = []) {
	if (str.length === 0) {
		return arr;
	}

	arr.push(str.slice(0, n));
	return split_every_n(str.slice(n), n, arr);
}

function hex_to_dec(hex_str) {
	let hex_arr = split_every_n(hex_str, 2);

	return parseInt(pad(hex_arr.reverse().join(""), 4), 16);
}

function hex_to_binary(input) {
	let binary_result = "";
	for (let i = 0; i < input.length; i++) {
		/*Using parseInt to get the decimal value of the given String*/
		let decimal_value = parseInt(input[i], 16);

		/*Using decimal_value to get the binary String of given integer*/
		let binary_string = decimal_value.toString(2);

		/* Calculating the length of the binary number with leading zeroes */
		let len = 4 * (Math.floor(binary_string.length / 4) + (binary_string.length % 4 ? 1 : 0));

		binary_result += binary_string.padStart(len, "0");
	}

	return binary_result;
}

function decode_axioma_payload(axioma_pl) {
	let current_date = DateTime.fromSeconds(hex_to_dec(axioma_pl.slice(0, 8))).toFormat("yyyy-MM-dd HH:mm:ss");

	let current_volume = hex_to_dec(axioma_pl.slice(10, 18)) / 1000;

	// console.log("::: ::: ::: current_date ::: ::: :::", current_date, typeof current_date);
	// console.log("::: ::: ::: current_volume ::: ::: :::", current_volume, typeof current_volume);

	let data_arr = [];
	let log_date = DateTime.fromSeconds(hex_to_dec(axioma_pl.slice(18, 26)));
	let log_volume = hex_to_dec(axioma_pl.slice(26, 34)) / 1000;

	data_arr.push({
		date: log_date.toFormat("yyyy-MM-dd HH:mm:ss"),
		volume: log_volume,
	});

	// console.log("::: ::: ::: log_date ::: ::: :::", log_date.toFormat("yyyy-MM-dd HH:mm:ss"), typeof log_date);
	// console.log("::: ::: ::: log_volume ::: ::: :::", log_volume, typeof log_volume);

	let total_vol = log_volume;
	let total_mins = 60;

	let start_index = 34;
	for (let i = 0; i < 15; i++) {
		let del_vol = hex_to_dec(axioma_pl.slice(start_index, start_index + 4)) / 1000;
		start_index += 4;

		// console.log(`i: ${i}, del_vol: ${del_vol}`);

		total_vol += del_vol;
		data_arr.push({
			date: log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
			volume: total_vol,
		});

		total_mins += 60;
	}

	data_arr.push({
		date: current_date,
		volume: current_volume,
	});

	return data_arr;

	// all values expanded
	/* let del_vol_1 = HexToRevDecimal(ax_100_pl.payload.substr(34, 4)) / 1000;
	total_vol += del_vol_1;
	console.log(
		"::: ::: ::: del_vol_1 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_1
	);

	total_mins += 60;
	let del_vol_2 = HexToRevDecimal(ax_100_pl.payload.substr(38, 4)) / 1000;
	total_vol += del_vol_2;
	console.log(
		"::: ::: ::: del_vol_2 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_2
	);

	total_mins += 60;
	let del_vol_3 = HexToRevDecimal(ax_100_pl.payload.substr(42, 4)) / 1000;
	total_vol += del_vol_3;
	console.log(
		"::: ::: ::: del_vol_3 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_3
	);

	total_mins += 60;
	let del_vol_4 = HexToRevDecimal(ax_100_pl.payload.substr(46, 4)) / 1000;
	total_vol += del_vol_4;
	console.log(
		"::: ::: ::: del_vol_4 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_4
	);

	total_mins += 60;
	let del_vol_5 = HexToRevDecimal(ax_100_pl.payload.substr(50, 4)) / 1000;
	total_vol += del_vol_5;
	console.log(
		"::: ::: ::: del_vol_5 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_5
	);

	total_mins += 60;
	let del_vol_6 = HexToRevDecimal(ax_100_pl.payload.substr(54, 4)) / 1000;
	total_vol += del_vol_6;
	console.log(
		"::: ::: ::: del_vol_6 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_6
	);

	total_mins += 60;
	let del_vol_7 = HexToRevDecimal(ax_100_pl.payload.substr(58, 4)) / 1000;
	total_vol += del_vol_7;
	console.log(
		"::: ::: ::: del_vol_7 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_7
	);

	total_mins += 60;
	let del_vol_8 = HexToRevDecimal(ax_100_pl.payload.substr(62, 4)) / 1000;
	total_vol += del_vol_8;
	console.log(
		"::: ::: ::: del_vol_8 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_8
	);

	total_mins += 60;
	let del_vol_9 = HexToRevDecimal(ax_100_pl.payload.substr(66, 4)) / 1000;
	total_vol += del_vol_9;
	console.log(
		"::: ::: ::: del_vol_9 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_9
	);

	total_mins += 60;
	let del_vol_10 = HexToRevDecimal(ax_100_pl.payload.substr(70, 4)) / 1000;
	total_vol += del_vol_10;
	console.log(
		"::: ::: ::: del_vol_10 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_10
	);

	total_mins += 60;
	let del_vol_11 = HexToRevDecimal(ax_100_pl.payload.substr(74, 4)) / 1000;
	total_vol += del_vol_11;
	console.log(
		"::: ::: ::: del_vol_11 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_11
	);

	total_mins += 60;
	let del_vol_12 = HexToRevDecimal(ax_100_pl.payload.substr(78, 4)) / 1000;
	total_vol += del_vol_12;
	console.log(
		"::: ::: ::: del_vol_12 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_12
	);

	total_mins += 60;
	let del_vol_13 = HexToRevDecimal(ax_100_pl.payload.substr(82, 4)) / 1000;
	total_vol += del_vol_13;
	console.log(
		"::: ::: ::: del_vol_13 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_13
	);

	total_mins += 60;
	let del_vol_14 = HexToRevDecimal(ax_100_pl.payload.substr(86, 4)) / 1000;
	total_vol += del_vol_14;
	console.log(
		"::: ::: ::: del_vol_14 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_14
	);

	total_mins += 60;
	let del_vol_15 = HexToRevDecimal(ax_100_pl.payload.substr(90, 4)) / 1000;
	total_vol += del_vol_15;
	console.log(
		"::: ::: ::: del_vol_15 ::: ::: :::",
		log_date.plus({ minutes: total_mins }).toFormat("yyyy-MM-dd HH:mm:ss"),
		total_vol,
		typeof del_vol_15
	); */
}

function decode_axioma_status(axioma_pl) {
	let payload_timestamp = DateTime.fromSeconds(hex_to_dec(axioma_pl.slice(0, 8))).toFormat("yyyy-MM-dd HH:mm:ss");
	let status = axioma_pl.slice(8, 10);

	if (status === "00") {
		return null;
	} else {
		let hex_to_bin = hex_to_binary(status);
		let hex_to_bin_rev = [...hex_to_bin].reverse();
		// console.log("::: ::: ::: payload_timestamp ::: ::: :::", payload_timestamp);
		// console.log("::: status :::", status, "::: binary :::", hex_to_bin, "::: reverse binary :::", hex_to_bin_rev);

		let result = {};

		result.timestamp = payload_timestamp;

		if (parseInt(hex_to_bin_rev[2]) === 1) {
			result.low_battery = 1;
		}

		if (parseInt(hex_to_bin_rev[3]) === 1) {
			result.permanent = 1;
		}

		// If more than one temporary error occurs, status shows only one, by priority.
		// Temporary errors priority: freeze; leakage; burst; negative flow;
		// Empty pipe is shown only if there are no other Temporary errors present.
		if (
			parseInt(hex_to_bin_rev[4]) === 1 &&
			parseInt(hex_to_bin_rev[5]) !== 1 &&
			parseInt(hex_to_bin_rev[6]) !== 1 &&
			parseInt(hex_to_bin_rev[7]) !== 1
		) {
			result.empty_pipe = 1;
		}

		if (parseInt(hex_to_bin_rev[5]) === 1 && parseInt(hex_to_bin_rev[6]) === 1) {
			result.backflow = 1;
		}

		if (parseInt(hex_to_bin_rev[5]) === 1 && parseInt(hex_to_bin_rev[7]) === 1) {
			result.burst = 1;
		}

		if (
			parseInt(hex_to_bin_rev[5]) === 1 &&
			parseInt(hex_to_bin_rev[6]) !== 1 &&
			parseInt(hex_to_bin_rev[7]) !== 1
		) {
			result.leakage = 1;
		}

		if (parseInt(hex_to_bin_rev[7]) === 1 && parseInt(hex_to_bin_rev[5]) !== 1) {
			result.freeze = 1;
		}

		return result;
	}
}

app.post("/data_up", async (req, res) => {
	try {
		let today = DateTime.local();
		console.log("\n:: :: :: :: :: :: :: :: :: :: :: :: ::\n");
		console.log(`Date: ${today.toFormat("DDD")}, Time: ${today.toFormat("ttt")}`);

		let gateway_data = req.body;
		console.log("\ndata_up endpoint request received: " + JSON.stringify(gateway_data));

		let file_text = "";

		if (gateway_data.endDevice.devEui) {
			// devEui existence check
			let read_device = await doQuery(
				"SELECT md.device_id, md.meter_type FROM master_device md INNER JOIN trans_last_data tld ON md.device_id = tld.device_id WHERE md.device_id = ?;",
				gateway_data.endDevice.devEui
			);

			console.log(
				`device existence check #${read_device.length}:`,
				read_device.length > 0 ? "device found" : "device not found"
			);

			if (read_device.length > 0) {
				let meter_type = read_device[0].meter_type;
				let insert_values = {};

				if (meter_type.toLowerCase() === "axioma" && parseInt(gateway_data.fPort) === 100) {
					let decoded_data = decode_axioma_payload(gateway_data.payload);
					let latest_data = decoded_data[decoded_data.length - 1];

					let decoded_status = decode_axioma_status(gateway_data.payload);

					insert_values = {
						device_id: gateway_data.endDevice.devEui,
						battery_status: 3.6,
						payload: gateway_data.payload,
						reading: latest_data.volume,
						credit: 0,
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
						timestamp: latest_data.date,
						status: 1,

						// low_battery: decoded_status.low_battery ? 1 : 0,
						// perm_error: decoded_status.permanent ? 1 : 0,
						// temp_error: decoded_status.temporary ? 1 : 0,
						// backflow_error: decoded_status.backflow ? 1 : 0,
						// burst_error: decoded_status.burst ? 1 : 0,
						// leakage_error: decoded_status.leakage ? 1 : 0,
						// freeze_error: decoded_status.freeze ? 1 : 0,
					};

					if (decoded_status === null) {
						// insert into db
						let message;
						await Promise.all([
							doQuery(
								"INSERT INTO trans_received_data SET ?, trans_id = 1, alarms = ?, insert_time = NOW();",
								[insert_values, decoded_status]
							),
							doQuery(
								"UPDATE trans_last_data SET ?, alarms = ?, update_time = NOW() WHERE device_id = ?;",
								[insert_values, decoded_status, gateway_data.endDevice.devEui]
							),
						]).then((values) => {
							message = `records added: ${values[0].affectedRows}, records updated: ${values[1].changedRows}`;
						});

						console.log("message: ", message);
					} else {
						decoded_status.fport = 100;
						delete decoded_status.timestamp;
						// decoded_status.timestamp = latest_data.date;

						// insert into db
						let message;
						await Promise.all([
							doQuery(
								"INSERT INTO trans_received_data SET ?, trans_id = 1, alarms = ?, insert_time = NOW();",
								[insert_values, JSON.stringify(decoded_status)]
							),
							doQuery(
								"UPDATE trans_last_data SET ?, alarms = ?, update_time = NOW() WHERE device_id = ?;",
								[insert_values, JSON.stringify(decoded_status), gateway_data.endDevice.devEui]
							),
						]).then((values) => {
							message = `records added: ${values[0].affectedRows}, records updated: ${values[1].changedRows}`;
						});

						console.log("message: ", message);
					}

					let file_name = DateTime.local().toFormat("yyyy_MM_dd") + `_${location}_uplink_fport100.txt`;

					// create a log file
					file_text += `\r\n { Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
						"ttt"
					)}, Gateway_Data: ${JSON.stringify(gateway_data)} }`;

					// /home/chandigarhuser/public_html/logs

					if (fs.existsSync(path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`))) {
						fs.appendFileSync(
							path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`),
							"\r\n" + `--- --- --- --- --- --- --- --- --- --- --- ---\n` + file_text,
							function (err1) {
								if (err1) console.log("Error while writing in a text file:", err1);
							}
						);
					} else {
						fs.writeFileSync(
							path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`),
							`--- New Log File, Date: ${DateTime.local().toFormat(
								"DDD"
							)}, Time: ${DateTime.local().toFormat("ttt")} ---` + file_text,
							function (err2) {
								if (err2) console.log("Error while writing in a text file:", err2);
							}
						);
					}
				} else if (meter_type.toLowerCase() === "axioma" && parseInt(gateway_data.fPort) === 103) {
					let decoded_status = decode_axioma_status(gateway_data.payload);

					if (decoded_status === null) {
						let insert_result = await doQuery(
							"INSERT INTO device_alarms SET deveui = ?, payload = ?, alarms = ?, record_time = NOW();",
							[gateway_data.endDevice.devEui, gateway_data.payload, decoded_status]
						);

						console.log("devEui found in DB, fPort = 103:", insert_result.affectedRows);
					} else {
						decoded_status.fport = 103;

						let insert_result = await doQuery(
							"INSERT INTO device_alarms SET deveui = ?, payload = ?, alarms = ?, record_time = NOW();",
							[gateway_data.endDevice.devEui, gateway_data.payload, JSON.stringify(decoded_status)]
						);

						console.log("devEui found in DB, fPort = 103:", insert_result.affectedRows);
					}

					let file_name = DateTime.local().toFormat("yyyy_MM_dd") + `_${location}_uplink_fport103.txt`;

					file_text += `\r\n { Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
						"ttt"
					)}, Gateway_Data: ${JSON.stringify(gateway_data)} }`;

					if (fs.existsSync(path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`))) {
						fs.appendFileSync(
							path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`),
							"\r\n" + `--- --- --- --- --- --- --- --- --- --- --- ---\n` + file_text,
							function (err1) {
								if (err1) console.log("Error while writing in a text file:", err1);
							}
						);
					} else {
						fs.writeFileSync(
							path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`),
							`--- New Log File, Date: ${DateTime.local().toFormat(
								"DDD"
							)}, Time: ${DateTime.local().toFormat("ttt")} ---` + file_text,
							function (err2) {
								if (err2) console.log("Error while writing in a text file:", err2);
							}
						);
					}
				} else {
					console.log("devEui found in DB, port not recognized");

					let file_name =
						DateTime.local().toFormat("yyyy_MM_dd") + `_${location}_uplink_deveui_found_else.txt`;

					file_text += `\r\n { Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
						"ttt"
					)}, Gateway_Data: ${JSON.stringify(gateway_data)} }`;

					if (fs.existsSync(path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`))) {
						fs.appendFileSync(
							path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`),
							"\r\n" + `--- --- --- --- --- --- --- --- --- --- --- ---\n` + file_text,
							function (err1) {
								if (err1) console.log("Error while writing in a text file:", err1);
							}
						);
					} else {
						fs.writeFileSync(
							path.normalize(__dirname + "/../public_html/logs" + `/${file_name}`),
							`--- New Log File, Date: ${DateTime.local().toFormat(
								"DDD"
							)}, Time: ${DateTime.local().toFormat("ttt")} ---` + file_text,
							function (err2) {
								if (err2) console.log("Error while writing in a text file:", err2);
							}
						);
					}
				}
			} else {
				// devEui not found in the DB

				let file_404 = DateTime.local().toFormat("yyyy_MM_dd") + `_${location}_uplink_deveui_not_found.txt`;

				file_text += `\r\n { Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
					"ttt"
				)}, Gateway_Data: ${JSON.stringify(gateway_data)} }`;

				if (fs.existsSync(path.normalize(__dirname + "/../public_html/logs" + `/${file_404}`))) {
					fs.appendFileSync(
						path.normalize(__dirname + "/../public_html/logs" + `/${file_404}`),
						"\r\n" + `--- --- --- --- --- --- --- --- --- --- --- ---\n` + file_text,
						function (err1) {
							if (err1) console.log("Error while writing in a text file:", err1);
						}
					);
				} else {
					fs.writeFileSync(
						path.normalize(__dirname + "/../public_html/logs" + `/${file_404}`),
						`--- New Log File, Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
							"ttt"
						)} ---` + file_text,
						function (err2) {
							if (err2) console.log("Error while writing in a text file:", err2);
						}
					);
				}
			}
		} else if (gateway_data.gwEui) {
			console.log(">>> >>> gateway_data.gwEui <<< <<<<");

			gateway_data.devClass;
			gateway_data.devEui;
			gateway_data.freq; // decimal(10, 5)
			gateway_data.gwEui;
			gateway_data.ismBand;
			DateTime.fromISO(gateway_data.txtime).toFormat("yyyy-MM-dd HH:mm:ss");

			let file_gweui = DateTime.local().toFormat("yyyy_MM_dd") + `_${location}_uplink_gweui.txt`;

			file_text += `\r\n { Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
				"ttt"
			)}, Gateway_Data: ${JSON.stringify(gateway_data)} }`;

			if (fs.existsSync(path.normalize(__dirname + "/../public_html/logs" + `/${file_gweui}`))) {
				fs.appendFileSync(
					path.normalize(__dirname + "/../public_html/logs" + `/${file_gweui}`),
					"\r\n" + `--- --- --- --- --- --- --- --- --- --- --- ---\n` + file_text,
					function (err1) {
						if (err1) console.log("Error while writing in a text file:", err1);
					}
				);
			} else {
				fs.writeFileSync(
					path.normalize(__dirname + "/../public_html/logs" + `/${file_gweui}`),
					`--- New Log File, Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
						"ttt"
					)} ---` + file_text,
					function (err2) {
						if (err2) console.log("Error while writing in a text file:", err2);
					}
				);
			}

			/** 
             * 
             * SELECT id, devClass, devEui, freq, ismBand, txtime, insert_time, get_gateways.* 
                FROM device_details,
                JSON_TABLE(
                gateways,
                '$[*]' COLUMNS (
                gwEui varchar(20) PATH '$.gwEui',
                timestamp datetime PATH '$.timestamp'
                )
                ) get_gateways
                WHERE get_gateways.gwEui = "ECFAF40001000052";
            * 
            * 
            * INSERT INTO device_details(devClass, devEui, freq, gateways, ismBand, txtime, insert_time) VALUES 
                (
                "A", "42594C0201225669", 865.4025000000000318323145620524883270263671875, JSON_ARRAY( 
                JSON_OBJECT("gwEui", "ECFAF400010000AD", "timestamp", DATE_FORMAT(NOW(), "%Y-%m-%d %H:%i:%s"))
                ), "IN865", "2023-12-04 11:31:48", DATE_FORMAT(NOW(), "%Y-%m-%d %H:%i:%s")
                );
            * 
            * 
            * UPDATE device_details 
                SET gateways = JSON_ARRAY_APPEND(gateways, '$', JSON_OBJECT("gwEui", "ECFAF40001000052", "timestamp", DATE_FORMAT(NOW(), "%Y-%m-%d %H:%i:%s")))
                WHERE devEui = "42594C0201225557";
            * 
            * 
            * UPDATE `device_details` 
                SET gateways = JSON_ARRAY( 
                JSON_OBJECT("gwEui", "ECFAF40001000050", "timestamp", DATE_FORMAT(NOW(), "%Y-%m-%d %H:%i:%s")), 
                JSON_OBJECT("gwEui", "ECFAF40001000051", "timestamp", DATE_FORMAT(NOW(), "%Y-%m-%d %H:%i:%s"))
                ) 
                WHERE id = 1;
            * 
            */
		} else {
			// Create another log file
			console.log(">>> >>> MISSING DATA ELSE <<< <<<<");

			let file_else = DateTime.local().toFormat("yyyy_MM_dd") + `_${location}_uplink_payload_not_recognized.txt`;

			file_text += `\r\n { Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
				"ttt"
			)}, Gateway_Data: ${JSON.stringify(gateway_data)} }`;

			if (fs.existsSync(path.normalize(__dirname + "/../public_html/logs" + `/${file_else}`))) {
				fs.appendFileSync(
					path.normalize(__dirname + "/../public_html/logs" + `/${file_else}`),
					"\r\n" + `--- --- --- --- --- --- --- --- --- --- --- ---\n` + file_text,
					function (err1) {
						if (err1) console.log("Error while writing in a text file:", err1);
					}
				);
			} else {
				fs.writeFileSync(
					path.normalize(__dirname + "/../public_html/logs" + `/${file_else}`),
					`--- New Log File, Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
						"ttt"
					)} ---` + file_text,
					function (err2) {
						if (err2) console.log("Error while writing in a text file:", err2);
					}
				);
			}
		}

		// res.send(JSON.stringify({ error: 0, message: "Task Added Successfully!", result: 1 }));

		res.send({
			error: 0,
			message: "Data successfully stored!",
		});
	} catch (error) {
		console.log("Error: ", error);
	}
});

app.post("/data_down", async (req, res) => {
	try {
		let today = DateTime.local();
		console.log(`Date: ${today.toFormat("DDD")}, Time: ${today.toFormat("ttt")}`);

		let gateway_data = req.body;
		console.log("data_up endpoint request received" + gateway_data);

		let downlink_file = DateTime.local().toFormat("yyyy_MM_dd") + `_${location}_downlink.txt`;

		file_text += `\r\n { Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
			"ttt"
		)}, Gateway_Data: ${JSON.stringify(gateway_data)} }`;

		if (fs.existsSync(path.normalize(__dirname + "/../public_html/logs" + `/${downlink_file}`))) {
			fs.appendFileSync(
				path.normalize(__dirname + "/../public_html/logs" + `/${downlink_file}`),
				"\r\n" + `--- --- --- --- --- --- --- --- --- --- --- ---\n` + file_text,
				function (err1) {
					if (err1) console.log("Error while writing in a text file:", err1);
				}
			);
		} else {
			fs.writeFileSync(
				path.normalize(__dirname + "/../public_html/logs" + `/${downlink_file}`),
				`--- New Log File, Date: ${DateTime.local().toFormat("DDD")}, Time: ${DateTime.local().toFormat(
					"ttt"
				)} ---` + file_text,
				function (err2) {
					if (err2) console.log("Error while writing in a text file:", err2);
				}
			);
		}

		res.send({
			error: 0,
			message: "Data successfully stored!",
		});
	} catch (error) {
		console.log("Error: ", error);
	}
});

app.listen(parseInt(process.env.SCRIPT_PORT), () => {
	console.log(`Server listening on port: ${parseInt(process.env.SCRIPT_PORT)}`);
});

// console.log(
// 	":: :: :: Consumption Decode Result :: :: ::",
// 	decode_axioma_payload(
// 		"cf233b66103800000000503a6638000000000000000000000000000000000000000000000000000000000000000000"
// 	)
// );

// console.log(":: :: :: Status Decode Result :: :: ::", decode_axioma_status("45f92166b0"));
