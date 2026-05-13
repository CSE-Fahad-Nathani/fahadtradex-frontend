import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {

  const [toasts, setToasts] = useState([]);

  const showToast = (type, message) => {

    setToasts((prev) => {

      const existing = prev.find(t => t.message === message);

      // If same message → reset timer
      if (existing) {
        return prev.map(t =>
          t.message === message
            ? { ...t, id: Date.now() }
            : t
        );
      }

      const newToast = {
        id: Date.now(),
        type,
        message
      };

      const updated = [newToast, ...prev];

      return updated.slice(0, 4);
    });

  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>

      {children}

      <div className="fixed top-6 right-6 flex flex-col gap-3 z-50">

        <AnimatePresence>

          {toasts.map((toast) => (

            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 120, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120 }}
              transition={{ duration: 0.25 }}
              layout
              className={`relative w-80 rounded-xl border backdrop-blur-lg shadow-2xl
              ${toast.type === "success"
                  ? "border-green-500/40 bg-[#0B0F19]/80"
                  : "border-red-500/40 bg-[#0B0F19]/80"
              }`}
            >

              {/* Accent Bar */}
              <div
                className={`absolute left-0 top-0 h-full w-1 rounded-l-xl
                ${toast.type === "success" ? "bg-green-400" : "bg-red-400"}`}
              />

              <div className="p-5 flex items-start gap-3">

                {/* Icon */}
                <div className="mt-0.5">
                  {toast.type === "success" ? (
                    <CheckCircle className="text-green-400" size={20} />
                  ) : (
                    <XCircle className="text-red-400" size={20} />
                  )}
                </div>

                {/* Message */}
                <div className="flex-1">

                  <p className="text-sm font-medium text-white">
                    {toast.type === "success" ? "Success" : "Error"}
                  </p>

                  <p className="text-sm text-gray-400 mt-0.5">
                    {toast.message}
                  </p>

                </div>

                {/* Close */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-500 hover:text-white transition"
                >
                  <X size={16} />
                </button>

              </div>

              {/* Progress Bar */}
              <div className="h-[2px] bg-white/10 overflow-hidden rounded-b-xl">

                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  onAnimationComplete={() => removeToast(toast.id)}
                  className={`h-full ${
                    toast.type === "success"
                      ? "bg-green-400"
                      : "bg-red-400"
                  }`}
                />

              </div>

            </motion.div>

          ))}

        </AnimatePresence>

      </div>

    </ToastContext.Provider>
  );
}