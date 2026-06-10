import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from "react-router-dom"
import { ToastProvider } from "./components/common/Toast/ToastContext";
import { applyTheme } from "./store/themeStore";

applyTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <ToastProvider>
      <App />
    </ToastProvider>
  </BrowserRouter>
  </React.StrictMode>,
)