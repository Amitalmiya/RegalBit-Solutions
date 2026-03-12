import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1A1A25',
              color: '#fff',
              border: '1px solid #343448',
              borderRadius: '12px',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#C8FF00', secondary: '#0A0A0F' },
            },
            error: {
              iconTheme: { primary: '#FF6B6B', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);