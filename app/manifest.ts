import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Visible Medicine",
    short_name: "Visible Medicine",
    description: "Interactive medical imaging education, by Elivion.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F7F2",
    theme_color: "#041A23",
    icons: [
      {
        src: "/brand/icons/pwa-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icons/pwa-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/icons/pwa-maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
