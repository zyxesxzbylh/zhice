"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

/* ── 类型定义 ── */

export interface TourStep {
  /** 步骤编号 */
  id: number;
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description: string;
  /** CSS 选择器，定位要高亮的元素 */
  selector: string;
  /** 目标所在页面路由，为空则不限 */
  page?: string;
  /** 提示卡片相对于高亮元素的位置 */
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** 提示卡片内置的横向偏移补偿 (px) */
  offsetX?: number;
  /** 提示卡片内置的纵向偏移补偿 (px) */
  offsetY?: number;
  /** 步骤类别图标 */
  icon?: string;
}

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  steps: TourStep[];
  startTour: (steps: TourStep[]) => void;
  stopTour: () => void;
  goNext: () => void;
  goPrev: () => void;
}

/* ── Context ── */

const TourContext = createContext<TourContextValue | null>(null);

export function useGuidedTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useGuidedTour 必须在 GuidedTourProvider 内使用");
  return ctx;
}

/* ── Provider ── */

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const transitioningRef = useRef(false);

  const totalSteps = steps.length;

  const startTour = useCallback((newSteps: TourStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsActive(true);
    transitioningRef.current = false;
  }, []);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setSteps([]);
    setCurrentStep(0);
    transitioningRef.current = false;
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const nextStep = steps[currentStep + 1];
      if (nextStep.page && nextStep.page !== pathname) {
        transitioningRef.current = true;
        setCurrentStep((s) => s + 1);
        router.push(nextStep.page);
      } else {
        setCurrentStep((s) => s + 1);
      }
    }
  }, [currentStep, steps, pathname, router]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = steps[currentStep - 1];
      if (prevStep.page && prevStep.page !== pathname) {
        transitioningRef.current = true;
        setCurrentStep((s) => s - 1);
        router.push(prevStep.page);
      } else {
        setCurrentStep((s) => s - 1);
      }
    }
  }, [currentStep, steps, pathname, router]);

  // 当页面跳转完成，重置过渡标记
  useEffect(() => {
    if (transitioningRef.current && isActive) {
      transitioningRef.current = false;
    }
  }, [pathname, isActive]);

  // 键盘事件
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") stopTour();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, stopTour, goNext, goPrev]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps,
        steps,
        startTour,
        stopTour,
        goNext,
        goPrev,
      }}
    >
      {children}
      {isActive && <TourOverlay />}
    </TourContext.Provider>
  );
}

/* ── 蒙版高亮层 ── */

