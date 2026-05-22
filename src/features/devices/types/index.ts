export type Device = {
  id: number;
  device_id: string;
  meter_id: string;
  meter_type?: string;
  cust_name: string;
  cust_address: string;
  mobile_no: string;
  zone_name: string;
  locality_name?: string;
  ward_name: string;
  meter_size: string;
  last_reading: number;
  last_seen: string;
  location_lat: number;
  location_lng: number;
  status: number;
};

export type Consumption = {
  date: string;
  consumption: number;
  opening_reading: number;
  closing_reading: number;
};
