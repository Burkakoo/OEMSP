import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from '@store/index';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { LocalizationProvider } from './context/LocalizationContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <LocalizationProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </LocalizationProvider>
    </Provider>
  </React.StrictMode>
);
