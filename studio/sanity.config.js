import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
    name: "default",
    title: "Portfolio CMS",

    // Reads from .env (see .env.example) so no project ID is committed to
    // the repo. Sanity Studio (Vite-based) only exposes env vars prefixed
    // with SANITY_STUDIO_ — set SANITY_STUDIO_PROJECT_ID / _DATASET in a
    // local .env file, or as build-time env vars on your host.
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "your-project-id",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",

    plugins: [structureTool(), visionTool()],

    schema: {
        types: schemaTypes,
    },
});
