"use client";
import { useState } from "react";
import FinancePaging from "@/components/earning/financeList/financePaging";
import WishListPage from "@/components/earning/financeList/wishListPage";
import AddAssetModal from "@/components/earning/financeList/addAsetModal";
import LoginModal from "@/components/common/LoginModal";
import SignupModal from "@/components/common/SignupModal";
import useAuth from "@/utils/useAuth";
import { useRouter } from "next/navigation";

export default function EarningPage() {
  const [view, setView] = useState("finance");
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  // 로그인 필요 confirm 핸들러
  const handleRequireLogin = () => {
    if (window.confirm("로그인이 필요합니다. 로그인하시겠습니까?")) {
      setShowLoginModal(true);
    }
  };

  // 모달 간 전환 함수들
  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <div className="font-[Pretendard] min-h-screen bg-[#040816] text-white overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            실적발표 리스트
          </h1>
          <p className="text-gray-400 text-sm lg:text-base mb-6">
            주요 기업의 실적발표와 관심종목을 확인하세요
          </p>

          {/* 스타일 맞춰서 탭으로 변경했음! */}
          <div className="flex justify-between items-center border-b border-white/30 mb-6">
            <div className="flex gap-8">
              {[
                { key: "finance", label: "실적발표" },
                { key: "wishlist", label: "관심종목" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "wishlist" && !isLoggedIn) {
                      handleRequireLogin();
                      return;
                    }
                    setView(key);
                  }}
                  className={`pb-2 text-[20px] cursor-pointer font-semibold relative ${
                    view === key ? "text-white" : "text-gray-400"
                  }`}
                >
                  {label}
                  {view === key && (
                    <div className="absolute bottom-0 mb-[-3px] left-0 w-full h-[2px] bg-[#93B9FF]" />
                  )}
                </button>
              ))}
            </div>

            <div className="pb-2">
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    handleRequireLogin();
                    return;
                  }
                  setShowModal(true);
                }}
                className="bg-white text-black font-semibold px-4 py-1.5 cursor-pointer rounded hover:bg-gray-700 transition"
              >
                Add Asset
              </button>
            </div>
          </div>

          {view === "finance" && <FinancePaging />}
          {view === "wishlist" && <WishListPage />}

          {showModal && <AddAssetModal onClose={() => setShowModal(false)} />}
        </div>

        {/* 로그인 모달 */}
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToSignup={handleSwitchToSignup}
          />
        )}

        {/* 회원가입 모달 */}
        {showSignupModal && (
          <SignupModal
            onClose={() => setShowSignupModal(false)}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </div>
    </>
  );
}
