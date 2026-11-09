import React, { useLayoutEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const RedirectPage: React.FC = () => {
  useLayoutEffect(() => {
    // Extract full path after host, stripping leading slashes and any /r/ prefix
    const path = window.location.pathname.replace(/^\/r\//, '').replace(/^\//, '');
    if (path) {
      // Instantly hand off to backend 302 redirect without rendering any intermediate screen
      window.location.replace(`${API_BASE_URL}/${path}`);
    }
  }, []);

  // Return null so no redirecting splash or intermediate loading screen is ever displayed
  return null;
};
