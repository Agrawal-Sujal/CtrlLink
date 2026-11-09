import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

const log = logger.withModule('GoogleAuth');

interface GoogleAuthButtonProps {
  onSuccessCallback?: () => void;
  onErrorCallback?: (errorMsg: string) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccessCallback,
  onErrorCallback,
}) => {
  const { resolvedTheme } = useTheme();
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onErrorCallback?.('Google did not return a valid credential.');
      return;
    }

    try {
      await googleLogin(credentialResponse.credential);
      onSuccessCallback?.();
      navigate('/');
    } catch (err) {
      log.error('Google login failed:', err);
      onErrorCallback?.(
        err instanceof Error ? err.message : 'Google authentication failed. Please try again.'
      );
    }
  };

  const handleError = () => {
    onErrorCallback?.('Google Sign-In was cancelled or failed.');
  };

  return (
    <div className="w-full flex justify-center overflow-hidden rounded-xl shadow-2xs">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme={resolvedTheme === 'dark' ? 'filled_black' : 'outline'}
        shape="rectangular"
        size="large"
        width="100%"
        text="continue_with"
        logo_alignment="center"
      />
    </div>
  );
};

