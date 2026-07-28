import { redirect } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "执策",
    description: "轻量级项目协作工具",
  };
}

export default async function HomePage() {
  redirect("/dashboard");
}