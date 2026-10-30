import React, { useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';

export const RedirectPage: React.FC = () => {
  const { shortId } = useParams<{ shortId: string }>();

  useLayoutEffect(() => {
    if (shortId) {
      // Instantly hand off to backend 302 redirect without rendering any intermediate screen
      window.location.replace(`http://localhost:8080/${shortId}`);
    }
  }, [shortId]);

  // Return null so no redirecting splash or intermediate loading screen is ever displayed
  return null;
};
