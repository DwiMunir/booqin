// Minimal config so `sanity typegen` finds a project root. Studio lives in a separate repo;
// typegen only reads schema.json + queries, so projectId/dataset are placeholders.
export default {
  api: {
    projectId: process.env.SANITY_PROJECT_ID ?? 'placeholder',
    dataset: process.env.SANITY_DATASET ?? 'production',
  },
}
