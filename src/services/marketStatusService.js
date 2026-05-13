import axios from "axios";

export const getMarketStatus = async () => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL}/api/market/status`
  );
  return res.data.data;
};