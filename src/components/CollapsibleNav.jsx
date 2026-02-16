import { useState, useEffect } from "react";
import { Hammer, Coins, BookOpen, ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";
import { NAV_SECTIONS } from "../config/explainers";
import "./CollapsibleNav.css";

const ICONS = {
  hammer: Hammer,
  coins: Coins,
  book: BookOpen,
};

export default function CollapsibleNav({ activeExplainer, setActiveExplainer }) {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem("navCollapsed");
    return stored ? JSON.parse(stored) : false;
  });
  const [expandedSections, setExpandedSections] = useState(() => {
    const stored = localStorage.getItem("navExpanded");
    return stored ? JSON.parse(stored) : { forge: true, earn: true, learn: true };
  });

  useEffect(() => {
    localStorage.setItem("navCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("navExpanded", JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSection = (sectionId) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedSections((prev) => ({ ...prev, [sectionId]: true }));
    } else {
      setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    }
  };

  const handleItemClick = (itemId) => {
    setActiveExplainer(itemId);
  };

  return (
    <nav className={`collapsible-nav ${collapsed ? "nav-collapsed" : ""}`}>
      <button className="nav-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand menu" : "Collapse menu"}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="nav-content">
        {NAV_SECTIONS.map((section) => {
          const Icon = ICONS[section.icon];
          const isExpanded = expandedSections[section.id];

          return (
            <div key={section.id} className="nav-section">
              <button className="nav-section-header" onClick={() => toggleSection(section.id)}>
                <Icon size={18} className="nav-section-icon" />
                {!collapsed && (
                  <>
                    <span className="nav-section-label">{section.label}</span>
                    <ChevronDown
                      size={14}
                      className="nav-section-chevron"
                      style={{ transform: isExpanded ? "rotate(0)" : "rotate(-90deg)" }}
                    />
                  </>
                )}
              </button>

              {!collapsed && isExpanded && (
                <div className="nav-items">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      className={`nav-item ${activeExplainer === item.id ? "nav-item-active" : ""}`}
                      onClick={() => handleItemClick(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
