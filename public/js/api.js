/**
 * RouteSaver — API Client
 * Centralizes all HTTP calls to the backend REST API.
 */
const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('rs_token');
  }

  function setToken(token) {
    localStorage.setItem('rs_token', token);
  }

  function clearToken() {
    localStorage.removeItem('rs_token');
    localStorage.removeItem('rs_user');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('rs_user'));
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem('rs_user', JSON.stringify(user));
  }

  function isAuthenticated() {
    return !!getToken();
  }

  async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, options);
    const data = await res.json();

    if (res.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }

    if (!data.success) {
      throw new Error(data.message || 'Erro desconhecido');
    }

    return data;
  }

  // ---- Auth ----
  async function register(name, email, password) {
    const data = await request('POST', '/auth/register', { name, email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function login(email, password) {
    const data = await request('POST', '/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    clearToken();
    window.location.href = '/login';
  }

  // ---- Routes ----
  function getRoutes() {
    return request('GET', '/routes');
  }

  function getRoute(id) {
    return request('GET', `/routes/${id}`);
  }

  function createRoute(name, coordinates) {
    return request('POST', '/routes', { name, coordinates });
  }

  function updateRoute(id, name, coordinates) {
    return request('PUT', `/routes/${id}`, { name, coordinates });
  }

  function deleteRoute(id) {
    return request('DELETE', `/routes/${id}`);
  }

  return {
    getToken,
    getUser,
    isAuthenticated,
    register,
    login,
    logout,
    getRoutes,
    getRoute,
    createRoute,
    updateRoute,
    deleteRoute,
  };
})();
