import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import GlobalPnlTracker from "../market/GlobalPnlTracker";
import bg from "../../assets/images/BackgroundImg.png";

function MainLayout( {triggerWatchlistUpdate, setTriggerWatchlistUpdate, triggerPositionUpdate, setTriggerPositionUpdate}) {
  return (
    <div className="flex h-screen bg-primaryBg text-textPrimary">
      <GlobalPnlTracker />
      
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header  triggerWatchlistUpdate={triggerWatchlistUpdate} setTriggerWatchlistUpdate={setTriggerWatchlistUpdate} triggerPositionUpdate={triggerPositionUpdate} setTriggerPositionUpdate={setTriggerPositionUpdate} />

        <main className="relative flex-1 min-h-0 overflow-hidden bg-primaryBg">

          {/* Fixed background layers */}
          <div
            className="pointer-events-none absolute inset-0 main-bg-image transition-opacity duration-300"
            style={{
              backgroundImage: `url(${bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 backdrop-blur-sm transition-colors duration-300"
            style={{ background: "var(--color-overlay)" }}
          />

          {/* Scrollable page content */}
          <div className="relative h-full overflow-y-auto p-2 sm:p-6 pb-16 md:pb-6">
            <Outlet />
          </div>

        </main>
      </div>

    </div>
  );
}

export default MainLayout;