import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { store } from './app/store.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter><App /></BrowserRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
