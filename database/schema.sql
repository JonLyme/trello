CREATE DATABASE IF NOT EXISTS react_jwt_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE react_jwt_app;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_originalName VARCHAR(255) NOT NULL DEFAULT '',
  avatar_storedName VARCHAR(255) NOT NULL DEFAULT '',
  avatar_url VARCHAR(255) NOT NULL DEFAULT '',
  resume_originalName VARCHAR(255) NOT NULL DEFAULT '',
  resume_storedName VARCHAR(255) NOT NULL DEFAULT '',
  resume_url VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workplaces (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(191) NOT NULL,
  image_originalName VARCHAR(255) NOT NULL DEFAULT '',
  image_storedName VARCHAR(255) NOT NULL DEFAULT '',
  image_url VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workplaces_user (user_id),
  CONSTRAINT fk_workplaces_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS todos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workplace_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_todos_workplace_order (workplace_id, sort_order),
  CONSTRAINT fk_todos_workplace
    FOREIGN KEY (workplace_id) REFERENCES workplaces (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  todo_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(140) NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tickets_todo_order (todo_id, sort_order),
  CONSTRAINT fk_tickets_todo
    FOREIGN KEY (todo_id) REFERENCES todos (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  message VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_user_created (user_id, created_at),
  CONSTRAINT fk_activity_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;