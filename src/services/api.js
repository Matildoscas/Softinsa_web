/*
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://softinsa-api.onrender.com/api' // O endereço real da API no Render
});

// 🎯 INTERCEPTOR: Injeta automaticamente o Token JWT em todas as chamadas HTTP
api.interceptors.request.use(
  async (config) => {
    // 1. Vai buscar o token armazenado no localStorage durante o Login.jsx
    const token = localStorage.getItem('token');
    
    // 2. Se o token existir, injeta-o no cabeçalho com o padrão "Bearer token"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Tratamento de erro caso o pedido falhe antes de sair do browser
    return Promise.reject(error);
  }
);

export default api;
*/

import axios from 'axios';

const api = axios.create({
  // 🛑 COMENTADO TEMPORARIAMENTE (Para não apagar o link da Render):
  // baseURL: 'https://softinsa-api.onrender.com/api' 

  // 🚀 ATIVADO LOCALMENTE: Aponta para o teu servidor Node.js que corre no teu PC
  baseURL: 'http://localhost:3000/api' 
});

// 🎯 INTERCEPTOR: Injeta automaticamente o Token JWT em todas as chamadas HTTP
api.interceptors.request.use(
  async (config) => {
    // 1. Vai buscar o token armazenado no localStorage durante o Login.jsx
    const token = localStorage.getItem('token');
    
    // 2. Se o token existir, injeta-o no cabeçalho com o padrão "Bearer token"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Tratamento de erro caso o pedido falhe antes de sair do browser
    return Promise.reject(error);
  }
);

export default api;