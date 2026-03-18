// Helper para manejar autenticación
export const getAuthToken = () => {
  // Primero intentar obtener desde sessionStorage (fallback)
  const fallbackToken = sessionStorage.getItem('auth_token');
  if (fallbackToken) {
    return fallbackToken;
  }
  return null;
};

export const setAuthToken = (token) => {
  // Guardar token como fallback para cross-origin
  sessionStorage.setItem('auth_token', token);
};

export const removeAuthToken = () => {
  sessionStorage.removeItem('auth_token');
};

export const createAuthenticatedFetch = (baseUrl) => {
  return async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Agregar token si existe
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${baseUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include', // Mantener cookies por si acaso
    });
  };
};
