"use client";

import React, { useState, useEffect } from "react";
import useAuth from "@/utils/useAuth";

export default function AddAssetModal({ onClose }) {
  const [search, setSearch] = useState("");
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({});
  const { user, favorites, setFavorites } = useAuth();

  // 관심종목 심볼 집합
  const favoriteSymbols = new Set(favorites.map((f) => f.symbol));

  // 전체 종목 fetch (처음 1회)
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`)
      .then((res) => res.json())
      .then((res) => {
        setAllStocks(res.data || []);
        setFilteredStocks(res.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // 검색어 입력 시 프론트에서만 필터링
  useEffect(() => {
    if (search === "") {
      setFilteredStocks(allStocks);
    } else {
      const lower = search.toLowerCase();
      setFilteredStocks(
        allStocks.filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(lower) ||
            (stock.name_kr && stock.name_kr.includes(search))
        )
      );
    }
  }, [search, allStocks]);

  const handleSelect = (symbol) => {
    setSelected((prev) => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  // 완료 버튼 클릭 시 관심종목 추가
  const handleComplete = async () => {
    if (!user?.id) return onClose();
    const selectedIds = Object.keys(selected)
      .filter((symbol) => selected[symbol])
      .map((symbol) => {
        const stock = allStocks.find((s) => s.symbol === symbol);
        return stock ? { stock_id: stock.id } : null;
      })
      .filter(Boolean);
    if (selectedIds.length === 0) {
      onClose();
      return;
    }
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedIds),
    });
    // 관심종목 즉시 갱신
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/favorites/${user.id}`
    );
    const data = await res.json();
    setFavorites(data.data || []);
    console.log("추가되었습니다");
    window.location.href = "/earning";
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="text-black rounded-lg shadow-lg w-[500px] h-[600px] p-8 flex flex-col"
        style={{ backgroundColor: "rgba(234,234,234,0.97)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2">관심 종목 추가</h2>
        <input
          className="w-full border px-3 py-2 rounded mb-4 placeholder-gray-400 border-gray-300"
          style={{ backgroundColor: "rgba(234,234,234,0.97)" }}
          placeholder="종목명(한글) 또는 심볼(영문) 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="text-lg font-semibold mb-2">S&P 500</div>
        <div
          className="divide-y divide-gray-200 max-h-72 overflow-y-auto rounded flex-1"
          style={{ backgroundColor: "rgba(234,234,234,0.97)" }}
        >
          {loading && (
            <div className="text-center text-gray-400 py-4">로딩중...</div>
          )}
          {!loading && filteredStocks.length === 0 && (
            <div className="text-gray-400 text-center py-4">검색 결과 없음</div>
          )}
          {!loading &&
            filteredStocks.map((stock) => {
              const isFavorite = favoriteSymbols.has(stock.symbol);
              return (
                <div
                  key={stock.symbol}
                  className="flex items-center py-3 px-2 transition mr-2"
                  style={{
                    backgroundColor: "rgba(234,234,234,0.97)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(210,210,210,0.97)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(234,234,234,0.97)")
                  }
                >
                  <img
                    src={stock.logo}
                    alt={stock.symbol}
                    className="w-7 h-7 rounded-full mr-3 border border-gray-200 bg-white"
                  />
                  <span className="font-bold text-[#0a1a4f] mr-2">
                    {stock.name_kr}
                  </span>
                  <span className="text-gray-500 mr-auto">{stock.symbol}</span>
                  <input
                    type="checkbox"
                    checked={isFavorite || !!selected[stock.symbol]}
                    disabled={isFavorite}
                    onChange={() => handleSelect(stock.symbol)}
                    className="w-5 h-5 accent-blue-500 checked:border-gray-200 cursor-pointer"
                  />
                </div>
              );
            })}
        </div>
        <button
          className="w-full mt-8 py-3 bg-black text-white rounded-full text-lg font-bold hover:bg-gray-800 transition cursor-pointer"
          onClick={handleComplete}
        >
          완료
        </button>
      </div>
    </div>
  );
}
