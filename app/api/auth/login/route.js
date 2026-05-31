import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request) {
  const { email, password } = await request.json();

  const { data: user } = await supabase.from("users").select("*").eq("email", email).single();
  if (!user) return Response.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user.is_verified) return Response.json({ error: "Please verify your email first" }, { status: 403 });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return Response.json({ error: "Invalid email or password" }, { status: 401 });

  const token = await signToken({ id: user.id, email: user.email, name: user.name, is_admin: user.is_admin });

  const cookieStore = cookies();
  cookieStore.set("as_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return Response.json({ success: true, is_admin: user.is_admin });
}

// Logout
export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("as_token");
  return Response.json({ success: true });
}
