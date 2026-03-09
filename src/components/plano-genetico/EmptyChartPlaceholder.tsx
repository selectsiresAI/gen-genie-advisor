import React from "react";
import { BarChart3 } from "lucide-react";

interface EmptyChartPlaceholderProps {
  label: string;
  height?: number;
}

export function EmptyChartPlaceholder({ label, height = 280 }: EmptyChartPlaceholderProps) {
  return (
    <div
      style={{
        width: "100%",
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f9fa",
        border: "2px dashed #D9D9D9",
        borderRadius: 12,
        gap: 12,
      }}
    >
      <BarChart3 style={{ width: 40, height: 40, color: "#9ca3af" }} />
      <div style={{ fontSize: 13, color: "#6b7280", textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>
        {label}
      </div>
    </div>
  );
}
