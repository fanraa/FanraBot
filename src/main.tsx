import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to securely attach the login JWT token to all API requests
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('token');
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as any).url || '');

  if (url.includes('/api/') && token) {
    const freshInit = init || {};
    const headers = freshInit.headers || {};

    if (headers instanceof Headers) {
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(headers)) {
      const hasAuth = headers.some(([key]) => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      const hRecord = headers as Record<string, string>;
      if (!hRecord['Authorization'] && !hRecord['authorization']) {
        hRecord['Authorization'] = `Bearer ${token}`;
      }
    }
    init = freshInit;
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
