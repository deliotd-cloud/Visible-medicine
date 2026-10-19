-- Proposed dedicated Education metadata schema only. Do not execute as a migration.
-- Provisioning, writer authority, evidence review and object storage are separate work.
PRAGMA foreign_keys = ON;

CREATE TABLE education_media_clearance_records (
  source_id TEXT NOT NULL CHECK(length(source_id) BETWEEN 1 AND 200),
  source_revision TEXT NOT NULL CHECK(length(source_revision) BETWEEN 1 AND 200),
  clearance_revision TEXT NOT NULL CHECK(length(clearance_revision) BETWEEN 1 AND 200),
  state TEXT NOT NULL CHECK(state IN ('cleared', 'quarantine')),
  privacy_cleared INTEGER NOT NULL CHECK(privacy_cleared IN (0, 1)),
  commercial_use_cleared INTEGER NOT NULL CHECK(commercial_use_cleared IN (0, 1)),
  object_sha256s_json TEXT NOT NULL CHECK(length(object_sha256s_json) BETWEEN 2 AND 65536),
  authority_record_id TEXT NOT NULL UNIQUE,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (source_id, source_revision, clearance_revision),
  CHECK(state <> 'cleared' OR (privacy_cleared = 1 AND commercial_use_cleared = 1))
) STRICT;

-- The latest activation is current. An activated revision cannot be activated
-- again, so an old clearance cannot be made current by rolling a pointer back.
CREATE TABLE education_media_clearance_activations (
  activation_seq INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  source_revision TEXT NOT NULL,
  clearance_revision TEXT NOT NULL,
  authority_record_id TEXT NOT NULL UNIQUE,
  recorded_at TEXT NOT NULL,
  UNIQUE (source_id, source_revision, clearance_revision),
  FOREIGN KEY (source_id, source_revision, clearance_revision)
    REFERENCES education_media_clearance_records(source_id, source_revision, clearance_revision)
) STRICT;

CREATE VIEW education_media_clearance_current AS
SELECT a.source_id, a.source_revision, a.clearance_revision
FROM education_media_clearance_activations a
WHERE a.activation_seq = (
  SELECT MAX(newer.activation_seq) FROM education_media_clearance_activations newer
  WHERE newer.source_id = a.source_id AND newer.source_revision = a.source_revision
);

CREATE TABLE education_media_revocations (
  source_id TEXT NOT NULL,
  source_revision TEXT NOT NULL,
  authority_record_id TEXT NOT NULL UNIQUE,
  recorded_at TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  PRIMARY KEY (source_id, source_revision)
) STRICT;

CREATE TABLE education_media_bindings (
  assessment_version_id TEXT NOT NULL CHECK(length(assessment_version_id) BETWEEN 1 AND 200),
  assessment_integrity_hash TEXT NOT NULL CHECK(length(assessment_integrity_hash) = 64),
  case_id TEXT NOT NULL CHECK(length(case_id) BETWEEN 1 AND 200),
  case_version INTEGER NOT NULL CHECK(case_version >= 1),
  case_publication_hash TEXT NOT NULL CHECK(length(case_publication_hash) = 64),
  source_id TEXT NOT NULL,
  source_revision TEXT NOT NULL,
  clearance_revision TEXT NOT NULL,
  object_id TEXT NOT NULL CHECK(length(object_id) BETWEEN 1 AND 200),
  representation TEXT NOT NULL CHECK(representation = 'dicom-instance'),
  study_instance_uid TEXT NOT NULL,
  series_instance_uid TEXT NOT NULL,
  frame_of_reference_uid TEXT NOT NULL,
  sop_instance_uid TEXT NOT NULL,
  object_key TEXT NOT NULL CHECK(length(object_key) BETWEEN 17 AND 415),
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
  byte_length INTEGER NOT NULL CHECK(byte_length BETWEEN 1 AND 16777216),
  content_type TEXT NOT NULL CHECK(content_type = 'application/dicom'),
  authority_record_id TEXT NOT NULL UNIQUE,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (assessment_version_id, case_id, object_id),
  FOREIGN KEY (source_id, source_revision, clearance_revision)
    REFERENCES education_media_clearance_records(source_id, source_revision, clearance_revision)
) STRICT;

-- Historical evidence is insert-only. These triggers do not authorize inserts.
CREATE TRIGGER education_media_bindings_no_update BEFORE UPDATE ON education_media_bindings
BEGIN SELECT RAISE(ABORT, 'immutable education binding'); END;
CREATE TRIGGER education_media_bindings_no_delete BEFORE DELETE ON education_media_bindings
BEGIN SELECT RAISE(ABORT, 'immutable education binding'); END;
CREATE TRIGGER education_media_clearance_no_update BEFORE UPDATE ON education_media_clearance_records
BEGIN SELECT RAISE(ABORT, 'immutable clearance record'); END;
CREATE TRIGGER education_media_clearance_no_delete BEFORE DELETE ON education_media_clearance_records
BEGIN SELECT RAISE(ABORT, 'immutable clearance record'); END;
CREATE TRIGGER education_media_activation_no_update BEFORE UPDATE ON education_media_clearance_activations
BEGIN SELECT RAISE(ABORT, 'immutable clearance activation'); END;
CREATE TRIGGER education_media_activation_no_delete BEFORE DELETE ON education_media_clearance_activations
BEGIN SELECT RAISE(ABORT, 'immutable clearance activation'); END;
CREATE TRIGGER education_media_revocations_no_update BEFORE UPDATE ON education_media_revocations
BEGIN SELECT RAISE(ABORT, 'terminal revocation'); END;
CREATE TRIGGER education_media_revocations_no_delete BEFORE DELETE ON education_media_revocations
BEGIN SELECT RAISE(ABORT, 'terminal revocation'); END;
