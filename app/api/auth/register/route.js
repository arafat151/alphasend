import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { sendOTP } from "@/lib/mailer";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  const body = await request.json();

  // Resend OTP
  if (body.resend && body.email) {
    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const { data: user } = await supabase.from("users").select("name").eq("email", body.email).single();
    await supabase.from("users").update({ verify_code: code, verify_expires: expires.toISOString() }).eq("email", body.email);
    await sendOTP({ to: body.email, name: user?.name || "User", code });
    return Response.json({ success: true });
  }

  const { name, email, phone, password } = body;
  if (!name || !email || !password) {
    return Response.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Check existing
  const { data: existing } = await supabase.from("users").select("id").eq("email", email).single();
  if (existing) return Response.json({ error: "Email already registered" }, { status: 409 });

  const password_hash = await bcrypt.hash(password, 10);
  const code = generateOTP();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  // Check if this should be admin
  const isAdmin = email === process.env.ADMIN_EMAIL;

  const { error } = await supabase.from("users").insert({
    name, email, phone: phone || null, password_hash,
    verify_code: code, verify_expires: expires.toISOString(),
    is_admin: isAdmin,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await sendOTP({ to: email, name, code });
  return Response.json({ success: true, message: "Verification code sent" });
}
