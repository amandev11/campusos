import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/store/ThemeProvider';
import { AuthProvider } from '@/store/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { AppRoutes } from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing from index.html');

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
