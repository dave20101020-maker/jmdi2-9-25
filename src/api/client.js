import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for JWT authentication
});

// Request interceptor for adding auth tokens if needed
client.interceptors.request.use(
  (config) => {
    // Add any custom headers or tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Emit global error event for toast notifications
    if (typeof window !== "undefined" && window.dispatchEvent) {
      const message =
        error.response?.data?.message || error.message || "An error occurred";
      window.dispatchEvent(new CustomEvent("api-error", { detail: message }));
    }
    return Promise.reject(error);
  }
);

// GET request
export const get = async (url, config = {}) => {
  const response = await client.get(url, config);
  return response.data;
};

// POST request
export const post = async (url, data = {}, config = {}) => {
  const response = await client.post(url, data, config);
  return response.data;
};

// PUT request
export const put = async (url, data = {}, config = {}) => {
  const response = await client.put(url, data, config);
  return response.data;
};

// DELETE request
export const del = async (url, config = {}) => {
  const response = await client.delete(url, config);
  return response.data;
};

// PATCH request (bonus)
export const patch = async (url, data = {}, config = {}) => {
  const response = await client.patch(url, data, config);
  return response.data;
};

// Export the client instance for custom usage
export default client;
