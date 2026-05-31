import { supabase } from "@/lib/supabase";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request) {
  const { email, code } = await request.json();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  if (user.verify_code !== code) return Response.json({ error: "Invalid code" }, { status: 400 });
  if (new Date(user.verify_expires) < new Date()) {
    return Response.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }

  await supabase.from("users").update({ is_verified: true, verify_code: null }).eq("id", user.id);

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
