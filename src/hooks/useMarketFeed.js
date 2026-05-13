import { useEffect } from "react";
import marketFeedService from "../services/marketFeedService";

const useMarketFeed = ({ accessToken, clientCode, scrips = [], onData }) => {
  useEffect(() => {
    if (!accessToken || !clientCode || scrips.length === 0) return;

    // ✅ Connect once (safe)
    marketFeedService.connect({ accessToken, clientCode });

    // ✅ Subscribe
    const unsubscribe = marketFeedService.subscribe({
      scrips,
      callback: onData,
    });

    // ✅ Cleanup
    return () => {
      unsubscribe();
    };
  }, [accessToken, clientCode, JSON.stringify(scrips)]);
};

export default useMarketFeed;