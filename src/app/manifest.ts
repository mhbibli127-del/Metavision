import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Metavision",
    short_name: "Metavision",
    description: "AI-powered restaurant operations platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      {
        src: "/nav-logo.png",
        sizes: "77x77",
        type: "image/png",
      },
    ],
  };
}
