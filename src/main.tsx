import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AgridirectProvider } from './context/AgridirectContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AgridirectProvider>
      <App />
    </AgridirectProvider>
  </React.StrictMode>
);

