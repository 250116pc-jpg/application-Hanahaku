USE hanahaku;

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    target_user_id INT NOT NULL,
    action VARCHAR(64) NOT NULL,
    details JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY admin_audit_created_at (created_at, id),
    KEY admin_audit_admin_user (admin_user_id),
    KEY admin_audit_target_user (target_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
