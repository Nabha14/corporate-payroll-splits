import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import PayrollSafetyBoundary from './PayrollSafetyBoundary.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PayrollSafetyBoundary>
      <App />
    </PayrollSafetyBoundary>
  </React.StrictMode>
);
