import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-borderColor bg-cardBg text-textMuted hover:text-textPrimary transition-colors"
    >
      {isDark ? <Sun size={15} className="sm:w-4 sm:h-4" /> : <Moon size={15} className="sm:w-4 sm:h-4" />}
    </button>
  );
}

export default ThemeToggle;
