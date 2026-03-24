import axios from 'axios';

const API = process.env.EXPO_PUBLIC_SENSOR_API_URL || "http://10.157.70.174/temp"; // replace IP

export const getTemperature = async () => {
  try {
    const res = await axios.get(API, { timeout: 3000 });
    return res.data.temperature;
  } catch (error) {
    throw error;
  }
};