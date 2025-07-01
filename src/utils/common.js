import axios from "axios";

export const API_HOST_TRACCAR = process.env.REACT_APP_URL_API_TRACCAR;
export const API_URL_TRACCAR = API_HOST_TRACCAR + "api/";

export const WSS_INTERCEPTOR = process.env.REACT_APP_URL_WSS_INTERCEPTOR;
export const API_HTTP_INTERCEPTOR =
  process.env.REACT_APP_URL_HTTP_INTERCEPTOR + "api/";

export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Crear una sesión
export function createSession(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Obtener una sesión
export function getSession(key) {
  const sessionData = localStorage.getItem(key);
  if (sessionData) {
    return JSON.parse(sessionData);
  }
  return null;
}

// Actualizar una sesión
export function updateSession(key, value) {
  if (getSession(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Eliminar una sesión
export function deleteSession(key) {
  localStorage.removeItem(key);
}

// Función para codificar un token en Base64
export const encodeBase64 = (username, password) => {
  const token = `${username}:${password}`;
  return btoa(token); // Usar btoa para codificar en Base64
};

// Función para decodificar un token en Base64
export const decodeBase64 = (token) => {
  const decoded = atob(token); // Usar atob para decodificar de Base64
  const [username, password] = decoded.split(":");
  return { username, password };
};

// Crear una instancia de axios con la URL base
const apiTraccar = axios.create({
  baseURL: API_URL_TRACCAR,
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + getSession("SESSION_TOKEN"),
  },
});

// Función para hacer una solicitud GET
export const getTraccar = async (endpoint, params = {}) => {
  try {
    const response = await apiTraccar.get(endpoint, { params });
    return response;
  } catch (error) {
    throw new Error(`Error en la solicitud GET: ${error}`);
  }
};

// Add new function to get events by user devices

// Función para hacer una solicitud POST
export const postTraccar = async (endpoint, data) => {
  try {
    const response = await apiTraccar.post(endpoint, data);
    return response;
  } catch (error) {
    throw new Error(`Error en la solicitud POST: ${error}`);
  }
};

// Función para hacer una solicitud DELETE
export const delTraccar = async (endpoint) => {
  try {
    const response = await apiTraccar.delete(endpoint);
    return response;
  } catch (error) {
    throw new Error(`Error en la solicitud DELETE: ${error}`);
  }
};

export const delTraccarWithPayload = async (endpoint, data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Se requiere un objeto data para delTraccarWithPayload.");
  }
  try {
    // axios.delete(url, config)
    // Pasamos el data dentro del objeto de configuración en la propiedad 'data'
    const response = await apiTraccar.delete(endpoint, {
      data: data, // ¡Aquí es donde se añade el data!
    });
    return response; // Devuelve el objeto de respuesta completo de Axios
  } catch (error) {
    throw new Error(`Error en la solicitud DELETE: ${error}`);
  }
};

// Función para hacer una solicitud PUT (o PATCH)
export const updateTraccar = async (endpoint, data) => {
  try {
    const response = await apiTraccar.put(endpoint, data); // Usa api.patch si prefieres PATCH
    return response;
  } catch (error) {
    throw new Error(`Error en la solicitud PUT: ${error}`);
  }
};
