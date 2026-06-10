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

        <main className="relative flex-1 overflow-y-auto">

{/* 🔥 Background Image */}
<div
  className="absolute inset-0 main-bg-image transition-opacity duration-300"
  style={{
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
/>

<div
  className="absolute inset-0 backdrop-blur-sm transition-colors duration-300"
  style={{ background: "var(--color-overlay)" }}
/>

{/* 🔥 Content */}
<div className="relative p-2 sm:p-6 pb-16 md:pb-6">
  <Outlet />
</div>

</main>
      </div>

    </div>
  );
}

export default MainLayout;


{/* <div
  className="p-4 md:p-6 space-y-6 text-textPrimary min-h-screen"
  style={{
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
></div> */}