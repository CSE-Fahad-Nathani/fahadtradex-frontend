import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useUserStore } from "./store/userStore";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Documentation from "./pages/Documentation/Documentation";

import Dashboard from "./pages/Dashboard/Dashboard";
import Watchlist from "./pages/Watchlist/Watchlist";
import Position from "./pages/Position/Position";

import MainLayout from "./components/layout/MainLayout";
import FullScreenLoader from "./components/common/FullScreenLoader";
import Portfolio from "./pages/Portfolio/Portfolio";
import Orders from "./pages/Orders/Orders";
import OrderHistory from "./pages/OrderHistory/OrderHistory";

import StockPreviewPage from "./pages/StockPreviewPage";
import PrivateRoute from "./components/common/PrivateRoute";

import { fetchUserData } from "./services/user.service";





function App() {
  const [loadingLoginLoader, setLoadingLoginLoader] = useState(false);
  const [triggerWatchlistUpdate, setTriggerWatchlistUpdate] = useState(0);
  const [triggerPositionUpdate, setTriggerPositionUpdate] = useState(0);

  // ✅ keep this (auto close fallback)
  useEffect(() => {
    if (!loadingLoginLoader) return;

    const timer = setTimeout(() => {
      setLoadingLoginLoader(false);
    }, 3100);

    return () => clearTimeout(timer);
  }, [loadingLoginLoader]);


  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div className="bg-primaryBg text-textPrimary min-h-screen">
      
      {/* Global Loader */}
      <FullScreenLoader isVisible={loadingLoginLoader} />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <Login
              setLoadingLoginLoader={setLoadingLoginLoader}
              loadingLoginLoader={loadingLoginLoader}
            />
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/documentation" element={<Documentation />} />

        {/* App Layout (Protected) */}
        <Route element={<PrivateRoute />}>
        <Route element={<MainLayout  triggerWatchlistUpdate={triggerWatchlistUpdate} setTriggerWatchlistUpdate={setTriggerWatchlistUpdate} triggerPositionUpdate={triggerPositionUpdate} setTriggerPositionUpdate={setTriggerPositionUpdate} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/watchlist" element={<Watchlist triggerWatchlistUpdate={triggerWatchlistUpdate} setTriggerWatchlistUpdate={setTriggerWatchlistUpdate} />} />
          <Route path="/position" element={<Position triggerPositionUpdate={triggerPositionUpdate} setTriggerPositionUpdate={setTriggerPositionUpdate} />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orderHistory" element={<OrderHistory />} />

          <Route
            path="/stock/:exch/:exchType/:scripCode/:symbol"
            element={<StockPreviewPage />}
          />
        </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;