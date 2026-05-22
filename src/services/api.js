import axios from 'axios';

const api = axios.create({
  baseURL: 'https://softinsa-api.onrender.com' //  O endereço real da tua API no Render!
});

export default api;