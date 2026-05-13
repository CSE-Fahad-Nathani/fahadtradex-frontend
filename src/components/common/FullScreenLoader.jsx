import { motion, AnimatePresence } from "framer-motion";
// import loaderVideo from "./assets/videos/loooginLoader.mp4"; // adjust path if needed
import loaderVideo from "../../assets/videos/loginLoader.mp4";

function FullScreenLoader({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)" }}
          transition={{
            duration: 0.7,
            ease: [0.65, 0, 0.35, 1],
          }}
          className="fixed inset-0 z-[999] overflow-hidden"
        >
          {/* 🎥 Background Video */}
          <video
            src={loaderVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={(e) => e.currentTarget.play()}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* 🌑 Dark Overlay */}
          {/* <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" /> */}

          {/* ✨ Optional Center Content (keep empty for clean look) */}
          <div className="relative z-10 flex items-center justify-center h-full">
            {/* Future: logo / animation */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FullScreenLoader;