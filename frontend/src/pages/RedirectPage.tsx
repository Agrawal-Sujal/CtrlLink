import React, { useLayoutEffect } from 'react';
import { buildShortUrl } from '../utils/url';

export const RedirectPage: React.FC = () => {
  useLayoutEffect(() => {
    // Extract full path after host, stripping leading slashes and any /r/ prefix
    const path = window.location.pathname
      .replace(/^\/r\//, '')
      .replace(/^\//, '');
    if (path) {
      // Instantly hand off to backend 302 redirect without rendering any intermediate screen
      window.location.replace(buildShortUrl(path));
    }
  }, []);

  // Return null so no redirecting splash or intermediate loading screen is ever displayed
  return null;
};

export default RedirectPage;
