import React from "react";

interface PlanStepperProps {
  currentStep: number; // 0 = plano, 1 = touros, 2 = resultados
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { label: "Plano Genético", icon: "①" },
  { label: "Touros", icon: "②" },
  { label: "Resultados", icon: "③" },
];

export function PlanStepper({ currentStep, onStepClick }: PlanStepperProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "12px 0",
        marginBottom: 16,
      }}
    >
      {STEPS.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const isClickable = !!onStepClick;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <div
                style={{
                  width: 60,
                  height: 2,
                  background: isCompleted ? "#BE1E2D" : "#D9D9D9",
                  margin: "0 4px",
                }}
              />
            )}
            <div
              onClick={() => isClickable && onStepClick?.(idx)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: isClickable ? "pointer" : "default",
                opacity: isActive || isCompleted ? 1 : 0.5,
                transition: "opacity 0.2s",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                  background: isActive ? "#BE1E2D" : isCompleted ? "#BE1E2D" : "#D9D9D9",
                  color: isActive || isCompleted ? "#fff" : "#1C1C1C",
                  border: isActive ? "3px solid #8B0000" : "none",
                }}
              >
                {isCompleted ? "✓" : step.icon}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#BE1E2D" : "#1C1C1C",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
