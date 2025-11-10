import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Auth from './components/Auth';

const AppContainer = () => {
  // Function to initialize state, including the developer bypass for easier development.
  const initializeAuthState = () => {
    try {
      const userStr = localStorage.getItem('user');
      const isAuthenticatedStr = localStorage.getItem('isAuthenticated');

      // If no user exists (e.g., first-time load or cleared storage),
      // set up the default developer account and log them in automatically.
      if (!userStr) {
        const adminUser = {
          fullName: 'Tsietsi',
          email: 'tsietsi@gmail.com',
        };
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }

      // If a user exists, respect the standard authentication state.
      // This allows the developer to log out and test the login flow.
      return isAuthenticatedStr === 'true';
    } catch (e) {
      console.error("Could not access localStorage", e);
      return false;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(initializeAuthState);

  const handleAuthSuccess = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    // Note: We don't remove the 'user' object on logout.
    // To re-trigger the developer bypass, clear localStorage manually.
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return <App onLogout={handleLogout} />;
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);
