import React, { useState, useEffect, useRef } from "react";
import "../../styles/profile.css";

const tabs = [
  { key: "orders", label: "Lịch sử đơn hàng" },
  { key: "points", label: "Điểm Thưởng" },
  { key: "wishlist", label: "Danh sách Yêu thích" },
  { key: "addresses", label: "Sổ địa chỉ" },
  { key: "settings", label: "Cài đặt" },
];

const ProfileTabs = ({ activeTab, setActiveTab }) => {
  const [underlineStyle, setUnderlineStyle] = useState({ width: 0, left: 0 });
  const tabsRef = useRef([]);
  const navRef = useRef();

  useEffect(() => {
    const activeTabIndex = tabs.findIndex((tab) => tab.key === activeTab);
    const activeTabElement = tabsRef.current[activeTabIndex];
    const navElement = navRef.current;

    if (activeTabElement && navElement) {
      const tabRect = activeTabElement.getBoundingClientRect();
      const navRect = navElement.getBoundingClientRect();
      setUnderlineStyle({
        left: tabRect.left - navRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  return (
    <nav ref={navRef} className="profile-tabs-nav">
      {tabs.map((tab, index) => (
        <button
          key={tab.key}
          ref={(el) => (tabsRef.current[index] = el)}
          onClick={() => setActiveTab(tab.key)}
          className={`profile-tab-button ${
            activeTab === tab.key
              ? "profile-tab-button-active"
              : "profile-tab-button-inactive"
          }`}
        >
          {tab.label}
        </button>
      ))}
      <div className="profile-tab-underline" style={underlineStyle} />
    </nav>
  );
};

export default ProfileTabs;
