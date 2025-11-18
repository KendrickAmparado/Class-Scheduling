// Service to fetch current time from World Time API
import axios from 'axios';

const BASE_URL = 'http://worldtimeapi.org/api/timezone';

export async function getCurrentTime(timezone = 'Etc/UTC') {
  try {
    const response = await axios.get(`${BASE_URL}/${timezone}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch time from World Time API');
  }
}