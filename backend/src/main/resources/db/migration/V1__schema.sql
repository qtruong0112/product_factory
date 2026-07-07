CREATE TYPE "entity_status_enum" AS ENUM (
  'draft',
  'review',
  'approved',
  'published',
  'retired'
);

CREATE TYPE "matrix_kind_enum" AS ENUM (
  'ARCHETYPE_X_ELEMENT',
  'ELEMENTTYPE_X_ELEMENTTYPE',
  'OBLIGATIONTYPE_X_BLOCK'
);

CREATE TYPE "matrix_verdict_enum" AS ENUM (
  'req',
  'pos',
  'na'
);

CREATE TYPE "block_usage_enum" AS ENUM (
  'active',
  'locked'
);

CREATE TYPE "constraint_kind_enum" AS ENUM (
  'regulatory',
  'range',
  'required',
  'dependency',
  'enum'
);

CREATE TYPE "audience_enum" AS ENUM (
  'individual',
  'business'
);

CREATE TYPE "channel_enum" AS ENUM (
  'App',
  'Web',
  'PGD'
);

CREATE TYPE "ot_role_enum" AS ENUM (
  'Primary',
  'Support'
);

CREATE TYPE "foa_requirement_enum" AS ENUM (
  'required',
  'possible',
  'na'
);

CREATE TYPE "biz_group_enum" AS ENUM (
  'Khởi tạo',
  'Giá trị',
  'Kích hoạt',
  'Vận hành',
  'Thu hồi'
);

CREATE TYPE "version_entity_type_enum" AS ENUM (
  'pattern',
  'template',
  'config'
);

CREATE TYPE "release_step_status_enum" AS ENUM (
  'done',
  'current',
  'upcoming'
);

CREATE TYPE "release_role_enum" AS ENUM (
  'Product Owner',
  'Product Designer',
  'Product Designer / QA',
  'Checker / Approver',
  'Operations'
);

CREATE TYPE "customer_tier_enum" AS ENUM (
  'standard',
  'loyalty',
  'vip'
);

CREATE TYPE "data_sensitivity_enum" AS ENUM (
  'public',
  'internal',
  'confidential',
  'pii'
);

