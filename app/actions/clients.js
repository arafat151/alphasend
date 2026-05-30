"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

// Fetch all clients ordered by creation date
export async function getClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, api_key, status, gmail_user, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Toggle a client's status between active ↔ inactive
export async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";

  const { error } = await supabase
    .from("clients")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

// Add a new client with an auto-generated API key
export async function addClient(formData) {
  const name = formData.get("name")?.toString().trim();
  const gmailUser = formData.get("gmail_user")?.toString().trim();
  const gmailAppPassword = formData.get("gmail_app_password")?.toString().trim();

  if (!name || !gmailUser || !gmailAppPassword) {
    throw new Error("All fields are required.");
  }

  const apiKey = "as_live_" + randomBytes(20).toString("hex");

  const { error } = await supabase.from("clients").insert({
    name,
    api_key: apiKey,
    status: "active",
    gmail_user: gmailUser,
    gmail_app_password: gmailAppPassword,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

// Delete a client permanently
export async function deleteClient(id) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
