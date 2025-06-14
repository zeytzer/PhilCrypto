import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTopCoins } from "../api/coinGecko";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function CoinDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [coin, setCoin] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const getCoin = async () => {
      try {
        const coins = await fetchTopCoins();
        const found = coins.find((c) => c.id === id);
        setCoin(found || null);
      } catch {
        console.error("Failed to load coin data.");
      }
    };
    getCoin();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const fetchFavorites = async () => {
      try {
        const { data } = await supabase
          .from("favorites")
          .select("favorites")
          .eq("id", user.id)
          .maybeSingle();
        setFavorites(data?.favorites || []);
      } catch {
        console.error("Failed to fetch favorites.");
      }
    };
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (coinId) => {
    if (!user) return;
    const isFav = favorites.includes(coinId);
    const updated = isFav
      ? favorites.filter((c) => c !== coinId)
      : [...favorites, coinId];
    try {
      await supabase
        .from("favorites")
        .upsert({ id: user.id, favorites: updated }, { onConflict: "id" });
      setFavorites(updated);
      toast[isFav ? "error" : "success"](
        isFav ? "Favorilerden kaldırıldı." : "Favorilere eklendi."
      );
    } catch {
      console.error("Failed to update favorites.");
    }
  };

  if (!coin) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin h-16 w-16 border-4 border-t-green-500 border-b-green-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 md:pt-28 pb-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Coin Info */}
        <div className="flex-1 bg-[#111] p-6 rounded-2xl shadow-lg space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img
                src={coin.image}
                alt={coin.name}
                className="w-14 h-14 rounded-full"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {coin.name}
                </h1>
                <p className="text-gray-400 uppercase text-sm md:text-base">
                  {coin.symbol}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleFavorite(coin.id)}
              className="text-yellow-400 text-3xl"
            >
              {favorites.includes(coin.id) ? "★" : "☆"}
            </button>
          </div>

          <div className="text-3xl md:text-4xl font-bold text-white mb-8">
            ${coin.current_price?.toLocaleString()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white text-sm md:text-base">
            <div className="col-span-2">
              <p className="text-gray-400">{"Piyasa Değeri Sıralaması"}</p>
              <p>#{coin.market_cap_rank}</p>
            </div>
            <div>
              <p className="text-gray-400">{"Piyasa Değeri"}</p>
              <p>${coin.market_cap?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">{"24 Saatlik Hacim"}</p>
              <p>${coin.total_volume?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">{"Dolaşımdaki Arz"}</p>
              <p>
                {coin.circulating_supply?.toLocaleString()}{" "}
                {coin.symbol.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-gray-400">{"Toplam Adet"}</p>
              <p>
                {coin.total_supply ? coin.total_supply.toLocaleString() : "N/A"}{" "}
                {coin.symbol.toUpperCase()}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400">{"Maksimum Adet"}</p>
              <p>
                {coin.max_supply ? coin.max_supply.toLocaleString() : "∞"}{" "}
                {coin.symbol.toUpperCase()}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400">{"24 Saatlik Değişiklik"}</p>
              <p
                className={
                  coin.price_change_percentage_24h > 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {coin.price_change_percentage_24h?.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="flex-1 w-full">
          <div className="w-full h-[60vh] md:h-[600px]">
            <iframe
              src={`https://www.tradingview.com/widgetembed/?symbol=BINANCE:${coin.symbol.toUpperCase()}USDT&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=[]&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1`}
              className="w-full h-full rounded-md shadow-lg"
              frameBorder="0"
              allowtransparency="true"
              scrolling="no"
              allowFullScreen
              title={`${coin.name} Chart`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