CREATE TABLE "obligation_element_type" (
  "code" varchar(30) PRIMARY KEY NOT NULL,
  "name" varchar(80) NOT NULL,
  "short_name" varchar(40),
  "description" text,
  "is_identify" boolean NOT NULL DEFAULT false,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "obligation_element" (
  "code" varchar(60) PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "element_type_code" varchar(30) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "financial_obligation_archetype" (
  "code" varchar(30) PRIMARY KEY NOT NULL,
  "name" varchar(80) NOT NULL,
  "nature" varchar(160),
  "nature_desc" text,
  "value_structure" varchar(160),
  "value_desc" text,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "foa_element" (
  "archetype_code" varchar(30) NOT NULL,
  "element_code" varchar(60) NOT NULL,
  "requirement" foa_requirement_enum NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("archetype_code", "element_code")
);

CREATE TABLE "obligation_family" (
  "code" varchar(30) PRIMARY KEY NOT NULL,
  "name" varchar(80) NOT NULL,
  "identified_by_nature_code" varchar(60) UNIQUE NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "obligation_type" (
  "code" varchar(60) PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "family_code" varchar(30) NOT NULL,
  "archetype_code" varchar(30) NOT NULL,
  "status" entity_status_enum NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "obligation_type_composition" (
  "obligation_type_code" varchar(60) NOT NULL,
  "element_type_code" varchar(30) NOT NULL,
  "element_code" varchar(60) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("obligation_type_code", "element_type_code")
);

CREATE TABLE "lifecycle" (
  "code" varchar(40) PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "governs" varchar(80) NOT NULL,
  "status" entity_status_enum NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "lifecycle_state" (
  "lifecycle_code" varchar(40) NOT NULL,
  "sort_order" smallint NOT NULL,
  "name" varchar(60) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("lifecycle_code", "sort_order")
);

CREATE TABLE "domain" (
  "code" varchar(40) PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "description" text,
  "entity_count" integer,
  "status" entity_status_enum NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "data_type" (
  "code" varchar(20) PRIMARY KEY NOT NULL,
  "name" varchar(60) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "attribute_group" (
  "code" varchar(40) PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "domain_code" varchar(40) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "attribute" (
  "code" varchar(60) PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "group_code" varchar(40) NOT NULL,
  "data_type_code" varchar(20) NOT NULL,
  "is_required" boolean NOT NULL DEFAULT false,
  "is_unique" boolean NOT NULL DEFAULT false,
  "is_nullable" boolean NOT NULL DEFAULT true,
  "default_value" varchar(255),
  "unit" varchar(40),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "attribute_constraint" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "attribute_code" varchar(60) NOT NULL,
  "kind" constraint_kind_enum NOT NULL,
  "min_value" decimal(18,4),
  "max_value" decimal(18,4),
  "step_value" decimal(18,4),
  "expression" varchar(255),
  "depends_on_attribute_code" varchar(60),
  "message" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "attribute_enum_value" (
  "attribute_code" varchar(60) NOT NULL,
  "sort_order" smallint NOT NULL,
  "value" varchar(160) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("attribute_code", "sort_order")
);

CREATE TABLE "block" (
  "id" varchar(40) PRIMARY KEY NOT NULL,
  "code" varchar(60) UNIQUE NOT NULL,
  "name" varchar(160) NOT NULL,
  "biz_group" biz_group_enum NOT NULL,
  "governed_by_element_code" varchar(60),
  "governed_by_aspect" varchar(80),
  "status" entity_status_enum NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "answer_slot" (
  "block_id" varchar(40) NOT NULL,
  "code" varchar(60) NOT NULL,
  "name" varchar(160) NOT NULL,
  "attribute_code" varchar(60) NOT NULL,
  "is_required" boolean NOT NULL DEFAULT false,
  "default_value" varchar(255),
  "rule_text" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("block_id", "code")
);

CREATE TABLE "selector_scope" (
  "code" varchar(10) PRIMARY KEY NOT NULL,
  "name" varchar(60) NOT NULL,
  "priority" smallint NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "fragment" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "config_code" varchar(20) NOT NULL,
  "block_id" varchar(40) NOT NULL,
  "slot_code" varchar(60) NOT NULL,
  "scope_code" varchar(10) NOT NULL,
  "scope_value" varchar(120),
  "value" varchar(255) NOT NULL,
  "is_warning" boolean NOT NULL DEFAULT false,
  "validation_msg" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "business_intent" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "name" varchar(200) NOT NULL,
  "owner" varchar(120) NOT NULL,
  "period" varchar(60) NOT NULL,
  "objective" text,
  "status" entity_status_enum NOT NULL,
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "business_intent_kpi" (
  "business_intent_id" bigint NOT NULL,
  "sort_order" smallint NOT NULL,
  "metric" varchar(160) NOT NULL,
  "target" varchar(80) NOT NULL,
  "unit" varchar(40),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("business_intent_id", "sort_order")
);

CREATE TABLE "customer_segment" (
  "code" varchar(40) PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "audience" audience_enum NOT NULL,
  "tier" customer_tier_enum,
  "legal_requirement" varchar(255),
  "status" entity_status_enum NOT NULL DEFAULT 'draft',
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "product_intent" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "code" varchar(20),
  "name" varchar(200) NOT NULL,
  "business_intent_id" bigint NOT NULL,
  "nature_element_code" varchar(60) NOT NULL,
  "archetype_code" varchar(30) NOT NULL,
  "status" entity_status_enum NOT NULL,
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "product_intent_element" (
  "product_intent_id" bigint NOT NULL,
  "element_code" varchar(60) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("product_intent_id", "element_code")
);

CREATE TABLE "product_pattern" (
  "code" varchar(20) PRIMARY KEY NOT NULL,
  "name" varchar(200) NOT NULL,
  "product_intent_id" bigint,
  "status" entity_status_enum NOT NULL,
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "pattern_block" (
  "pattern_code" varchar(20) NOT NULL,
  "block_id" varchar(40) NOT NULL,
  "position" smallint NOT NULL,
  "usage" block_usage_enum NOT NULL DEFAULT 'active',
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("pattern_code", "block_id")
);

CREATE TABLE "pattern_obligation_type" (
  "pattern_code" varchar(20) NOT NULL,
  "obligation_type_code" varchar(60) NOT NULL,
  "role" ot_role_enum NOT NULL DEFAULT 'Primary',
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("pattern_code", "obligation_type_code")
);

CREATE TABLE "product_template" (
  "code" varchar(20) PRIMARY KEY NOT NULL,
  "name" varchar(200) NOT NULL,
  "from_pattern_code" varchar(20) NOT NULL,
  "status" entity_status_enum NOT NULL,
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "template_segment" (
  "template_code" varchar(20) NOT NULL,
  "segment_code" varchar(40) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("template_code", "segment_code")
);

CREATE TABLE "template_frame" (
  "template_code" varchar(20) NOT NULL,
  "block_id" varchar(40) NOT NULL,
  "slot_code" varchar(60) NOT NULL,
  "frame_value" varchar(255) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("template_code", "block_id", "slot_code")
);

CREATE TABLE "product_config" (
  "code" varchar(20) PRIMARY KEY NOT NULL,
  "name" varchar(200) NOT NULL,
  "from_template_code" varchar(20) NOT NULL,
  "status" entity_status_enum NOT NULL,
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "product_variant" (
  "code" varchar(20) PRIMARY KEY NOT NULL,
  "name" varchar(200) NOT NULL,
  "from_config_code" varchar(20) NOT NULL,
  "family" varchar(40),
  "limit_range" varchar(60),
  "display_rate" varchar(40),
  "marketing_content" text,
  "status" entity_status_enum NOT NULL,
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "product_catalog" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "channel" channel_enum NOT NULL,
  "status" entity_status_enum NOT NULL DEFAULT 'draft',
  "data_owner" varchar(120),
  "data_steward" varchar(120),
  "sensitivity" data_sensitivity_enum NOT NULL DEFAULT 'internal',
  "retention_policy" varchar(255),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "catalog_listing" (
  "catalog_id" bigint NOT NULL,
  "variant_code" varchar(20) NOT NULL,
  "published_date" date,
  "status" entity_status_enum NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("catalog_id", "variant_code")
);

CREATE TABLE "constraint_matrix" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "kind" matrix_kind_enum NOT NULL,
  "title" varchar(200) NOT NULL,
  "description" text,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "matrix_cell" (
  "matrix_id" bigint NOT NULL,
  "row_code" varchar(60) NOT NULL,
  "col_code" varchar(60) NOT NULL,
  "verdict" matrix_verdict_enum NOT NULL,
  "is_override" boolean NOT NULL DEFAULT false,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("matrix_id", "row_code", "col_code")
);

CREATE TABLE "maker_checker_process" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "variant_code" varchar(20),
  "product_name" varchar(200) NOT NULL,
  "done_count" smallint NOT NULL DEFAULT 0,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "process_step" (
  "process_id" bigint NOT NULL,
  "step_no" smallint NOT NULL,
  "title" varchar(200) NOT NULL,
  "role" release_role_enum NOT NULL,
  "step_status" release_step_status_enum NOT NULL,
  "input_desc" varchar(200),
  "output_desc" varchar(200),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("process_id", "step_no")
);

CREATE TABLE "process_step_checklist" (
  "process_id" bigint NOT NULL,
  "step_no" smallint NOT NULL,
  "sort_order" smallint NOT NULL,
  "item" varchar(255) NOT NULL,
  "is_done" boolean NOT NULL DEFAULT false,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("process_id", "step_no", "sort_order")
);

CREATE TABLE "simulation_scenario" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "config_code" varchar(20),
  "variant_code" varchar(20),
  "amount" decimal(18,0) NOT NULL,
  "months" smallint NOT NULL,
  "base_rate_pct" decimal(6,3) NOT NULL,
  "asset_value" decimal(18,0),
  "segment_code" varchar(40),
  "start_date" date,
  "appraisal_fee" decimal(18,0),
  "periodic_fee_pct" decimal(6,3),
  "grace_months" smallint,
  "pinned_label" char(1),
  "effective_rate" decimal(6,3),
  "monthly_payment" decimal(18,0),
  "total_interest" decimal(18,0),
  "total_payment" decimal(18,0),
  "ltv_pct" decimal(6,2),
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "simulation_schedule_row" (
  "scenario_id" bigint NOT NULL,
  "period_no" smallint NOT NULL,
  "due_date" date,
  "opening_balance" decimal(18,0) NOT NULL,
  "principal" decimal(18,0) NOT NULL,
  "interest" decimal(18,0) NOT NULL,
  "fee" decimal(18,0),
  "penalty" decimal(18,0),
  "payment" decimal(18,0) NOT NULL,
  "closing_balance" decimal(18,0) NOT NULL,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("scenario_id", "period_no")
);

CREATE TABLE "version_entry" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "entity_type" version_entity_type_enum NOT NULL,
  "entity_code" varchar(20) NOT NULL,
  "version" varchar(12) NOT NULL,
  "status" entity_status_enum NOT NULL,
  "is_active" boolean NOT NULL DEFAULT false,
  "is_head" boolean NOT NULL DEFAULT false,
  "author" varchar(120) NOT NULL,
  "created_at" timestamp NOT NULL,
  "note" text,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "activity_log" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "occurred_at" timestamp NOT NULL,
  "actor" varchar(120) NOT NULL,
  "action" varchar(40) NOT NULL,
  "entity_type" varchar(60) NOT NULL,
  "entity_code" varchar(60),
  "detail" text,
  "created_user" varchar(120),
  "created_date" timestamp NOT NULL DEFAULT (now()),
  "updated_user" varchar(120),
  "updated_date" timestamp,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_user" varchar(120),
  "deleted_date" timestamp,
  "cdc_version" bigint NOT NULL DEFAULT 1,
  "cdc_timestamp" timestamp NOT NULL DEFAULT (now())
);

CREATE UNIQUE INDEX ON "fragment" ("config_code", "block_id", "slot_code", "scope_code", "scope_value");

CREATE UNIQUE INDEX ON "version_entry" ("entity_type", "entity_code", "version");

COMMENT ON TABLE "obligation_element_type" IS '#1 Obligation Element Type (OET) — Chiều phân loại ngữ nghĩa của nghĩa vụ. 6 chiều lõi (OET_NATURE…OET_TIME) + mở rộng OET_LIFECYCLE trong thư viện. OET_NATURE có is_identify=true — quyết định Family.';

COMMENT ON TABLE "obligation_element" IS '#2 Obligation Element — Giá trị nguyên tử — ’gen’ ngữ nghĩa để lắp thành Obligation Type. App: 17 element, thư viện đầy đủ: 47. Rel #1: ElementType 1:N Element.';

COMMENT ON TABLE "financial_obligation_archetype" IS '#3 Financial Obligation Archetype — Khuôn nghĩa vụ gốc — mẫu trừu tượng cao nhất (Term Loan / Revolving / Conditional). Quy định Element nào Required/Possible qua Ma trận 1 (materialize ở foa_element).';

COMMENT ON TABLE "foa_element" IS '#23 Ma trận 1 (Archetype × Element) — materialized — Rel #5: Archetype constrains Element N:M kèm mức Required/Possible/N.A — ma trận gốc suy diễn Family & hợp lệ hóa Pattern/Intent.';

COMMENT ON TABLE "obligation_family" IS '#4 Obligation Family — Họ nghĩa vụ. Rel #3: Nature định danh Family 1:1 → FK identified_by_nature_code UNIQUE (mỗi Nature định danh đúng 1 Family và ngược lại).';

COMMENT ON COLUMN "obligation_family"."identified_by_nature_code" IS 'Element thuộc OET_NATURE (is_identify)';

COMMENT ON TABLE "obligation_type" IS '#5 Obligation Type — Loại nghĩa vụ chuẩn hóa = tổ hợp đủ 6 Element (mỗi OET đúng 1, materialize ở obligation_type_composition). Nút trung tâm nối ontology với Block. Rel #4: N Type thuộc 1 Family. Rel #6 (MỚI so với v2): mỗi Type hiện thực hóa 1 Archetype.';

COMMENT ON TABLE "obligation_type_composition" IS '#2↔#5 (rel #2 composes) — Rel #2: N Element cấu thành 1 Type; PK ghép (type, element_type) ép ràng buộc ’mỗi OET chọn đúng 1 Element’ (trường comp trong HTML).';

COMMENT ON TABLE "lifecycle" IS '#6 Lifecycle & State Machine — Rel #8: mỗi Lifecycle chi phối 1 loại đối tượng (Term Loan 7 state, Facility 6, Product Variant 5, Pattern 5, Config maker–checker 6, Domain 4).';

COMMENT ON COLUMN "lifecycle"."governs" IS 'Loại đối tượng được chi phối';

COMMENT ON TABLE "lifecycle_state" IS '#6 Lifecycle & State Machine — State có thứ tự của lifecycle (Draft, Active, Overdue, Closed…).';

COMMENT ON TABLE "domain" IS '#14 Domain — Miền dữ liệu — ranh giới sở hữu ngữ nghĩa (DOM_PRODUCT 142 thực thể, DOM_OBLIGATION 98, DOM_PARTY 37, DOM_COLLATERAL 54, DOM_PRICING 29).';

COMMENT ON TABLE "data_type" IS '#13 Data Type — Kiểu dữ liệu của Attribute — object riêng theo semantic sheet (không còn là enum như v2): DT_MONEY, DT_PERCENT, DT_INT, DT_ENUM, DT_RANGE, DT_BOOL, DT_FORMULA.';

COMMENT ON TABLE "attribute_group" IS '#12 Attribute Group — Nhóm nghiệp vụ của Attribute (GRP_PRICING 11, GRP_LIMIT 7, GRP_COLLATERAL 9, GRP_REPAYMENT 8, GRP_PARTY 10, GRP_PENALTY 6). Rel #15 (MỚI so với v2): Group thuộc Domain N:1 (GRP_PRICING → DOM_PRICING, GRP_LIMIT → DOM_PRODUCT…).';

COMMENT ON TABLE "attribute" IS '#9 Attribute — Thuộc tính kinh doanh trong Từ điển thuộc tính (64 attr: base_rate, ltv, limit_amount…), tái sử dụng qua nhiều Block/Template. Rel #13 grouped in, rel #14 typed as. Ràng buộc chi tiết tách sang attribute_constraint (rel #17).';

COMMENT ON TABLE "attribute_constraint" IS '#11 Constraint — Rel #17: 1 Attribute chịu N Constraint. 5 loại: regulatory (trần NHNN ≤1,65%/tháng), range (min/max/step), required, dependency (liên thuộc tính — base_rate phụ thuộc rate_type; limit ≤ LTV × giá trị TS; LTV chỉ khi Recovery=ASSET_PLEDGE), enum. Dependency dùng FK depends_on_attribute_code.';

COMMENT ON COLUMN "attribute_constraint"."expression" IS 'Biểu thức ràng buộc, vd ’limit <= ltv * asset_value’';

COMMENT ON COLUMN "attribute_constraint"."depends_on_attribute_code" IS 'Attribute bị phụ thuộc (constraint kind=dependency)';

COMMENT ON TABLE "attribute_enum_value" IS '#11 Constraint (kind=enum) — Giá trị enum của attribute kiểu DT_ENUM (vd asset_type: Xe máy / Ô tô / Vàng).';

COMMENT ON TABLE "block" IS '#7 Block — Khối cấu hình nghiệp vụ, 5 nhóm (Khởi tạo/Giá trị/Kích hoạt/Vận hành/Thu hồi). App: 12 block, thư viện: 26. Rel #10: mỗi Block governance bởi 1 Element (BLK_INTEREST↔TERM_LOAN_OBLIGATION, BLK_COLLATERAL↔ASSET_PLEDGE…) — FK nullable vì một số block neo vào ’khía cạnh’ chưa mã hóa thành element (Eligibility, Obligor Party).';

COMMENT ON COLUMN "block"."governed_by_aspect" IS 'Khía cạnh chi phối khi không phải element (Eligibility, Obligor Party, PENALTY…)';

COMMENT ON TABLE "answer_slot" IS '#8 Answer Slot — Ô khai báo trong Block — nơi 1 Attribute được ’cắm’ vào kèm cờ bắt buộc, default, rule (~30 slot). Rel #11: Block 1:N Slot. Rel #12: Slot binds Attribute N:1 (whereUsed).';

COMMENT ON TABLE "selector_scope" IS '#10 Fragment & Scope — Loại phạm vi áp dụng của Fragment, kèm priority giải quyết xung đột: default(0) < time(1) < place(2) < people(3).';

COMMENT ON COLUMN "selector_scope"."code" IS 'default / time / place / people';

COMMENT ON TABLE "fragment" IS '#10 Fragment & Scope — Giá trị của Attribute theo phạm vi, trong bối cảnh 1 Config (rel #16 + rel #24: Config gán giá trị Attribute vào slot của Template qua Fragment+Scope). Vd base_rate: 1,5% default · 1,0% Loyalty · 1,4% HCM/HN · 0,9% KM Tết. Bất biến nghiệp vụ: mỗi (config, slot) phải có ≥1 fragment scope=default.';

COMMENT ON COLUMN "fragment"."scope_value" IS 'NULL với scope default; ’Loyalty’/’HCM, HN’/’KM Tết’…';

COMMENT ON TABLE "business_intent" IS '#15 Business Intent — Định hướng kinh doanh nguồn (7 intent): mục tiêu, KPI, owner, kỳ áp dụng. Rel #18: 1 BI dẫn xuất N Product Intent.';

COMMENT ON TABLE "business_intent_kpi" IS '#15 Business Intent — KPI của Business Intent (Dư nợ 1.200 tỷ, 48.000 HĐ, NPL ≤3%…).';

COMMENT ON TABLE "customer_segment" IS '#22 Customer Segment / Audience — Đối tượng KH mục tiêu — object riêng theo semantic sheet (MỚI so với v2): KH cá nhân (CMND/CCCD · Giấy nhận nợ) / KH doanh nghiệp (ĐKKD · HĐ tín dụng DN), kèm tier Standard/Loyalty/VIP.';

COMMENT ON TABLE "product_intent" IS '#16 Product Intent — Ý định sản phẩm (12 intent: PI-001…). Rel #19: anchored to Obligation Nature + Archetype. Rel #20: 1 Intent định hình N Pattern.';

COMMENT ON COLUMN "product_intent"."code" IS 'PI-001…';

COMMENT ON COLUMN "product_intent"."nature_element_code" IS 'Element thuộc OET_NATURE (is_identify)';

COMMENT ON TABLE "product_intent_element" IS '#16 Product Intent — Element nền khai báo cho Intent (đối chiếu Ma trận 1). PI-003 ghép FACILITY + LOAN → junction cho phép nhiều nature/element phụ.';

COMMENT ON TABLE "product_pattern" IS '#17 Product Pattern — Khung sản phẩm (8 pattern): lắp Obligation Type × Block theo Ma trận 3, khóa Block không áp dụng (khóa chuyển về Pattern theo semantic sheet — pattern_block.usage). Rel #22: 1 Pattern sinh N Template.';

COMMENT ON TABLE "pattern_block" IS '#17 ↔ #7 (rel #21 assembled from) — Junction Pattern ↔ Block (canvas có thứ tự) kèm usage active/locked — Block bắt buộc theo Ma trận 3 không được locked (enforce ở application/trigger).';

COMMENT ON TABLE "pattern_obligation_type" IS '#17 ↔ #5 (rel #21) — Junction Pattern ↔ Obligation Type kèm role Primary/Support.';

COMMENT ON TABLE "product_template" IS '#18 Product Template — Khuôn hoàn chỉnh từ Pattern (15 template), sẵn sàng cấu hình. Rel #24: 1 Template cấu hình thành N Config (15 → 34).';

COMMENT ON TABLE "template_segment" IS '#18 ↔ #22 (rel #23 targets, N:M) — Junction MỚI so với v2: Template nhắm tới nhiều Customer Segment và ngược lại (semantic sheet xác nhận N:M).';

COMMENT ON TABLE "template_frame" IS '#18 Product Template — Giá trị khung cấp template cho Answer Slot (từ HTML — semantic sheet không phủ nhận, giữ lại).';

COMMENT ON TABLE "product_config" IS '#19 Product Config — Bản cấu hình (34 config): gán giá trị qua Fragment+Scope, chạy mô phỏng (rel #25), trình maker–checker (rel #26, LIFE_CONFIG 6 state).';

COMMENT ON TABLE "product_variant" IS '#20 Product Variant — Biến thể đã duyệt & đóng gói (21 variant). SỬA so với v2: rel #27 xác nhận Config đóng gói thành Variant 1:N (34 config → 21 variant, một config có thể sinh nhiều biến thể theo kênh/tên thương mại) → BỎ unique trên from_config_code.';

COMMENT ON TABLE "product_catalog" IS '#21 Product Catalog — Kệ sản phẩm — object riêng theo semantic sheet (rel #28: Variant published to Catalog N:1). Mỗi kệ gắn 1 kênh bán; 18 sản phẩm trên kệ = số dòng catalog_listing.';

COMMENT ON TABLE "catalog_listing" IS '#21 Product Catalog — Dòng sản phẩm trên kệ (Variant × Catalog).';

COMMENT ON TABLE "constraint_matrix" IS '#23 Ma trận ràng buộc — 3 loại ma trận chính thức (semantic sheet — bỏ PATTERN_X_BLOCK của v2): (1) Archetype × Element (materialized thêm ở foa_element), (2) ElementType × ElementType tương thích, (3) ObligationType × Block dựng khung Pattern. Thư viện: 9 ma trận.';

COMMENT ON TABLE "matrix_cell" IS '#23 Ma trận ràng buộc — Ô ma trận: row_code/col_code là code thực thể theo kind (element / element_type / OT / block); verdict req/pos/na. FK mềm — enforce ở application/trigger.';

COMMENT ON TABLE "maker_checker_process" IS '#24 Quy trình Maker–Checker — Quy trình phê duyệt 8 bước: BI → PI → Pattern → Template → Config → Mô phỏng → Phê duyệt → Phát hành. Ràng buộc nghiệp vụ: maker ≠ checker.';

COMMENT ON TABLE "process_step" IS '#24 Quy trình Maker–Checker — 8 bước của quy trình kèm vai trò, trạng thái, input/output, checklist (checklist tách bảng con).';

COMMENT ON TABLE "process_step_checklist" IS '#24 Quy trình Maker–Checker — Mục checklist từng bước.';

COMMENT ON TABLE "simulation_scenario" IS '#25 Simulation Engine — Rel #25: Config kiểm thử bởi Simulation Engine trước khi trình duyệt. Kịch bản chạy trên Variant (HTML) hoặc Config (trước đóng gói) → 2 FK nullable, ít nhất 1 phải có. Kết quả tổng hợp inline, lịch trả nợ tách bảng con; hỗ trợ pin A/B/C/D.';

COMMENT ON TABLE "simulation_schedule_row" IS '#25 Simulation Engine — Lịch trả nợ từng kỳ của kịch bản (output engine — chỉ lưu khi cần audit, còn lại tính runtime).';

COMMENT ON TABLE "version_entry" IS '#24 (versioning maker–checker, từ HTML) — Version polymorphic của Pattern/Template/Config: head/active, compare, restore.';

COMMENT ON TABLE "activity_log" IS '#26 Activity Log — Rel #29: mọi thao tác ghi vết vào nhật ký; lọc theo actor/thời gian, xuất CSV/JSON.';

ALTER TABLE "obligation_element" ADD FOREIGN KEY ("element_type_code") REFERENCES "obligation_element_type" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "foa_element" ADD FOREIGN KEY ("archetype_code") REFERENCES "financial_obligation_archetype" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "foa_element" ADD FOREIGN KEY ("element_code") REFERENCES "obligation_element" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "obligation_element" ADD FOREIGN KEY ("code") REFERENCES "obligation_family" ("identified_by_nature_code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "obligation_type" ADD FOREIGN KEY ("family_code") REFERENCES "obligation_family" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "obligation_type" ADD FOREIGN KEY ("archetype_code") REFERENCES "financial_obligation_archetype" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "obligation_type_composition" ADD FOREIGN KEY ("obligation_type_code") REFERENCES "obligation_type" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "obligation_type_composition" ADD FOREIGN KEY ("element_type_code") REFERENCES "obligation_element_type" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "obligation_type_composition" ADD FOREIGN KEY ("element_code") REFERENCES "obligation_element" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "lifecycle_state" ADD FOREIGN KEY ("lifecycle_code") REFERENCES "lifecycle" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attribute_group" ADD FOREIGN KEY ("domain_code") REFERENCES "domain" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attribute" ADD FOREIGN KEY ("group_code") REFERENCES "attribute_group" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attribute" ADD FOREIGN KEY ("data_type_code") REFERENCES "data_type" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attribute_constraint" ADD FOREIGN KEY ("attribute_code") REFERENCES "attribute" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attribute_constraint" ADD FOREIGN KEY ("depends_on_attribute_code") REFERENCES "attribute" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attribute_enum_value" ADD FOREIGN KEY ("attribute_code") REFERENCES "attribute" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "block" ADD FOREIGN KEY ("governed_by_element_code") REFERENCES "obligation_element" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "answer_slot" ADD FOREIGN KEY ("block_id") REFERENCES "block" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "answer_slot" ADD FOREIGN KEY ("attribute_code") REFERENCES "attribute" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fragment" ADD FOREIGN KEY ("config_code") REFERENCES "product_config" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fragment" ADD FOREIGN KEY ("block_id", "slot_code") REFERENCES "answer_slot" ("block_id", "code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fragment" ADD FOREIGN KEY ("scope_code") REFERENCES "selector_scope" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "business_intent_kpi" ADD FOREIGN KEY ("business_intent_id") REFERENCES "business_intent" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_intent" ADD FOREIGN KEY ("business_intent_id") REFERENCES "business_intent" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_intent" ADD FOREIGN KEY ("nature_element_code") REFERENCES "obligation_element" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_intent" ADD FOREIGN KEY ("archetype_code") REFERENCES "financial_obligation_archetype" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_intent_element" ADD FOREIGN KEY ("product_intent_id") REFERENCES "product_intent" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_intent_element" ADD FOREIGN KEY ("element_code") REFERENCES "obligation_element" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_pattern" ADD FOREIGN KEY ("product_intent_id") REFERENCES "product_intent" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pattern_block" ADD FOREIGN KEY ("pattern_code") REFERENCES "product_pattern" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pattern_block" ADD FOREIGN KEY ("block_id") REFERENCES "block" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pattern_obligation_type" ADD FOREIGN KEY ("pattern_code") REFERENCES "product_pattern" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pattern_obligation_type" ADD FOREIGN KEY ("obligation_type_code") REFERENCES "obligation_type" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_template" ADD FOREIGN KEY ("from_pattern_code") REFERENCES "product_pattern" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "template_segment" ADD FOREIGN KEY ("template_code") REFERENCES "product_template" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "template_segment" ADD FOREIGN KEY ("segment_code") REFERENCES "customer_segment" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "template_frame" ADD FOREIGN KEY ("template_code") REFERENCES "product_template" ("code") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "template_frame" ADD FOREIGN KEY ("block_id", "slot_code") REFERENCES "answer_slot" ("block_id", "code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_config" ADD FOREIGN KEY ("from_template_code") REFERENCES "product_template" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_variant" ADD FOREIGN KEY ("from_config_code") REFERENCES "product_config" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "catalog_listing" ADD FOREIGN KEY ("catalog_id") REFERENCES "product_catalog" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "catalog_listing" ADD FOREIGN KEY ("variant_code") REFERENCES "product_variant" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "matrix_cell" ADD FOREIGN KEY ("matrix_id") REFERENCES "constraint_matrix" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "maker_checker_process" ADD FOREIGN KEY ("variant_code") REFERENCES "product_variant" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "process_step" ADD FOREIGN KEY ("process_id") REFERENCES "maker_checker_process" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "process_step_checklist" ADD FOREIGN KEY ("process_id", "step_no") REFERENCES "process_step" ("process_id", "step_no") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "simulation_scenario" ADD FOREIGN KEY ("config_code") REFERENCES "product_config" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "simulation_scenario" ADD FOREIGN KEY ("variant_code") REFERENCES "product_variant" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "simulation_scenario" ADD FOREIGN KEY ("segment_code") REFERENCES "customer_segment" ("code") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "simulation_schedule_row" ADD FOREIGN KEY ("scenario_id") REFERENCES "simulation_scenario" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
