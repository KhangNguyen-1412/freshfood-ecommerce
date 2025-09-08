import React from "react";
import { useAppContext } from "../context/AppContext";
import "../styles/pages.css";

const BranchSelector = () => {
  const {
    branches,
    selectedBranch,
    selectedDistrict,
    handleSelectBranch,
    handleSelectDistrict,
  } = useAppContext();

  if (selectedBranch && selectedDistrict) {
    return null;
  }

  return (
    <div className="branch-selector-overlay">
      <div className="branch-selector-panel">
        {!selectedBranch && (
          <>
            <h2 className="text-2xl font-bold mb-2">
              Xem sản phẩm và giao hàng tại
            </h2>
            <div className="space-y-3 mt-6">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch)}
                  className="branch-selector-button bg-green-600 text-white hover:bg-green-700"
                >
                  {branch.city}
                </button>
              ))}
            </div>
          </>
        )}
        {selectedBranch && !selectedDistrict && (
          <>
            <h2 className="text-2xl font-bold mb-2">
              Vui lòng chọn Quận/Huyện
            </h2>
            <div className="space-y-3 max-h-72 overflow-y-auto mt-6 pr-2">
              {(selectedBranch.deliveryDistricts || []).map((district) => (
                <button
                  key={district}
                  onClick={() => handleSelectDistrict(district)}
                  className="branch-selector-button bg-blue-600 text-white hover:bg-blue-700"
                >
                  {district}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BranchSelector;
