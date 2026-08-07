import { motion, AnimatePresence } from "framer-motion";
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
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#0E2D34" }}
        >
          {/* Blurred full-screen background video */}
          <video
            src={loaderVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={(e) => e.currentTarget.play()}
            className="absolute inset-0 h-full w-full object-cover scale-125 blur-md opacity-70"
            aria-hidden
          />

          {/* Sharp foreground video */}
          <video
            src={loaderVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={(e) => e.currentTarget.play()}
            className="relative z-10 w-full h-auto object-contain scale-150"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FullScreenLoader;
