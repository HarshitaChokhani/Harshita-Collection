import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Not configured", { status: 500 });

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: { event: string; payload: { payment?: { entity: { order_id: string; id: string; status: string } } } };
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const payment = event.payload?.payment?.entity;
        if (!payment) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.event === "payment.captured" || event.event === "payment.authorized") {
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed",
              razorpay_payment_id: payment.id,
            })
            .eq("razorpay_order_id", payment.order_id);
        } else if (event.event === "payment.failed") {
          await supabaseAdmin
            .from("orders")
            .update({ payment_status: "failed", razorpay_payment_id: payment.id })
            .eq("razorpay_order_id", payment.order_id);
        }

        return new Response("ok");
      },
    },
  },
});
