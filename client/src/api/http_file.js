const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiFileUploadRequest(path, { token, body, method, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: method,
    body: body
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
