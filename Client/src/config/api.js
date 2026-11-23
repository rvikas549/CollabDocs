import axios from 'axios';
import { API_URL } from './env';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

let getToken = async () => null;
let onUnauthorized = () => {};

/** Called by AuthProvider so every request carries a fresh token. */
export function configureAuth(options) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized || (() => {});
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) onUnauthorized(error);
    return Promise.reject(error);
  }
);

/** Turns any API / network error into a friendly sentence. */
export function apiError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.code === 'ERR_NETWORK') return `Can't reach the server at ${API_URL}. Is the API running?`;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  return error?.message || fallback;
}

export default api;
