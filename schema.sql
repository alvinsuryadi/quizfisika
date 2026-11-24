  -- Jalankan di Neon > SQL Editor (sekali saja).
  CREATE TABLE IF NOT EXISTS test_results (
    id BIGSERIAL PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('pre-test','post-test')),
    answers_json JSONB NOT NULL,
    correct_count SMALLINT NOT NULL,
    score SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS tutor_chat_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user','assistant')),
    content TEXT NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_chat_session ON tutor_chat_logs (session_id);
  CREATE INDEX IF NOT EXISTS idx_chat_ip ON tutor_chat_logs (ip_address, created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_student ON tutor_chat_logs (student_name, class_name, created_at);
