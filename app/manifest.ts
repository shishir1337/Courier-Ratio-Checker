import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Courier Ratio Checker – G TE Goyna",
        short_name: "G TE Goyna",
        description:
            "Internal courier delivery history and fraud risk checker for G TE Goyna (গ তে গয়না)",
        start_url: "/",
        display: "standalone",
        background_color: "#F5F5F7",
        theme_color: "#F5F5F7",
        orientation: "portrait",
        categories: ["business", "utilities"],
        icons: [
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
