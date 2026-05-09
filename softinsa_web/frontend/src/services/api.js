import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000' // O endereço do teu backend Node.js
});

export default api;