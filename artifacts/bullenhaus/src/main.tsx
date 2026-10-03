import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './app/trading/index.css';
import './app/crm/index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
