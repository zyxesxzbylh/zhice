import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6个字符" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 在 Supabase Auth 中注册
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "该邮箱已被注册" },
          { status: 409 }
        );
      }
      throw error;
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "注册失败，请稍后重试" },
        { status: 500 }
      );
    }

    // 2. 自动登录，建立 session cookie
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("注册后自动登录失败:", signInError);
      // 注册成功但无法自动登录，仍返回 201，让用户手动登录
      return NextResponse.json(
        {
          user: {
            id: data.user.id,
            email: data.user.email ?? email,
          },
          needConfirm: true,
        },
        { status: 201 }
      );
    }

    // 3. 在 public.users 中创建关联记录
    await db.insert(users).values({
      id: data.user.id,
      email: data.user.email ?? email,
      authId: data.user.id,
    });

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email ?? email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
