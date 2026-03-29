-- Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_type VARCHAR(50) NOT NULL,
  individual_user_id INTEGER REFERENCES individual_users(id) ON DELETE CASCADE,
  company_employee_id INTEGER REFERENCES company_employees(id) ON DELETE CASCADE,
  email VARCHAR(320),
  phone VARCHAR(50),
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_resets_token_hash_idx ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS password_resets_user_type_idx ON password_resets(user_type);
CREATE INDEX IF NOT EXISTS password_resets_individual_user_id_idx ON password_resets(individual_user_id);
CREATE INDEX IF NOT EXISTS password_resets_company_employee_id_idx ON password_resets(company_employee_id);
