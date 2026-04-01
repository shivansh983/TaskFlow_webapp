import axios from 'axios';

const API_URL = 'https://taskflow-webapp.onrender.com/api'; 

const api = axios.create({
  baseURL: API_URL,
});

// IMPORTANT: Ensure your login call has the trailing slash
export const login = (username, password) => 
  api.post('/token/', { username, password }); 

export const signup = (data) => 
  api.post('/register/', data); // Matches your Django api/register/ path

export default api;
