import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("gab_session")?.value === "authenticated") {
    redirect("/");
  }

  return <LoginForm />;
}
