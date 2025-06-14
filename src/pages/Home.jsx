import React, { useEffect, useState, useCallback } from "react";
import { fetchTopCoins } from "../api/coinGecko";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const coinsPerPage = 50;

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "market_cap_rank",
    direction: "asc",
  });

  const { user } = useAuth();

  useEffect(() => {
    const loadCoins = async () => {
      try {
        const data = await fetchTopCoins();
        setCoins(data);
      } catch (err) {
        console.error("Failed to fetch coins:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCoins();
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("favorites")
        .eq("id", user.id)
        .single();
      setFavorites(data?.favorites || []);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const toggleFavorite = async (coinId) => {
    if (!user) return;

    const isFavorite = favorites.includes(coinId);
    const updatedFavorites = isFavorite
      ? favorites.filter((id) => id !== coinId)
      : [...favorites, coinId];

    try {
      await supabase
        .from("favorites")
        .upsert(
          { id: user.id, favorites: updatedFavorites },
          { onConflict: "id" }
        );

      setFavorites(updatedFavorites);
      toast[isFavorite ? "error" : "success"](
        isFavorite ? "Favorilerden kaldırıldı." : "Favorilere eklendi."
      );
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "desc"
        ? "asc"
        : "desc";
    setSortConfig({ key, direction });
  };

  const filteredCoins = coins.filter((coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedCoins = filteredCoins.sort((a, b) => {
    if (sortConfig.key === "favorites") {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      return sortConfig.direction === "asc" ? aFav - bFav : bFav - aFav;
    }

    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const visibleCoins = showFavorites
    ? sortedCoins.filter((coin) => favorites.includes(coin.id))
    : sortedCoins;

  const startIndex = (currentPage - 1) * coinsPerPage;
  const endIndex = startIndex + coinsPerPage;
  const currentCoins = visibleCoins.slice(startIndex, endIndex);

  const totalPages = Math.ceil(visibleCoins.length / coinsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <>
      <div className="h-20" />

      <div className="w-[90%] mx-auto">
        {/* Search & Favorites */}
        <div className="bg-black py-4 px-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Coin ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 w-full md:w-1/3 rounded-md bg-black text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-white transition duration-200 ease-in-out"
            />
            <button
              onClick={() => {
                setShowFavorites(!showFavorites);
                setCurrentPage(1);
              }}
              className="p-3 px-6 rounded-md bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold hover:opacity-90 transition w-full md:w-auto shadow-sm"
            >
              {showFavorites ? "Tüm Coinleri Göster" : "Favorileri Göster"}
            </button>
          </div>

          {/* Mobile Only Sort Buttons */}
          <div className="md:hidden flex flex-wrap gap-2 mt-4 justify-center">
            {[
              { label: "Sıralama", key: "market_cap_rank" },
              { label: "Fiyat", key: "current_price" },
              { label: "% 24 Saat", key: "price_change_percentage_24h" },
            ].map((opt) => (
              <motion.button
                key={opt.key}
                onClick={() => handleSort(opt.key)}
                whileTap={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  sortConfig.key === opt.key
                    ? "bg-green-500 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="p-6 mt-4">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-7 gap-4 border-b border-gray-700 pb-2 mb-4 text-gray-400 text-sm">
            <div
              onClick={() => handleSort("market_cap_rank")}
              className="cursor-pointer flex justify-center items-center gap-1"
            >
              #{" "}
              {sortConfig.key === "market_cap_rank" &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
            </div>
            <div
              onClick={() => handleSort("name")}
              className="cursor-pointer flex justify-start items-center gap-1"
            >
              İsim{" "}
              {sortConfig.key === "name" &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
            </div>
            <div
              onClick={() => handleSort("current_price")}
              className="cursor-pointer flex justify-center items-center gap-1"
            >
              Fiyat{" "}
              {sortConfig.key === "current_price" &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
            </div>
            <div
              onClick={() =>
                handleSort("price_change_percentage_1h_in_currency")
              }
              className="cursor-pointer flex justify-center items-center gap-1"
            >
              % 1h{" "}
              {sortConfig.key === "price_change_percentage_1h_in_currency" &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
            </div>
            <div
              onClick={() => handleSort("price_change_percentage_24h")}
              className="cursor-pointer flex justify-center items-center gap-1"
            >
              % 24h{" "}
              {sortConfig.key === "price_change_percentage_24h" &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
            </div>
            <div
              onClick={() =>
                handleSort("price_change_percentage_7d_in_currency")
              }
              className="cursor-pointer flex justify-center items-center gap-1"
            >
              % 7d{" "}
              {sortConfig.key === "price_change_percentage_7d_in_currency" &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
            </div>
            <div
              onClick={() => handleSort("favorites")}
              className="cursor-pointer flex justify-center items-center gap-1"
            >
              Favori{" "}
              {sortConfig.key === "favorites" &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
            </div>
          </div>

          {/* Coin List */}
          <div>
            {currentCoins.length === 0 ? (
              <div className="text-center text-white">No coins found.</div>
            ) : (
              currentCoins.map((coin) => (
                <div key={coin.id}>
                  {/* Desktop */}
                  <div
                    className={`hidden md:grid md:grid-cols-7 gap-4 py-4 md:py-3 px-4 border border-gray-700 rounded-lg mb-4 md:border-0 md:rounded-none md:px-0 md:mb-0 hover:bg-white hover:bg-opacity-10 transition-all ${
                      coin.price_change_percentage_24h > 0
                        ? "bg-green-900 bg-opacity-10 md:bg-transparent"
                        : "bg-red-900 bg-opacity-10 md:bg-transparent"
                    }`}
                  >
                    <Link to={`/coin/${coin.id}`} className="contents">
                      <div className="flex justify-center items-center text-gray-400 text-sm">
                        #{coin.market_cap_rank}
                      </div>
                      <div className="flex justify-start items-center gap-2">
                        <img
                          src={coin.image}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-white font-medium truncate">
                          {coin.name.length > 15
                            ? coin.name.slice(0, 15) + "..."
                            : coin.name}
                        </span>
                      </div>
                      <div className="flex justify-center items-center text-white">
                        ${coin.current_price?.toLocaleString() ?? "N/A"}
                      </div>
                      <div className="flex justify-center items-center text-sm">
                        <span
                          className={
                            coin.price_change_percentage_1h_in_currency > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {coin.price_change_percentage_1h_in_currency?.toFixed(
                            2
                          ) ?? "0.00"}
                          %
                        </span>
                      </div>
                      <div className="flex justify-center items-center text-sm">
                        <span
                          className={
                            coin.price_change_percentage_24h > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {coin.price_change_percentage_24h?.toFixed(2) ??
                            "0.00"}
                          %
                        </span>
                      </div>
                      <div className="flex justify-center items-center text-sm">
                        <span
                          className={
                            coin.price_change_percentage_7d_in_currency > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {coin.price_change_percentage_7d_in_currency?.toFixed(
                            2
                          ) ?? "0.00"}
                          %
                        </span>
                      </div>
                    </Link>
                    <div className="flex justify-center items-center">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toggleFavorite(coin.id);
                        }}
                        whileTap={{ scale: 1.4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
                      >
                        {favorites.includes(coin.id) ? "★" : "☆"}
                      </motion.button>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden bg-black border-b border-gray-700 px-4 py-3 w-[120%] -mx-[10%]">
                    <div className="flex justify-between text-gray-400 text-sm mb-1">
                      <span>#{coin.market_cap_rank}</span>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toggleFavorite(coin.id);
                        }}
                        whileTap={{ scale: 1.4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
                      >
                        {favorites.includes(coin.id) ? "★" : "☆"}
                      </motion.button>
                    </div>
                    <Link to={`/coin/${coin.id}`} className="block mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={coin.image}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-white font-medium">
                          {coin.name}
                        </span>
                      </div>
                      <div className="text-white font-bold mb-1">
                        ${coin.current_price?.toLocaleString() ?? "N/A"}
                      </div>
                    </Link>
                    <div className="text-sm">
                      <span>24h: </span>
                      <span
                        className={
                          coin.price_change_percentage_24h > 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {coin.price_change_percentage_24h?.toFixed(2) ?? "0.00"}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6 flex-wrap gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-full transition-all ${
                  currentPage === i + 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-700 text-white hover:bg-green-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
