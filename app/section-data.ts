export const sectionPages = {
  research: { number: "02", title: "Research", eyebrow: "Questions and investigations", lead: "Understanding intelligence takes more than one kind of explanation.", body: "Research notes and active questions will be collected here as they are ready to share." },
  publications: { number: "03", title: "Publications", eyebrow: "Writing and evidence", lead: "A place for essays, reports, and future papers.", body: "The publication index is being prepared. No papers are listed yet." },
  projects: { number: "04", title: "Projects", eyebrow: "Models and experiments", lead: "Ideas become clearer when they can be tested.", body: "Projects, models, datasets, and code will be indexed here as they are released." },
  "lab-notebook": { number: "05", title: "Lab Notebook", eyebrow: "Work in progress", lead: "Inquiry includes revision, uncertainty, and unexpected results.", body: "Notebook entries will appear here when they are ready to share." },
  cv: { number: "06", title: "CV", eyebrow: "Background and methods", lead: "A concise overview of experience and methods.", body: "This section is being prepared." }
} as const;

export type SectionSlug = keyof typeof sectionPages;
