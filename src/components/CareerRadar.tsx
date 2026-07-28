"use client";

import { cn } from "@/lib/utils";

const DIMENSIONS = [
  { key: "depth", label: "专业深度" },
  { key: "communication", label: "沟通表达" },
  { key: "execution", label: "执行力" },
  { key: "learning", label: "学习成长" },
  { key: "innovation", label: "创新思维" },
  { key: "leadership", label: "领导力潜质" },
] as const;

interface CareerRadarProps {
  expertMode: boolean;
  selfScores: number[];
  systemScores: number[];
  className?: string;
}

/**
 * 6维能力雷达图 (SVG)
 * 显示自评 vs 系统评估两条重叠六边形
 */
export function CareerRadar({
  expertMode,
  selfScores,
  systemScores,
  className,
}: CareerRadarProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const levels = 5; // 同心圆层数

  // 计算顶点的坐标
  const getPoint = (index: number, value: number, max: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2; // 从顶部开始
    const r = (value / max) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const labelR = radius + 28;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
    };
  };

  // 生成多边形路径
  const makePath = (scores: number[]) => {
    const points = scores.map((s, i) => getPoint(i, s, 10));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  // 背景网格
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = ((level + 1) / levels) * radius;
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
    return points;
  });

  // 轴线
  const axes = Array.from({ length: 6 }, (_, i) => {
    const p = getPoint(i, 10, 10);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  // 差距数据
  const gaps = DIMENSIONS.map((dim, i) => {
    const self = selfScores[i] ?? 0;
    const sys = systemScores[i] ?? 0;
    return {
      dimension: dim.label,
      self,
      system: sys,
      gap: sys - self,
    };
  });

  const pathColor = expertMode ? "var(--color-expert)" : "var(--color-management)";
  const pathColorAlt = expertMode ? "var(--color-expert-alt)" : "var(--color-management-alt)";

  return (
    <div className={cn("space-y-4", className)}>
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {expertMode ? "专家路线" : "管理路线"} - 能力雷达
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>满分 10</span>
      </div>

      {/* 雷达图 */}
      <div className="flex justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* 背景多边形 */}
          {gridPolygons.map((pts, level) => (
            <polygon
              key={level}
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth={level === levels - 1 ? 1 : 0.5}
            />
          ))}

          {/* 轴线 */}
          {axes.map((axis, i) => (
            <line
              key={i}
              x1={axis.x1}
              y1={axis.y1}
              x2={axis.x2}
              y2={axis.y2}
              stroke="var(--border-subtle)"
              strokeWidth={0.5}
            />
          ))}

          {/* 系统评估多边形 (底层，较粗边框) */}
          <polygon
            points={makePath(systemScores)
              .replace(/[MLZ]/g, "")
              .trim()
              .split(" ")
              .filter(Boolean)
              .reduce<string[]>((acc, _, i, arr) => {
                if (i % 2 === 0) acc.push(`${arr[i]},${arr[i + 1]}`);
                return acc;
              }, [])
              .join(" ")}
            fill={pathColorAlt}
            fillOpacity={0.25}
            stroke={pathColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* 自评多边形 (顶层) */}
          <polygon
            points={makePath(selfScores)
              .replace(/[MLZ]/g, "")
              .trim()
              .split(" ")
              .filter(Boolean)
              .reduce<string[]>((acc, _, i, arr) => {
                if (i % 2 === 0) acc.push(`${arr[i]},${arr[i + 1]}`);
                return acc;
              }, [])
              .join(" ")}
            fill="var(--color-self-fill)"
            fillOpacity={0.2}
            stroke="var(--color-self)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />

          {/* 数据点 (系统评估) */}
          {systemScores.map((s, i) => {
            const p = getPoint(i, s, 10);
            return (
              <circle
                key={`sys-${i}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill={pathColor}
                stroke="white"
                strokeWidth={1}
              />
            );
          })}

          {/* 数据点 (自评) */}
          {selfScores.map((s, i) => {
            const p = getPoint(i, s, 10);
            return (
              <circle
                key={`self-${i}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="var(--color-self)"
                stroke="white"
                strokeWidth={1}
              />
            );
          })}

          {/* 维度标签 */}
          {DIMENSIONS.map((dim, i) => {
            const lp = getLabelPoint(i);
            return (
              <text
                key={dim.key}
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fill: 'var(--text-secondary)', fontSize: "11px" }}
              >
                {dim.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[var(--color-self)]" style={{ borderStyle: "dashed" }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>自评</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 rounded" style={{ backgroundColor: pathColor }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>系统评估</span>
        </div>
      </div>

      {/* 差距表格 */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--border-subtle)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-root)' }}>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>能力维度</th>
              <th className="px-3 py-2 text-center font-medium" style={{ color: 'var(--text-muted)' }}>自评</th>
              <th className="px-3 py-2 text-center font-medium" style={{ color: 'var(--text-muted)' }}>系统评估</th>
              <th className="px-3 py-2 text-center font-medium" style={{ color: 'var(--text-muted)' }}>差距</th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((g, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--bg-root)' }}>
                <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{g.dimension}</td>
                <td className="px-3 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{g.self}</td>
                <td className="px-3 py-2 text-center font-medium" style={{ color: 'var(--text-primary)' }}>
                  {g.system}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={cn(
                      "inline-block px-1.5 py-0.5 rounded text-xs font-medium",
                    )}
                    style={{
                      backgroundColor: g.gap > 0 ? 'var(--color-success-bg)' : g.gap < 0 ? 'var(--color-danger-bg)' : 'var(--bg-root)',
                      color: g.gap > 0 ? 'var(--color-success)' : g.gap < 0 ? 'var(--color-danger)' : 'var(--text-muted)',
                    }}
                  >
                    {g.gap > 0 ? "+" : ""}
                    {g.gap}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
