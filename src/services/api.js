
import axios from 'axios';

const api = axios.create({
  // 🛑 COMENTADO AGORA: Servidor de produção na Nuvem
  baseURL: 'https://softinsa-api.onrender.com/api' 

  // 🚀 ATIVADO PARA TESTES LOCAIS: Aponta para o teu PC
  //baseURL: 'http://localhost:3000/api' 
});

const buildUploadUrl = (path) => {
  if (!path) return null;
  if (/^(https?:|data:|blob:|\/\/)/i.test(path)) {
    return path;
  }

  const baseUrl = api.defaults.baseURL || '';
  const apiRoot = baseUrl.replace(/\/api\/?$/, '');
  return path.startsWith('/') ? `${apiRoot}${path}` : `${apiRoot}/${path}`;
};

// O resto do teu código (interceptor) fica exatamente igual...
api.interceptors.request.use(
  async (config) => {
    // 💡 Procura por todos os nomes possíveis que o teu Login possa ter usado
    let token = 
      localStorage.getItem('token') || 
      localStorage.getItem('authToken') || 
      localStorage.getItem('jwt') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('jwt');

    if (!token) {
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          token =
            user?.token ||
            user?.authToken ||
            user?.jwt ||
            user?.accessToken ||
            null;
        }
      } catch {
        token = null;
      }
    }

    token = String(token || "").trim();

    if (
      !token ||
      token === "undefined" ||
      token === "null"
    ) {
      token = "";
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    if (
      token.startsWith("\"") &&
      token.endsWith("\"")
    ) {
      token = token.slice(1, -1).trim();
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["x-access-token"] = token;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);
export { buildUploadUrl };
export default api;


/*
import axios from 'axios';
import {
  resolveDebugEnabledForRequest,
} from './debugMode.js';

const api = axios.create({
  baseURL: 'https://softinsa-api.onrender.com/api'
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

    if (resolveDebugEnabledForRequest()) {
      config.headers['x-debug-mode'] = 'true';
      config.headers['x-debug-scope'] = 'sll';
    } else if (config.headers['x-debug-mode']) {
      delete config.headers['x-debug-mode'];
      delete config.headers['x-debug-scope'];
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