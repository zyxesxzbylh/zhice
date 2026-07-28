"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MethodsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/career");
  }, [router]);

  return (
    <div className="flex h-dvh items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>正在跳转到职业成长...</p>
    </div>
  );
}
