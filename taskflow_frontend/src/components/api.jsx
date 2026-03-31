import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const login = (username, password) => 
  api.post('/token/', { username, password });

export const getProjects = () => 
  api.get('/projects/');

export const createProject = (data) => 
  api.post('/projects/', data);

export default api;