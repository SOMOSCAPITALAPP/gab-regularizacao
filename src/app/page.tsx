import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppClient } from "@/components/app-client";

export default async function Home() {
  const cookieStore = await cookies();
  if (cookieStore.get("gab_session")?.value !== "authenticated") {
    redirect("/login");
  }

  return <AppClient />;
}
