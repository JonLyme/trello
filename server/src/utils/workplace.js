export function toPublicWorkplace(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
