/**
 * Base API configuration and utilities
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
};

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Get response text first to handle HTML errors
  const responseText = await response.text();
  
  // Try to parse as JSON, if fails, it's probably HTML
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    // If we can't parse JSON, the server returned HTML (error page)
    console.error('API Error Response:', responseText);
    throw new Error(`Server returned ${response.status}: ${response.statusText}. Response: ${responseText.substring(0, 200)}...`);
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'An error occurred');
  }

  return data;
};

export default apiRequest;
