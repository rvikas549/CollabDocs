const trimSlash = (url) => url.replace(/\/+$/, '');

export const API_URL = trimSlash(process.env.REACT_APP_API_URL || 'http://localhost:4000/api');

export const YJS_URL = trimSlash(process.env.REACT_APP_YJS_URL || 'ws://localhost:1234');

/** Firebase sign-in is enabled only when the web config is present. */
export const FIREBASE_ENABLED = Boolean(process.env.REACT_APP_FIREBASE_API_KEY);
