export function toPublicUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    avatarOriginalName: row.avatar_originalName || '',
    avatarUrl: row.avatar_url || '',
    resume_originalName: row.resume_originalName || '',
    resume_url: row.resume_url || '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
