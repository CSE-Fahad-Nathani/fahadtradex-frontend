// 🇮🇳 Format number in Indian style with 2 decimal places
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "—";

  const number = Number(num);

  if (isNaN(number)) return num;

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


// import { formatNumber } from "../../utils/formatNumber";
// formatNumber(11111111);
// 👉 "1,11,11,111"