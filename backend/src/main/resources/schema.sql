-- ============================================================================
-- SCAALABLE - Web Dialer + CRM
-- MySQL 8.x Database Schema
-- ============================================================================

-- Idempotent: safe to run on every startup (also used by the Docker image).
-- To wipe and rebuild all data, run the DROP statements below manually.

-- ----------------------------------------------------------------------------
-- USERS: all system users (admins, managers, agents)
-- Default admin is seeded by the application on first start (admin / admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name    VARCHAR(100) NOT NULL,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(120) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,                    -- BCrypt hash
    phone        VARCHAR(20),
    role         ENUM('ADMIN', 'MANAGER', 'AGENT') NOT NULL,
    status       ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- LEADS: prospect / customer records to be called by agents
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    lead_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name     VARCHAR(80)  NOT NULL,
    last_name      VARCHAR(80),
    phone          VARCHAR(20)  NOT NULL,                  -- primary dialing number
    alt_phone      VARCHAR(20),
    email          VARCHAR(120),
    company        VARCHAR(120),
    source         VARCHAR(60),                            -- WEB, REFERRAL, CAMPAIGN, CSV ...
    city           VARCHAR(80),
    state          VARCHAR(80),
    country        VARCHAR(80),
    status         ENUM('NEW', 'ASSIGNED', 'CONTACTED', 'FOLLOW_UP',
                        'NOT_INTERESTED', 'CONVERTED', 'CLOSED')
                   NOT NULL DEFAULT 'NEW',
    notes          TEXT,
    address        TEXT,
    map_url        TEXT,
    rating         VARCHAR(50),
    category       VARCHAR(120),
    open_hours     VARCHAR(255),
    website        VARCHAR(255),
    facebook       VARCHAR(255),
    instagram      VARCHAR(255),
    twitter        VARCHAR(255),
    created_by     BIGINT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lead_created_by FOREIGN KEY (created_by) REFERENCES users (user_id),
    INDEX idx_lead_status (status),
    INDEX idx_lead_phone (phone)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- LEAD ASSIGNMENTS: which lead is currently / was historically assigned to
-- which agent. A lead has at most one ACTIVE assignment (unassigned_at NULL).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_assignments (
    assignment_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    lead_id BIGINT NOT NULL,

    assigned_to BIGINT NOT NULL,

    assigned_by BIGINT NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    unassigned_at TIMESTAMP NULL,

    CONSTRAINT fk_assignment_lead
        FOREIGN KEY (lead_id)
        REFERENCES leads(lead_id),

    CONSTRAINT fk_assignment_user
        FOREIGN KEY (assigned_to)
        REFERENCES users(user_id),

    CONSTRAINT fk_assignment_by
        FOREIGN KEY (assigned_by)
        REFERENCES users(user_id)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- DISPOSITIONS: outcome of a call (Connected, No Answer, Busy, ...)
-- Seeded by the application on first start.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositions (
    disposition_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    disposition_name VARCHAR(80) NOT NULL UNIQUE,
    description      VARCHAR(255)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- CALL LOGS: every call placed through the Plivo dialer
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS call_logs (
    call_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id           BIGINT NOT NULL,
    user_id           BIGINT NOT NULL,                     -- agent who made the call
    twilio_call_sid   VARCHAR(64),                         -- provider call ID (kept for backward compat)
    direction         ENUM('OUTBOUND', 'INBOUND') NOT NULL DEFAULT 'OUTBOUND',
    from_number       VARCHAR(20),
    to_number         VARCHAR(20),
    call_status       VARCHAR(40),                         -- Plivo status: completed, busy, no-answer...
    start_time        DATETIME,
    end_time          DATETIME,
    duration_seconds  INT,
    recording_url     VARCHAR(500),
    disposition_id    BIGINT NULL,
    notes             TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_call_lead        FOREIGN KEY (lead_id)        REFERENCES leads (lead_id),
    CONSTRAINT fk_call_user        FOREIGN KEY (user_id)        REFERENCES users (user_id),
    CONSTRAINT fk_call_disposition FOREIGN KEY (disposition_id) REFERENCES dispositions (disposition_id),
    INDEX idx_call_lead (lead_id),
    INDEX idx_call_user (user_id),
    INDEX idx_call_sid (twilio_call_sid)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- FOLLOW UPS: scheduled callbacks for leads
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_ups (
    follow_up_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id        BIGINT NOT NULL,
    user_id        BIGINT NOT NULL,
    follow_up_date DATETIME NOT NULL,
    note           VARCHAR(255),
    status         ENUM('PENDING', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_followup_lead FOREIGN KEY (lead_id) REFERENCES leads (lead_id),
    CONSTRAINT fk_followup_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    INDEX idx_followup_date (follow_up_date)
) ENGINE = InnoDB;
