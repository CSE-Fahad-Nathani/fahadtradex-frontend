import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import GlobalPnlTracker from "../market/GlobalPnlTracker";
import bg from "../../assets/images/BackgroundImg.png";

function MainLayout( {triggerWatchlistUpdate, setTriggerWatchlistUpdate, triggerPositionUpdate, setTriggerPositionUpdate}) {
  return (
    <div className="flex h-screen bg-[#0B0F19] text-[#F9FAFB]">
      <GlobalPnlTracker />
      
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header  triggerWatchlistUpdate={triggerWatchlistUpdate} setTriggerWatchlistUpdate={setTriggerWatchlistUpdate} triggerPositionUpdate={triggerPositionUpdate} setTriggerPositionUpdate={setTriggerPositionUpdate} />

        <main className="relative flex-1 overflow-y-auto">

{/* 🔥 Background Image */}
<div
  className="absolute inset-0"
  style={{
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
/>

{/* 🔥 Black Overlay */}
<div className="absolute inset-0 bg-black/90  backdrop-blur-sm" />

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