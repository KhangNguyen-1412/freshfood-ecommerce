import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { HelmetProvider } from "react-helmet-async";
import { ToastContainer } from "react-toastify";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        {/* Bọc AppProvider ở ngoài cùng */}
        <AppProvider>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AppProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
