import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
    name: "default",
    title: "Portfolio CMS",

    // Replace with your own project ID + dataset (from sanity.io/manage
    // or `sanity init` — this scaffold does not run against a live project
    // until you fill these in).
    projectId: "hob493ap",
    dataset: "production",

    plugins: [structureTool(), visionTool()],

    schema: {
        types: schemaTypes,
    },
});
