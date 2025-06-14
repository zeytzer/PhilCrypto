// src/api/coinGecko.js
import axios from "axios";

const BASE_URL = "https://api.coingecko.com/api/v3";

// Top 250 Coinleri getirir
export const fetchTopCoins = async () => {
  const { data } = await axios.get(`${BASE_URL}/coins/markets`, {
    params: {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 250, // 🔥 BURADA 250 yaptık
      page: 1,
      sparkline: false,
      price_change_percentage: "1h,24h,7d",
    },
  });
  return data;
};

// Coin market chart (grafik verisi) getirir
export const fetchCoinMarketChart = async (coinId) => {
  const { data } = await axios.get(`${BASE_URL}/coins/${coinId}/market_chart`, {
    params: {
      vs_currency: "usd",
      days: "1", // 1 günlük veri
    },
  });
  return data;
};

// ⭐ YENİ EKLEDİĞİM: Tek bir coin'in detayını getir
export const fetchCoinDetails = async (coinId) => {
  const { data } = await axios.get(`${BASE_URL}/coins/${coinId}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
  });
  return data;
};
