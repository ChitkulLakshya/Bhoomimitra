import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AlarmProvider } from './context/AlarmContext.jsx';
import { CropProvider } from './context/CropContext.jsx';
import { SoilProvider } from './context/SoilContext.jsx';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <SoilProvider>
          <CropProvider>
            <AlarmProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AlarmProvider>
          </CropProvider>
        </SoilProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
