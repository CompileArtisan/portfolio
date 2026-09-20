export default {
    name: "publication",
    title: "Publication",
    type: "document",
    fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "venue", title: "Venue / conference", type: "string" },
        { name: "dateLabel", title: "Date", type: "string" },
        { name: "presentationType", title: "Type (e.g. Oral)", type: "string" },
        {
            name: "authors",
            title: "Authors (in order; mark self)",
            type: "array",
            of: [
                {
                    type: "object",
                    fields: [
                        { name: "name", type: "string" },
                        {
                            name: "isSelf",
                            type: "boolean",
                            title: "This is me (bold)",
                        },
                    ],
                },
            ],
        },
        {
            name: "paperUrl",
            title: "Paper link",
            type: "link",
            description: "Link to the published paper OR upload the PDF directly.",
        },
    ],
};
