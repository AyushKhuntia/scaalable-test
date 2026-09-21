// Central API helper: attaches the JWT and talks to the Spring Boot backend.
import axios from 'axios';

// Relative URLs: '/api/...' —
//  - dev (`npm start`): handled by the "proxy" in package.json → localhost:8080
//  - docker: nginx proxies /api → backend service (see frontend/nginx.conf)
const api = axios.create();

// attach token to every request
api.interceptors.request.use((config) => {
  const auth = JSON.parse(sessionStorage.getItem('auth') || 'null');
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('auth');
      if (!window.location.hash.includes('login')) window.location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);

export const getAuth = () => JSON.parse(sessionStorage.getItem('auth') || 'null');
export const setAuth = (auth) => sessionStorage.setItem('auth', JSON.stringify(auth));
export const clearAuth = () => sessionStorage.removeItem('auth');

export default api;
