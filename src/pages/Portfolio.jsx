import React, { useEffect, useState, useLayoutEffect, useMemo } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import Select from "react-select";
import { toast } from "react-hot-toast";
import axios from "axios";
import { X, Edit2, Check } from "lucide-react";

export default function Portfolio() {
  const { user } = useAuth();
  const [navHeight, setNavHeight] = useState(0);

  useLayoutEffect(() => {
    const nav = document.querySelector("nav");
    if (nav) {
      setNavHeight(nav.offsetHeight);
    }
  }, []);

  const isTr = navigator.language.startsWith("tr");
  const locale = isTr ? "tr-TR" : "en-US";
  const currency = isTr ? "TRY" : "USD";
  const vs = currency.toLowerCase();

  const fmt = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
  }, [locale, currency]);

  const [coins, setCoins] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [prices, setPrices] = useState({});
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");

  const fetchJson = (url) => axios.get(url).then((res) => res.data);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=250&page=1&sparkline=false`
        );
        setCoins(data);
      } catch {
        console.error("Coin verileri yüklenemedi");
      }
    })();
  }, [vs]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("portfolio")
          .select("*")
          .eq("user_id", user.id);
        if (error) throw error;

        setPortfolio(data || []);

        if (data.length > 0) {
          const ids = data.map((p) => p.coin_id).join(",");
          const priceData = await fetchJson(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs}`
          );
          setPrices(priceData);
        }
      } catch {
        toast.error("Portföy verileri alınırken hata oluştu");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, vs]);

  const addOrUpdate = async () => {
    if (!selected || !amount) {
      return toast.error("Lütfen coin ve miktar girin");
    }

    const amt = parseFloat(amount);
    try {
      const { data: existing } = await supabase
        .from("portfolio")
        .select("id, amount")
        .eq("user_id", user.id)
        .eq("coin_id", selected.value)
        .maybeSingle();

      if (existing) {
        const newAmount = existing.amount + amt;
        const { data: updated } = await supabase
          .from("portfolio")
          .update({ amount: newAmount })
          .eq("id", existing.id)
          .select()
          .single();

        setPortfolio((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        toast.success("Miktar güncellendi");
      } else {
        const { data: inserted } = await supabase
          .from("portfolio")
          .insert({
            user_id: user.id,
            coin_id: selected.value,
            amount: amt,
          })
          .select()
          .single();

        setPortfolio((prev) => [...prev, inserted]);
        toast.success("Coin eklendi");
      }

      const priceUpdate = await fetchJson(
        `https://api.coingecko.com/api/v3/simple/price?ids=${selected.value}&vs_currencies=${vs}`
      );
      setPrices((prev) => ({ ...prev, ...priceUpdate }));

      setSelected(null);
      setAmount("");
    } catch {
      toast.error("Kayıt sırasında hata oluştu");
    }
  };

  const remove = async (id) => {
    try {
      await supabase.from("portfolio").delete().eq("id", id);
      setPortfolio((prev) => prev.filter((x) => x.id !== id));
      toast.success("Coin silindi");
    } catch {
      toast.error("Silme işlemi sırasında hata oluştu");
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditingAmount(String(row.amount));
  };

  const saveEdit = async (id) => {
    const amt = parseFloat(editingAmount);
    if (isNaN(amt)) {
      return toast.error("Geçersiz miktar");
    }

    try {
      const { data: updated } = await supabase
        .from("portfolio")
        .update({ amount: amt })
        .eq("id", id)
        .select()
        .single();

      setPortfolio((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      toast.success("Miktar kaydedildi");
      setEditingId(null);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-green-500 rounded-full" />
      </div>
    );
  }

  const rows = portfolio.map((p, i) => {
    const coin = coins.find((c) => c.id === p.coin_id) || {};
    const price = prices[p.coin_id]?.[vs] ?? coin.current_price ?? 0;
    return {
      ...p,
      idx: i + 1,
      name: coin.name,
      image: coin.image,
      price,
      change24h: coin.price_change_percentage_24h,
      value: price * p.amount,
    };
  });
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div
      className="min-h-screen bg-black text-white p-4 sm:p-6"
      style={{ paddingTop: navHeight + 16 }}
    >
      <h1 className="text-3xl font-bold mb-6">Your Portfolio</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Select
          className="flex-1"
          options={coins.map((c) => ({ value: c.id, label: c.name }))}
          value={selected}
          onChange={setSelected}
          placeholder="Search top-250 coin..."
          isSearchable
          styles={{
            control: (b) => ({
              ...b,
              background: "#000",
              border: "1px solid #374151",
              borderRadius: "0.5rem",
              height: "3.5rem",
            }),
            singleValue: (b) => ({ ...b, color: "#fff" }),
            menu: (b) => ({ ...b, background: "#000" }),
            option: (b, s) => ({
              ...b,
              background: s.isFocused ? "#1f2937" : "#000",
              color: "#fff",
            }),
          }}
          menuPortalTarget={document.body}
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full sm:w-1/4 bg-black border border-gray-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-white"
        />
        <button
          onClick={addOrUpdate}
          className="w-full sm:w-auto bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-3 rounded-md font-semibold hover:opacity-90"
        >
          Add / Update
        </button>
      </div>

      <div className="mb-6 text-2xl">
        Total: <span className="text-green-400">{fmt.format(total)}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="hidden md:grid grid-cols-7 gap-4 text-gray-400 text-sm mb-2">
          {["#", "Name", "Price", "Amount", "Value", "24h %", ""].map((h) => (
            <div key={h} className="text-center">
              {h}
            </div>
          ))}
        </div>

        {rows.map((r) => (
          <div key={r.id} className="mb-4">
            {/* Desktop */}
            <div className="hidden md:grid md:grid-cols-7 gap-4 py-3 px-4 hover:bg-white/10">
              <div className="text-center">{r.idx}</div>
              <div className="flex items-center gap-2">
                <img src={r.image} alt="" className="w-6 h-6 rounded-full" />
                <span>{r.name}</span>
              </div>
              <div className="text-center">${r.price.toLocaleString()}</div>
              <div className="flex items-center justify-center gap-2">
                {editingId === r.id ? (
                  <>
                    <input
                      type="number"
                      value={editingAmount}
                      onChange={(e) => setEditingAmount(e.target.value)}
                      className="w-16 bg-black border border-gray-700 rounded px-2 py-1 text-white"
                    />
                    <button onClick={() => saveEdit(r.id)}>
                      <Check className="text-green-400" size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)}>
                      <X className="text-red-400" size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span>{r.amount}</span>
                    <button onClick={() => startEdit(r)}>
                      <Edit2 className="text-yellow-400" size={16} />
                    </button>
                  </>
                )}
              </div>
              <div className="text-center">${r.value.toLocaleString()}</div>
              <div
                className={`text-center ${
                  r.change24h > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {r.change24h?.toFixed(2)}%
              </div>
              <div className="text-center">
                <button onClick={() => remove(r.id)}>
                  <X className="text-red-500" size={16} />
                </button>
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden bg-black border-b border-gray-700 px-4 py-3 w-[95%] mx-auto space-y-2">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>#{r.idx}</span>
                <button onClick={() => remove(r.id)}>
                  <X className="text-red-500" size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <img src={r.image} alt="" className="w-6 h-6 rounded-full" />
                <span className="text-white font-medium">{r.name}</span>
              </div>
              <div className="text-white font-bold">
                ${r.price.toLocaleString()}
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <div className="flex items-center gap-1">
                  {editingId === r.id ? (
                    <>
                      <input
                        type="number"
                        value={editingAmount}
                        onChange={(e) => setEditingAmount(e.target.value)}
                        className="w-16 bg-black border border-gray-700 rounded px-2 py-1 text-white"
                      />
                      <button onClick={() => saveEdit(r.id)}>
                        <Check className="text-green-400" size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)}>
                        <X className="text-red-400" size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{r.amount}</span>
                      <button onClick={() => startEdit(r)}>
                        <Edit2 className="text-yellow-400" size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span>Value</span>
                <span>${r.value.toLocaleString()}</span>
              </div>
              <div
                className={`text-sm text-right ${
                  r.change24h > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                24h {r.change24h?.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
