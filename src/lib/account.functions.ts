import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? { id: userId, full_name: "", phone: "", avatar_url: null };
  });

const profileInput = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().nullable(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: data.full_name, phone: data.phone ?? null });
    if (error) throw error;
    return { ok: true };
  });

export const listAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("addresses")
      .select("id, label, full_name, phone, line1, line2, city, state, pincode, country, is_default")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const addressInput = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().max(40).optional().nullable(),
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  country: z.string().trim().max(60).default("India"),
  is_default: z.boolean().default(false),
});

export const saveAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addressInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }
    if (data.id) {
      const { error } = await supabase
        .from("addresses")
        .update({ ...data, user_id: userId })
        .eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    } else {
      const { id: _omit, ...insertData } = data;
      const { data: row, error } = await supabase
        .from("addresses")
        .insert({ ...insertData, user_id: userId })
        .select("id")
        .single();
      if (error) throw error;
      return { id: row.id };
    }
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("addresses").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
