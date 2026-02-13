import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import App from './App';
import { setAuthTokenGetter } from './lib/utils/auth-fetch';
import './styles/globals.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/** Bridges Clerk's session token into the authFetch utility */
function AuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clerkKey ? (
      <ClerkProvider publishableKey={clerkKey}>
        <AuthBridge />
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
