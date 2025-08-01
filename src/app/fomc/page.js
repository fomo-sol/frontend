"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InterestList from "@/components/fomc/InterestList";
import MinutesList from "@/components/fomc/MinutesList";
import ProjectionList from "@/components/fomc/ProjectionList";
const tabs = ["금리 결정 및 연설", "의사록"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) =>
  String(currentYear - i)
);

// 연도별 데이터 (더미데이터 나중에 실제 데이터로 교체)
// (더미데이터 생성 함수 및 데이터 삭제)

export default function FomcPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("금리 결정 및 연설");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleItemClick = (idx) => {
    router.push(`/fomc/${idx + 1}`);
  };

  const renderTabContent = () => {
    if (activeTab === "금리 결정 및 연설") {
      return (
        <InterestList
          selectedYear={selectedYear}
          onItemClick={handleItemClick}
        />
      );
    }
    if (activeTab === "의사록") {
      return (
        <MinutesList
          selectedYear={selectedYear}
          onItemClick={handleItemClick}
        />
      );
    }
    // return (
    //   <ProjectionList
    //     selectedYear={selectedYear}
    //     onItemClick={handleItemClick}
    //   />
    // );
  };

  return (
    <div className="font-[Pretendard] min-h-screen bg-[#040816] text-white overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">FOMC 리스트</h1>
        <p className="text-gray-400 text-sm lg:text-base mb-6">FOMC 일정 및 의사록을 확인하세요</p>

        <div className="flex justify-between items-center border-b border-white/30 mb-6">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-[20px] cursor-pointer font-semibold relative ${
                  activeTab === tab ? "text-white" : "text-gray-400"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 mb-[-3px] left-0 w-full h-[2px] bg-[#93B9FF]" />
                )}
              </button>
            ))}
          </div>

          <div className="pb-2">
            <select
              className="bg-[#F5F5F5] cursor-pointer text-black border-[3px] border-[#E0E0E0] rounded-[4px] px-2 py-1 w-[95px]"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
}
