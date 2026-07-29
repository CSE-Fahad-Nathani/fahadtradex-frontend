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
  const setPortfolio = useHoldingsStore((s) => s.setPortfolio);
  const setPositions = useHoldingsStore((s) => s.setPositions);
  const setPortfolioLoading = useHoldingsStore((s) => s.setPortfolioLoading);
  const setPositionsLoading = useHoldingsStore((s) => s.setPositionsLoading);
  const clearHoldings = useHoldingsStore((s) => s.clearHoldings);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!user || !token) return;

    const headers = { Authorization: `Bearer ${token}` };

    const fetchPortfolio = async () => {
      setPortfolioLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/portfolio`, { headers });
        const json = await res.json();
        setPortfolio(json.success ? json.data : []);
      } catch (error) {
        console.error("Global portfolio fetch failed:", error);
        setPortfolio([]);
      }
    };

    const fetchPositions = async () => {
      setPositionsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/positions`, { headers });
        const json = await res.json();
        setPositions(json.success ? json.data : []);
      } catch (error) {
        console.error("Global positions fetch failed:", error);
        setPositions([]);
      }
    };

    fetchPortfolio();
    fetchPositions();
  }, [user, setPortfolio, setPositions, setPortfolioLoading, setPositionsLoading]);

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
