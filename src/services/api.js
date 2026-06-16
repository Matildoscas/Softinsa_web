import axios from "axios";

const api = axios.create({
  baseURL: "https://softinsa-api.onrender.com/api",
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 ||
      error.response?.data?.message === "Token indisponível."
    ) {
      console.warn("Token ausente ou inválido. Faz login novamente.");
    }

    return Promise.reject(error);
  }
);

export default api;