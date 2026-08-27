USE react_jwt_app;

CREATE TABLE IF NOT EXISTS workspace_shares (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workplace_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  invited_by BIGINT UNSIGNED NULL,
  permission ENUM('editor') NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_shares_workspace_user (workplace_id, user_id),
  KEY idx_workspace_shares_user (user_id, created_at),
  KEY idx_workspace_shares_invited_by (invited_by),
  CONSTRAINT fk_workspace_shares_workspace
    FOREIGN KEY (workplace_id) REFERENCES workplaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_shares_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_shares_invited_by
    FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;
