import { useEffect, useMemo } from "react";
import marketFeedService from "../../services/marketFeedService";
import { useHoldingsStore } from "../../store/holdingsStore";
import { useMarketStore } from "../../store/marketStore";
import { usePnlHistoryStore } from "../../store/pnlHistoryStore";
import { useUserStore } from "../../store/userStore";

function GlobalPnlTracker() {
  const user = useUserStore((s) => s.user);
  const liveData = useMarketStore((s) => s.data);
  const addHistoryPoint = usePnlHistoryStore((s) => s.addHistoryPoint);
  const clearHistory = usePnlHistoryStore((s) => s.clearHistory);

  const portfolio = useHoldingsStore((s) => s.portfolio);
  const positions = useHoldingsStore((s) => s.positions);
  const isLoaded = useHoldingsStore((s) => s.isLoaded);
  const setHoldings = useHoldingsStore((s) => s.setHoldings);
  const clearHoldings = useHoldingsStore((s) => s.clearHoldings);

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (!user || !token) return;

    const fetchHoldings = async () => {
      try {
        const [portfolioRes, positionsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/portfolio`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/positions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const portfolioJson = await portfolioRes.json();
        const positionsJson = await positionsRes.json();

        setHoldings({
          portfolio: portfolioJson.success ? portfolioJson.data : [],
          positions: positionsJson.success ? positionsJson.data : [],
        });
      } catch (error) {
        console.error("Global holdings fetch failed:", error);
      }
    };

    fetchHoldings();
  }, [user,  setHoldings]);

  useEffect(() => {
    const all = [...portfolio, ...positions];
    if (all.length === 0) return;

    const uniqueScripMap = new Map();
    all.forEach((item) => {
      uniqueScripMap.set(`${item.Exch}-${item.ExchType}-${item.ScripCode}`, {
        Exch: item.Exch,
        ExchType: item.ExchType,
        ScripCode: item.ScripCode,
      });
    });

    const scrips = Array.from(uniqueScripMap.values());
    if (scrips.length === 0) return;

    const accessToken = localStorage.getItem("fivePaisaAccessToken");
    const clientCode = localStorage.getItem("clientCode");

    marketFeedService.connect({ accessToken, clientCode });
    const unsubscribe = marketFeedService.subscribe({ scrips });

    return unsubscribe;
  }, [portfolio, positions]);

  const normalizedRows = useMemo(() => {
    return [...portfolio, ...positions].map((item) => {
      const live = liveData[String(item.ScripCode)] || {};
      const hasLivePrice = Number(live.LastRate) > 0;
      const ltp = hasLivePrice ? Number(live.LastRate) : Number(item.avgPrice || 0);
      const isMCX = item.Exch === "M";
      const qty = isMCX ? Number(item.lots ?? item.totalQty ?? 0) : Number(item.totalQty || 0);
      const multiplier = Number(item.multiplier || 1);
      const avg = Number(item.avgPrice || 0);
      const pnl = isMCX ? (ltp - avg) * multiplier * qty : (ltp - avg) * qty;

      return {
        qty,
        pnl,
        hasLivePrice,
      };
    });
  }, [portfolio, positions, liveData]);

  const hasLiveData = useMemo(
    () => normalizedRows.some((row) => row.hasLivePrice && row.qty > 0),
    [normalizedRows]
  );

  const totalPnl = useMemo(
    () => normalizedRows.reduce((sum, row) => sum + row.pnl, 0),
    [normalizedRows]
  );

  useEffect(() => {
    if (!hasLiveData || normalizedRows.length === 0) return;

    const pushPoint = () => {
      addHistoryPoint({
        time: Date.now(),
        pnl: Number(totalPnl.toFixed(2)),
      });
    };

    pushPoint();
    const interval = setInterval(pushPoint, 5000);
    return () => clearInterval(interval);
  }, [hasLiveData, normalizedRows.length, totalPnl, addHistoryPoint]);

  useEffect(() => {
    if (user) return;
    clearHoldings();
    clearHistory();
  }, [user, clearHoldings, clearHistory]);

  return null;
}

export default GlobalPnlTracker;