function TourOverlay() {
  const { steps, currentStep, totalSteps, goNext, goPrev, stopTour } =
    useGuidedTour();
  const step = steps[currentStep];
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [missing, setMissing] = useState(false);
  const rafRef = useRef<number>(0);

  // 定位目标元素
  const locate = useCallback(() => {
    if (!step) return;
    try {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        setRect(el.getBoundingClientRect());
        setMissing(false);
        // 滚动到可见区域
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setMissing(true);
      }
    } catch {
      setMissing(true);
    }
  }, [step]);

  useEffect(() => {
    locate();
    // 用 rAF 轮询处理动态渲染的元素
    let attempts = 0;
    const maxAttempts = 30;
    const poll = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        setRect(el.getBoundingClientRect());
        setMissing(false);
        return;
      }
      attempts++;
      if (attempts < maxAttempts) {
        rafRef.current = requestAnimationFrame(poll);
      } else {
        setMissing(true);
      }
    };
    if (!rect && !missing) {
      rafRef.current = requestAnimationFrame(poll);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [step, locate]);

  // 监听窗口变化
  useEffect(() => {
    const onResize = () => locate();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [locate]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  // 计算高亮洞口和提示位置
  const hole = rect
    ? {
        left: rect.left - 6,
        top: rect.top - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        borderRadius: 12,
      }
    : null;

  // 提示卡片位置
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hole || missing) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    const placement = step.placement || "bottom";
    const gap = 16;
    const offsetX = step.offsetX || 0;
    const offsetY = step.offsetY || 0;

    switch (placement) {
      case "bottom":
        return {
          top: hole.top + hole.height + gap + offsetY,
          left: hole.left + hole.width / 2 + offsetX,
          transform: "translateX(-50%)",
        };
      case "top":
        return {
          bottom: window.innerHeight - hole.top + gap - offsetY,
          left: hole.left + hole.width / 2 + offsetX,
          transform: "translateX(-50%)",
        };
      case "right":
        return {
          top: hole.top + hole.height / 2 + offsetY,
          left: hole.left + hole.width + gap + offsetX,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          top: hole.top + hole.height / 2 + offsetY,
          right: window.innerWidth - hole.left + gap - offsetX,
          transform: "translateY(-50%)",
        };
      case "center":
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
      default:
        return {
          top: hole.top + hole.height + gap + offsetY,
          left: hole.left + hole.width / 2 + offsetX,
          transform: "translateX(-50%)",
        };
    }
  };

  if (!step) return null;

  return (
    <>
      {/* 蒙版 + 高亮洞 */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ pointerEvents: "all" }}
        onClick={(e) => {
          // 点击蒙版空白区域不做任何事（阻止穿透）
          e.stopPropagation();
        }}
      >
        {/* 用 box-shadow 实现洞口效果 */}
        {hole ? (
          <div
            className="absolute rounded-xl"
            style={{
              left: hole.left,
              top: hole.top,
              width: hole.width,
              height: hole.height,
              borderRadius: hole.borderRadius,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
              background: "transparent",
              pointerEvents: "none",
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}

        {/* 洞口脉冲边框 */}
        {hole && (
          <div
            className="absolute rounded-xl"
            style={{
              left: hole.left,
              top: hole.top,
              width: hole.width,
              height: hole.height,
              borderRadius: hole.borderRadius,
              border: "2px solid rgba(255, 255, 255, 0.6)",
              boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)",
              pointerEvents: "none",
              animation: "tourPulse 2s ease-in-out infinite",
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}
      </div>

      {/* 提示卡片 */}
      <div
        className="fixed z-[9999] w-[320px] max-w-[90vw]"
        style={{
          ...getTooltipStyle(),
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="rounded-xl p-5 shadow-2xl"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          {/* 图标 + 步骤指示 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {step.icon && <span className="text-lg">{step.icon}</span>}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                }}
              >
                步骤 {currentStep + 1} / {totalSteps}
              </span>
            </div>
            <button
              onClick={stopTour}
              className="p-0.5 rounded hover:bg-[var(--bg-muted)] transition-colors"
              style={{ color: "var(--text-muted)" }}
              title="退出引导"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 标题 */}
          <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            {step.title}
          </h3>

          {/* 描述 */}
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            {step.description}
          </p>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between">
            <button
              onClick={stopTour}
              className="text-xs transition-colors hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              跳过引导
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={goPrev}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-muted)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  上一步
                </button>
              )}
              <button
                onClick={isLast ? stopTour : goNext}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isLast ? "完成" : "下一步"}
              </button>
            </div>
          </div>
        </div>

        {/* 小三角指示器 */}
        {hole && !missing && step.placement !== "center" && (
          <div
            className="absolute w-3 h-3 rotate-45"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderTop: "none",
              borderRight: "none",
              ...getArrowStyle(step.placement || "bottom"),
            }}
          />
        )}
      </div>

      {/* 进度条 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] h-0.5"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
      >
        <div
          className="h-full transition-all duration-350"
          style={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.15), 0 0 30px rgba(59, 130, 246, 0.3); }
        }
      `}</style>
    </>
  );
}

/** 计算小三角位置 */
function getArrowStyle(
  placement: "top" | "bottom" | "left" | "right",
): React.CSSProperties {
  switch (placement) {
    case "bottom":
      return { top: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)" };
    case "top":
      return { bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)" };
    case "right":
      return { left: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)" };
    case "left":
      return { right: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)" };
  }
}
