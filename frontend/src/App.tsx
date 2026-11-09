import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResendVerificationPage } from './pages/ResendVerificationPage';
import { ProfilePage } from './pages/ProfilePage';
import { UrlsPage } from './pages/UrlsPage';
import { TagsPage } from './pages/TagsPage';
import { PasswordChallengePage } from './pages/PasswordChallengePage';
import { RedirectPage } from './pages/RedirectPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '671534648137-qi5mvbmdf3paikng3stn3dnosv2bv3rs.apps.googleusercontent.com';

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes (Redirect to / if already logged in) */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/resend-verification" element={<ResendVerificationPage />} />
              </Route>

              {/* Public Short Link Redirection & Password Challenge */}
              <Route path="/p/*" element={<PasswordChallengePage />} />
              <Route path="/r/*" element={<RedirectPage />} />

              {/* Protected URL Shortener & Profile Routes (Require Authentication) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<UrlsPage />} />
                <Route path="/urls" element={<Navigate to="/" replace />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/tags" element={<TagsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Direct shortId & nested custom path matching */}
              <Route path="/*" element={<RedirectPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
