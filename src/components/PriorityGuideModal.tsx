"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  taskTitle: string;
  taskDescription?: string;
  onResult?: (result: PriorityResult) => void;
}

interface PriorityResult {
  score: number;
  priority: string;
  reasoning: string;
  tips: string[];
  aiAnalysis?: {
    analysis: string;
    actionPlan: string[];
  } | null;
}

const DIMENSIONS = [
  {
    name: "紧急程度",
    question: "这个任务是否有明确的截止日期或时间压力？",
    options: ["非常紧急", "比较紧急", "一般", "不紧急"],
  },
  {
    name: "重要程度",
    question: "这个任务对你的核心目标有多大影响？",
    options: ["极其重要", "很重要", "一般重要", "不太重要"],
  },
  {
    name: "精力匹配",
    question: "你当前精力状态如何匹配这个任务？",
    options: ["精力充沛", "适中状态", "有点疲惫", "需要休息"],
  },
  {
    name: "价值杠杆",
    question: "这个任务完成后能产生多大长期价值？",
    options: ["高杠杆", "中杠杆", "低杠杆", "负杠杆"],
  },
];

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "紧急",
  high: "高优先",
  medium: "中等",
  low: "低优先",
};

export function PriorityGuideModal({ open, onClose, taskTitle, taskDescription, onResult }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1, -1]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriorityResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const progress = ((step + 1) / (DIMENSIONS.length + 1)) * 100;

  const handleSelect = useCallback(
    (value: number) => {
      const next = [...answers];
      next[step] = value;
      setAnswers(next);
    },
    [answers, step]
  );

  const submitAnswers = useCallback(async (answers: number[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle,
          taskDescription,
          answers: answers.map((a) => 3 - a),
          useAI: false,
        }),
      });
      if (!res.ok) throw new Error("评估失败");
      const data = await res.json();
      setResult(data);
      setStep(DIMENSIONS.length);
    } catch (e) {
      console.error("优先级评估失败:", e);
    } finally {
      setLoading(false);
    }
  }, [taskTitle, taskDescription]);

  function handleNext() {
    if (step < DIMENSIONS.length - 1) {
      setStep(step + 1);
    } else {
      submitAnswers(answers);
    }
  }

  function handlePrev() {
    if (result) {
      setResult(null);
      setStep(0);
      setAnswers([-1, -1, -1, -1]);
      return;
    }
    if (step > 0) setStep(step - 1);
  }

  async function getAIAnalysis() {
    if (!result) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle,
          taskDescription,
          answers: answers.map((a) => 3 - a),
          useAI: true,
        }),
      });
      if (!res.ok) throw new Error("AI 分析失败");
      const data = await res.json();
      setResult({ ...result, aiAnalysis: data.aiAnalysis });
    } catch (e) {
      console.error("AI 分析失败:", e);
    } finally {
      setAiLoading(false);
    }
  }

  const title = result
    ? `评估结果 · ${PRIORITY_LABELS[result.priority] || ""}`
    : "优先级评估";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="ghost" onClick={handlePrev} disabled={step === 0 && !result}>
            {result ? "重新评估" : "上一步"}
          </Button>
          {!result && (
            <Button onClick={handleNext} disabled={answers[step] === -1 || loading}>
              {step < DIMENSIONS.length - 1 ? "下一步" : "生成评估"}
            </Button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 rounded-full"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : !result ? (
        <div>
          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              <span>第 {step + 1} 步 / {DIMENSIONS.length} 步</span>
              <span>{DIMENSIONS[step].name}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </div>

          {/* 问题 */}
          <div className="mb-6">
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{DIMENSIONS[step].name}</p>
            <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{DIMENSIONS[step].question}</p>
          </div>

          {/* 选项 */}
          <div className="space-y-2">
            {DIMENSIONS[step].options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className="w-full text-left p-3 rounded-xl border-2 transition-all duration-150"
                style={{
                  borderColor: answers[step] === i ? 'var(--accent)' : 'var(--border-subtle)',
                  backgroundColor: answers[step] === i ? 'var(--bg-root)' : undefined,
                }}
              >
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{option}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* 结果展示 */
        <div className="space-y-5">
          {/* 分数圈 */}
          <div className="flex flex-col items-center py-3">
            <div className="relative w-24 h-24 mb-3">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="#1f2937" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.score / 100)}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{result.score}</span>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>综合评分</p>
          </div>

          {/* 推理说明 */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-root)' }}>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>分析</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{result.reasoning}</p>
          </div>

          {/* 建议 */}
          {result.tips.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>建议</p>
              <div className="space-y-1.5">
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#9ca3af' }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 深度分析 */}
          {!result.aiAnalysis && !aiLoading && (
            <Button variant="ghost" size="sm" onClick={getAIAnalysis} className="w-full">
              🤖 AI 深度分析
            </Button>
          )}
          {aiLoading && (
            <div className="text-center text-sm py-2" style={{ color: 'var(--text-muted)' }}>AI 分析中...</div>
          )}
          {result.aiAnalysis && (
            <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: '#eff6ff' }}>
              <p className="text-xs font-medium" style={{ color: '#1d4ed8' }}>🤖 AI 深度分析</p>
              <p className="text-sm" style={{ color: '#1e40af' }}>{result.aiAnalysis.analysis}</p>
              {result.aiAnalysis.actionPlan.length > 0 && (
                <div className="space-y-1">
                  {result.aiAnalysis.actionPlan.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#4338ca' }}>
                      <span className="font-mono text-xs">{i + 1}.</span>
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
