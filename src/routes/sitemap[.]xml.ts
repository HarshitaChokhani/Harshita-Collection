import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://harshita-collection.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/search", changefreq: "weekly", priority: "0.5" },
        ];

        const categorySlugs = [
          "new-arrivals",
          "suits",
          "kurtis",
          "kurti-pant-sets",
          "sarees",
          "dupattas",
          "trousers",
          "festive-collection",
          "best-sellers",
        ];
        for (const slug of categorySlugs) {
          entries.push({ path: `/category/${slug}`, changefreq: "weekly", priority: "0.8" });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("products")
            .select("slug, updated_at")
            .eq("is_active", true);
          if (data) {
            for (const p of data) {
              entries.push({
                path: `/product/${p.slug}`,
                changefreq: "weekly",
                priority: "0.7",
                lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
              });
            }
          }
        } catch (e) {
          console.error("sitemap product fetch failed", e);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
