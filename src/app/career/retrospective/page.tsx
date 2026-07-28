'use client';

import { useState, useEffect } from 'react';

type RetrospectiveType = 'daily' | 'weekly' | 'monthly' | 'annual';

interface RetroItem {
  id: string;
  type: RetrospectiveType;
  energyLevel: number;
  focusLevel: number;
  satisfaction: number;
  aiSummary?: string | null;
  createdAt: string;
}

const TYPE_TABS: { type: RetrospectiveType; label: string }[] = [
  { type: 'daily', label: '日报' },
  { type: 'weekly', label: '周报' },
  { type: 'monthly', label: '月报' },
  { type: 'annual', label: '年报' },
];

const renderStars = (value: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < value ? 'text-[var(--color-warning)]' : 'text-[var(--text-muted)]'}>★</span>
  ));
};

export default function RetrospectivePage() {
  const [activeType, setActiveType] = useState<RetrospectiveType>('daily');
  const [items, setItems] = useState<RetroItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/career/retrospective?type=${activeType}`)
      .then(r => r.json())
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeType]);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-6">复盘中心</h1>

      <div className="flex gap-2 mb-8">
        {TYPE_TABS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeType === type
                ? 'bg-[var(--color-success)] text-[var(--text-inverse)] shadow-sm'
                : ''
            }`}
            style={
              activeType === type
                ? undefined
                : { backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          暂无{TYPE_TABS.find(t => t.type === activeType)?.label}记录
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(item.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <span style={{ color: 'var(--text-muted)' }}>精力</span>
                    {renderStars(item.energyLevel)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: 'var(--text-muted)' }}>专注</span>
                    {renderStars(item.focusLevel)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: 'var(--text-muted)' }}>满意度</span>
                    {renderStars(item.satisfaction)}
                  </span>
                </div>
              </div>
              {item.aiSummary && (
                <p className="text-sm rounded p-3" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-root)' }}>{item.aiSummary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
