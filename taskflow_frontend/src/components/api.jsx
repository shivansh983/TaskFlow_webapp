import axios from 'axios';

// Automatically switches between local and production URLs

//  baseURL to include the /api/ prefix
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:8000/api' 
  : 'https://taskflow-webapp.onrender.com/api'; 

const api = axios.create({
  baseURL: API_URL,
});


// Interceptor to attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth Endpoints
export const login = (username, password) => 
  api.post('/token/', { username, password }); // Matches your Django URL

// Project Endpoints
export const getProjects = () => 
  api.get('/projects/');

export const createProject = (data) => 
  api.post('/projects/', data);

export default api;
