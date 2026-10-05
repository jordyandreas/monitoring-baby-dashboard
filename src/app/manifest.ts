import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nurtory",
    short_name: "Nurtory",
    description: "Keep your little one's journey, from pregnancy through childhood.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ff",
    theme_color: "#7c6ce0",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
