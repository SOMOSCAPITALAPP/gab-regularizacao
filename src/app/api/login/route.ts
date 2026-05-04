import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@gab.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (email === adminEmail && password === adminPassword) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set("gab_session", "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
}
