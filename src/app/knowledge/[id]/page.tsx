'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface KnowledgeDetail {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  category?: string | null;
  sourceType?: string | null;
  linkedTasks: Array<{ id: string; title: string; status?: string }>;
  relations: Array<{ id: string; relationType: string }>;
}

const RELATION_LABELS: Record<string, string> = {
  reference: '参考资料',
  output: '产出物',
  dependency: '前置依赖',
};

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [knowledge, setKnowledge] = useState<KnowledgeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/knowledge/${id}`)
      .then(r => r.json())
      .then(data => { setKnowledge(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8" style={{ color: 'var(--text-muted)' }}>加载中...</div>;
  if (!knowledge) return <div className="p-8" style={{ color: 'var(--text-muted)' }}>未找到该知识条目</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <Link href="/knowledge" className="text-[var(--color-info)] text-sm hover:underline mb-4 inline-block">
        ← 返回知识库
      </Link>

      <h1 className="text-2xl font-bold mb-3">{knowledge.title}</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {knowledge.category && (
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
            {knowledge.category}
          </span>
        )}
        {knowledge.sourceType && (
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
            {knowledge.sourceType}
          </span>
        )}
        {knowledge.relations.map(r => (
          <span key={r.id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--color-info)' }}>
            {RELATION_LABELS[r.relationType] || r.relationType}
          </span>
        ))}
      </div>

      {knowledge.summary && (
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-info)' }}>AI 摘要</h2>
          <p className="text-sm" style={{ color: 'var(--color-info)' }}>{knowledge.summary}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">内容</h2>
        <div className="whitespace-pre-wrap rounded-lg p-4" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          {knowledge.content}
        </div>
      </div>

      {knowledge.linkedTasks.length > 0 && (
        <div className="border-t pt-6" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-lg font-semibold mb-3">关联任务</h2>
          <ul className="space-y-2">
            {knowledge.linkedTasks.map(task => (
              <li key={task.id}>
                <Link href={`/projects/${task.id}`} className="text-[var(--color-info)] hover:underline text-sm">
                  {task.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
