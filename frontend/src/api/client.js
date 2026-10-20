const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function request(endpoint, options = {}) {
  const { params, headers = {}, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders = {
    'Accept': 'application/json, text/plain, */*',
    ...headers,
  };

  if (restOptions.body && typeof restOptions.body === 'object' && !(restOptions.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    restOptions.body = JSON.stringify(restOptions.body);
  }

  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      ...restOptions,
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'string' && data) ||
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status} (${response.statusText})`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const netError = new Error(`Unable to connect to backend API (${API_BASE_URL}). If your backend is hosted on a free tier (e.g. Render), it may take 30-60 seconds to spin up from sleep. Please wait a moment and try again.`);
      netError.status = 0;
      throw netError;
    }
    throw error;
  }
}

export const apiClient = {
  get: (endpoint, params = null) => request(endpoint, { method: 'GET', params }),
  post: (endpoint, body = null, params = null) => request(endpoint, { method: 'POST', body, params }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default apiClient;
