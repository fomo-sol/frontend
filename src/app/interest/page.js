"use client";
import { useState, useEffect } from "react";
import "./scrollbar.css";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StockItemCard from "@/components/interest/StockItemCard";

const chunkStocks = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

export default function InterestPage() {
  const router = useRouter();
  const [originalCompanies, setOriginalCompanies] = useState([]);
  const [displayCompanies, setDisplayCompanies] = useState([]);
  const [sectorMap, setSectorMap] = useState({});
  const [selectedList, setSelectedList] = useState([]); // {symbol, rowIndex}
  const [recommendations, setRecommendations] = useState([]); // {symbol, recList}
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`);
        const json = await res.json();
        if (json.success) {
          setOriginalCompanies(json.data);

          const sectorGroup = {};
          json.data.forEach((company) => {
            if (!sectorGroup[company.sector]) {
              sectorGroup[company.sector] = [];
            }
            sectorGroup[company.sector].push(company);
          });
          setSectorMap(sectorGroup);
          setDisplayCompanies(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch companies", e);
      }
    };

    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      setToken(accessToken);
      try {
        const payload = parseJwt(accessToken);
        setUsername(payload.username); // username 저장
      } catch (e) {
        setUsername("");
      }
    }

    fetchCompanies();
  }, []);

  const selectedSymbols = new Set(selectedList.map((s) => s.symbol));

  const toggleSelect = (symbol, rowIndex) => {
    const isAlreadySelected = selectedList.some((s) => s.symbol === symbol);
    if (isAlreadySelected) {
      setSelectedList((prev) => prev.filter((s) => s.symbol !== symbol));
      return;
    }

    const selectedCompany = [
      ...displayCompanies,
      ...recommendations.flatMap((r) => r.recList),
    ].find((c) => c.symbol === symbol);
    if (!selectedCompany) return;

    const allExcluded = new Set([
      ...selectedList.map((s) => s.symbol),
      ...recommendations.flatMap((r) => r.recList.map((c) => c.symbol)),
      symbol,
    ]);

    // 선택한 종목의 rank 이후의 종목들만 추천 후보로 선정
    const sectorCompanies = sectorMap[selectedCompany.sector] || [];
    const selectedCompanyRank = selectedCompany.rank || 0;

    // rank가 있는 경우: 선택한 종목보다 낮은 rank(높은 순위)의 종목들만 추천
    // rank가 없는 경우: 기존 로직 유지
    let candidates;
    if (selectedCompanyRank > 0) {
      candidates = sectorCompanies.filter(
        (c) => !allExcluded.has(c.symbol) && (c.rank || 0) > selectedCompanyRank
      );
    } else {
      // rank 정보가 없는 경우 기존 로직 사용
      candidates = sectorCompanies.filter((c) => !allExcluded.has(c.symbol));
    }

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const top5 = shuffled.slice(0, 5);

    setSelectedList((prev) => [...prev, { symbol, rowIndex }]);
    setRecommendations((prev) => [...prev, { symbol, recList: top5 }]);
    setDisplayCompanies((prev) =>
      prev.filter((c) => !top5.some((r) => r.symbol === c.symbol))
    );
  };

  const buildRowsWithRecommendations = () => {
    const rows = chunkStocks(displayCompanies, 5);
    const result = [];

    for (let i = 0; i < rows.length; i++) {
      result.push({ type: "main", data: rows[i], rowIndex: i });

      const selectedInRow = [...selectedList]
        .filter((s) => s.rowIndex === i)
        .sort((a, b) => {
          // 같은 행에서 선택된 종목들을 전체 selectedList에서의 순서로 정렬
          const aIndex = selectedList.findIndex((s) => s.symbol === a.symbol);
          const bIndex = selectedList.findIndex((s) => s.symbol === b.symbol);
          return bIndex - aIndex; // 최신 선택이 먼저 오도록 역순 정렬
        });

      selectedInRow.forEach((s) => {
        const rec = recommendations.find((r) => r.symbol === s.symbol);
        if (rec) {
          result.push({
            type: "recommend",
            data: rec.recList,
            symbol: s.symbol, // 추천 종목의 원본 심볼 추가
            rowIndex: i,
          });
        }
      });
    }

    return result;
  };

  const isSelected = (symbol) => selectedList.some((s) => s.symbol === symbol);

  const handleDone = async () => {
    if (selectedList.length < 5) {
      alert("관심 종목을 5개 이상 선택해주세요.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("인증 정보가 없습니다. 다시 로그인 해주세요.");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;

    console.log("✅ JWT Payload:", payload);
    console.log("✅ userId:", userId);

    const selectedIds = selectedList
      .map((s) => {
        const symbol = s.symbol;

        const company =
          originalCompanies.find((c) => c.symbol === symbol) ||
          displayCompanies.find((c) => c.symbol === symbol) ||
          recommendations
            .flatMap((r) => r.recList)
            .find((c) => c.symbol === symbol);

        return company?.id;
      })
      .filter(Boolean);

    const favoritePayload = selectedIds.map((id) => ({ stock_id: id }));
    console.log("✅ favoritePayload (body):", favoritePayload);

    const postUrl = `${process.env.NEXT_PUBLIC_API_URL}/favorites/${userId}`;
    console.log("✅ POST URL:", postUrl);

    try {
      const res = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(favoritePayload),
      });

      console.log("✅ Response status:", res.status);

      const result = await res.json();
      console.log("✅ Response JSON:", result);

      if (!res.ok) throw new Error("저장 실패");

      router.push("/interest-done");
    } catch (err) {
      console.error("❌ 선택 종목 저장 실패", err);
      alert("관심 종목 저장 중 문제가 발생했습니다.");
    }
  };

  const rowsWithRecommendations = buildRowsWithRecommendations();

  return (
    <div className="relative h-screen font-[Pretendard]">
      <div className="h-[calc(100vh-80px)] overflow-y-auto no-scrollbar px-6 pb-40 pt-6">
        <div className="text-center">
          <h1 className="text-[60px] font-semibold text-[#FFFEFE]">
            {username ? `${username}님, 환영합니다!` : "환영합니다!"}
          </h1>
          <p className="mt-1 mb-12 text-[20px] text-[#f7f7f7]">
            관심 종목을 추가하고, 가장 빠른 한글 요약본을 받아보세요
          </p>
        </div>

        <div className="flex flex-col gap-12 pb-24">
          {rowsWithRecommendations.map((row, index) => (
            <AnimatePresence key={`${row.type}-${row.symbol || index}`}>
              {row.type === "recommend" ? (
                <motion.div
                  initial={{ opacity: 0, x: -50, backgroundColor: "#1e2a44" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                    backgroundColor: { duration: 1.2, ease: "easeInOut" },
                  }}
                  className="grid grid-cols-5 gap-x-4 gap-y-5 justify-items-center rounded-xl"
                >
                  {row.data.map((stock) => (
                    <StockItemCard
                      key={stock.symbol}
                      stock={stock}
                      onClick={() => toggleSelect(stock.symbol, row.rowIndex)}
                      selected={isSelected(stock.symbol)}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="grid grid-cols-5 gap-x-4 gap-y-5 justify-items-center"
                >
                  {row.data.map((stock) => (
                    <StockItemCard
                      key={stock.symbol}
                      stock={stock}
                      onClick={() => toggleSelect(stock.symbol, row.rowIndex)}
                      selected={isSelected(stock.symbol)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-20 bg-[#040816]/70 backdrop-blur-md flex justify-center items-center border-t border-white/10 shadow-md">
        <button
          onClick={handleDone}
          className="bg-white text-black cursor-pointer px-6 py-2 rounded-full font-semibold shadow"
        >
          완료
        </button>
      </div>
    </div>
  );
}
