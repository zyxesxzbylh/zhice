import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export interface Session {
  userId: string;
  email: string;
}

const LOCAL_USER_ID = "local-user-001";
const LOCAL_USER_EMAIL = "local@example.com";

export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user) {
      await ensureUserRecord(user.id, user.email ?? "guest@local");

      return {
        userId: user.id,
        email: user.email ?? "",
      };
    }

    try {
      const { data: anonData, error: anonError } =
        await supabase.auth.signInAnonymously();

      if (anonError || !anonData.user) {
        console.error("匿名登录失败，使用本地模式:", anonError);
        return getLocalSession();
      }

      await ensureUserRecord(anonData.user.id, anonData.user.email ?? "guest@local");

      return {
        userId: anonData.user.id,
        email: anonData.user.email ?? "guest@local",
      };
    } catch (e) {
      console.error("匿名登录异常，使用本地模式:", e);
      return getLocalSession();
    }
  } catch (e) {
    console.error("Supabase 连接失败，使用本地模式:", e);
    return getLocalSession();
  }
}

async function getLocalSession(): Promise<Session> {
  await ensureUserRecord(LOCAL_USER_ID, LOCAL_USER_EMAIL);
  return {
    userId: LOCAL_USER_ID,
    email: LOCAL_USER_EMAIL,
  };
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function ensureUserRecord(userId: string, email: string) {
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existing.length > 0) return;

    const safeEmail = email && email.length > 0
      ? email
      : `${userId.slice(0, 8)}@anonymous.local`;

    try {
      await db.insert(users).values({ id: userId, email: safeEmail, authId: userId });
    } catch (firstError: any) {
      const pgCode = firstError?.code || firstError?.cause?.code;
      if (pgCode === "23505") {
        const retryEmail = `${userId.slice(0, 8)}_${Date.now()}@a.local`;
        try {
          await db.insert(users).values({ id: userId, email: retryEmail, authId: userId });
        } catch (secondError: any) {
          const code2 = secondError?.code || secondError?.cause?.code;
          if (code2 === "23505") return;
          console.error("确保用户记录失败(重试):", secondError);
        }
      } else {
        console.error("确保用户记录失败:", firstError);
      }
    }
  } catch (e: any) {
    console.error("确保用户记录查询失败:", e);
  }
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    await ensureUserRecord(data.user.id, data.user.email ?? email);
  }

  return data;
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    await ensureUserRecord(data.user.id, data.user.email ?? email);
  }

  return data;
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}