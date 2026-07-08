-- ============================================================================
-- PRODUCT FACTORY 5.1 — SEED DATA (sinh từ mã nguồn Product_Factory_5_1.html)
-- Schema: canonical v3 (43 bảng). Chạy SAU file DDL (Untitled.sql).
-- Quy ước: dữ liệu lấy nguyên văn từ prototype; các dòng đánh dấu [suy luận]
-- là nội suy hợp lý từ badge/số đếm trên UI, không có record mẫu trong HTML.
-- Lưu ý enum: UI dùng verdict 'no' → schema v3 dùng 'na' (đã quy đổi).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VÁ DDL: dbdiagram export quan hệ 1:1 obligation_family ↔ obligation_element
-- NGƯỢC CHIỀU (FK đặt trên obligation_element → mọi element buộc phải là nature
-- của 1 family). Sửa lại đúng nghĩa: family.identified_by_nature_code → element.
-- ----------------------------------------------------------------------------
ALTER TABLE "obligation_element" DROP CONSTRAINT IF EXISTS "obligation_element_code_fkey";
ALTER TABLE "obligation_family" ADD CONSTRAINT "obligation_family_nature_fkey" FOREIGN KEY ("identified_by_nature_code") REFERENCES "obligation_element" ("code");

-- ===== 1. obligation_element_type — 7 chiều (6 lõi + OET_LIFECYCLE thư viện) =====
INSERT INTO "obligation_element_type" ("code", "name", "short_name", "description", "is_identify") VALUES
  ('OET_NATURE', 'Obligation Nature', 'Bản chất', 'Định danh bản chất nghĩa vụ — quyết định Family', true),
  ('OET_VALUE', 'Value Structure', 'Giá trị', 'Cách giá trị/dư nợ thay đổi theo thời gian', false),
  ('OET_ACTIVATION', 'Activation Logic', 'Kích hoạt', 'Điều kiện/sự kiện làm nghĩa vụ phát sinh', false),
  ('OET_FULFILLMENT', 'Fulfillment Logic', 'Thực thi', 'Cách thực hiện / hoàn trả nghĩa vụ', false),
  ('OET_RECOVERY', 'Recovery Anchor', 'Thu hồi', 'Phương án bảo đảm & thu hồi', false),
  ('OET_TIME', 'Time Structure', 'Thời gian', 'Chu kỳ và hạn chót của nghĩa vụ', false),
  ('OET_LIFECYCLE', 'Lifecycle & State Machine', 'Vòng đời', 'Vòng đời & máy trạng thái [thư viện, tab Element Type]', false);

-- ===== 2. obligation_element — 17 element lõi (ONTO) + 1 từ archDetail =====
INSERT INTO "obligation_element" ("code", "name", "element_type_code") VALUES
  ('TERM_LOAN_OBLIGATION', 'Nợ 1 chiều (đi vay)', 'OET_NATURE'),
  ('FACILITY_OBLIGATION', 'Cấp hạn mức', 'OET_NATURE'),
  ('CONDITIONAL_OBLIGATION', 'Nghĩa vụ có điều kiện', 'OET_NATURE'),
  ('PRINCIPAL_NO_INCREASE_MULTI_DECREASE', 'Gốc không tăng, giảm dần', 'OET_VALUE'),
  ('LIMIT_MULTI_INC_DEC_HAS_CAPACITY', 'Hạn mức tăng/giảm có capacity', 'OET_VALUE'),
  ('VALUE_BY_EVENT', 'Giá trị theo sự kiện', 'OET_VALUE'),
  ('EVENT_LENDER_DISBURSEMENT', 'Kích hoạt khi giải ngân', 'OET_ACTIVATION'),
  ('EVENT_FACILITY_OPEN', 'Kích hoạt khi mở hạn mức', 'OET_ACTIVATION'),
  ('CONDITIONAL_TRIGGER', 'Kích hoạt theo trigger', 'OET_ACTIVATION'),
  ('PAYMENT_MULTISTEP_INSTALLMENT', 'Trả góp nhiều kỳ', 'OET_FULFILLMENT'),
  ('PAYMENT_BULLET', 'Trả 1 lần (Bullet)', 'OET_FULFILLMENT'),
  ('PAYMENT_CYCLE_STATEMENT', 'Trả theo sao kê chu kỳ', 'OET_FULFILLMENT'),
  ('FULFILL_ON_CONDITION', 'Thực thi 1 lần khi đến điều kiện', 'OET_FULFILLMENT'),
  ('ASSET_PLEDGE', 'Tài sản, cầm cố', 'OET_RECOVERY'),
  ('UNSECURED', 'Tín chấp (không TSĐB)', 'OET_RECOVERY'),
  ('CALENDAR_HAS_CYCLE_HAS_DEADLINE', 'Có chu kỳ, có hạn chót', 'OET_TIME'),
  ('CALENDAR_HAS_CYCLE', 'Có chu kỳ', 'OET_TIME'),
  ('CALENDAR_HAS_DEADLINE', 'Có hạn chót', 'OET_TIME');

-- ===== 3. financial_obligation_archetype — 3 khuôn gốc (archDetail) =====
INSERT INTO "financial_obligation_archetype" ("code", "name", "nature", "nature_desc", "value_structure", "value_desc") VALUES
  ('FOA_TERM_LOAN', 'Term Loan Obligation', 'Nợ 1 chiều (đi vay)', 'Bên vay nhận một khoản nợ xác định và hoàn trả dần — định danh bản chất nghĩa vụ.', 'Gốc không tăng, giảm dần', 'Dư nợ gốc chỉ giảm theo từng kỳ trả, không phát sinh tăng thêm.'),
  ('FOA_REVOLVING', 'Revolving Obligation', 'Cấp hạn mức tái sử dụng', 'Bên cho vay cấp một hạn mức, bên vay rút/trả nhiều lần trong hạn mức.', 'Hạn mức tăng/giảm có capacity', 'Số dư khả dụng biến động theo rút vốn và trả nợ, có quản trị capacity.'),
  ('FOA_CONDITIONAL', 'Conditional Obligation', 'Nghĩa vụ phát sinh có điều kiện', 'Nghĩa vụ chỉ hình thành/được thực thi khi một sự kiện điều kiện xảy ra.', 'Giá trị theo sự kiện kích hoạt', 'Giá trị nghĩa vụ phụ thuộc kết quả của sự kiện kích hoạt (trigger).');

-- ===== 4. foa_element — Element gắn Archetype kèm requirement (archDetail.elementRows) =====
INSERT INTO "foa_element" ("archetype_code", "element_code", "requirement") VALUES
  ('FOA_TERM_LOAN', 'TERM_LOAN_OBLIGATION', 'required'),
  ('FOA_TERM_LOAN', 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE', 'required'),
  ('FOA_TERM_LOAN', 'EVENT_LENDER_DISBURSEMENT', 'required'),
  ('FOA_TERM_LOAN', 'PAYMENT_MULTISTEP_INSTALLMENT', 'required'),
  ('FOA_TERM_LOAN', 'ASSET_PLEDGE', 'possible'),
  ('FOA_TERM_LOAN', 'CALENDAR_HAS_CYCLE_HAS_DEADLINE', 'required'),
  ('FOA_REVOLVING', 'FACILITY_OBLIGATION', 'required'),
  ('FOA_REVOLVING', 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY', 'required'),
  ('FOA_REVOLVING', 'EVENT_FACILITY_OPEN', 'required'),
  ('FOA_REVOLVING', 'PAYMENT_CYCLE_STATEMENT', 'required'),
  ('FOA_REVOLVING', 'ASSET_PLEDGE', 'possible'),
  ('FOA_REVOLVING', 'CALENDAR_HAS_CYCLE', 'required'),
  ('FOA_CONDITIONAL', 'CONDITIONAL_OBLIGATION', 'required'),
  ('FOA_CONDITIONAL', 'VALUE_BY_EVENT', 'required'),
  ('FOA_CONDITIONAL', 'CONDITIONAL_TRIGGER', 'required'),
  ('FOA_CONDITIONAL', 'FULFILL_ON_CONDITION', 'required'),
  ('FOA_CONDITIONAL', 'ASSET_PLEDGE', 'possible'),
  ('FOA_CONDITIONAL', 'CALENDAR_HAS_DEADLINE', 'possible');

-- ===== 5. obligation_family — Nature định danh 1:1 =====
INSERT INTO "obligation_family" ("code", "name", "identified_by_nature_code") VALUES
  ('FAM_LOAN', 'Loan Obligation', 'TERM_LOAN_OBLIGATION'),
  ('FAM_FACILITY', 'Facility', 'FACILITY_OBLIGATION'),
  ('FAM_CONDITIONAL', 'Conditional', 'CONDITIONAL_OBLIGATION');

-- ===== 6. obligation_type — 5 lõi (ONTO) + 4 từ list view / archDetail =====
INSERT INTO "obligation_type" ("code", "name", "family_code", "archetype_code", "status") VALUES
  ('OT_PLEDGE_INSTALLMENT', 'Vay cầm cố trả góp', 'FAM_LOAN', 'FOA_TERM_LOAN', 'published'),
  ('OT_PLEDGE_BULLET', 'Vay cầm cố trả 1 lần (Bullet)', 'FAM_LOAN', 'FOA_TERM_LOAN', 'published'),
  ('OT_UNSECURED', 'Vay tín chấp trả góp', 'FAM_LOAN', 'FOA_TERM_LOAN', 'approved'),
  ('OT_FACILITY', 'Vay hạn mức (Facility)', 'FAM_FACILITY', 'FOA_REVOLVING', 'published'),
  ('OT_GUARANTEE', 'Bảo lãnh có điều kiện', 'FAM_CONDITIONAL', 'FOA_CONDITIONAL', 'approved'),
  ('OT_AUTO_PLEDGE', 'Vay cầm cố ô tô', 'FAM_LOAN', 'FOA_TERM_LOAN', 'published'),
  ('OT_GOLD_BULLET', 'Vay cầm cố vàng Bullet', 'FAM_LOAN', 'FOA_TERM_LOAN', 'review'),
  ('OT_FACILITY_AUTO', 'Vay hạn mức cầm cố ô tô', 'FAM_FACILITY', 'FOA_REVOLVING', 'approved'),
  ('OT_COMMITMENT', 'Cam kết giải ngân điều kiện', 'FAM_CONDITIONAL', 'FOA_CONDITIONAL', 'review');

-- ===== 7. obligation_type_composition — comp{} 6 chiều/type (ONTO.types; 4 type mở rộng [suy luận] mirror type cùng nhóm) =====
INSERT INTO "obligation_type_composition" ("obligation_type_code", "element_type_code", "element_code") VALUES
  ('OT_PLEDGE_INSTALLMENT', 'OET_NATURE', 'TERM_LOAN_OBLIGATION'),
  ('OT_PLEDGE_INSTALLMENT', 'OET_VALUE', 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  ('OT_PLEDGE_INSTALLMENT', 'OET_ACTIVATION', 'EVENT_LENDER_DISBURSEMENT'),
  ('OT_PLEDGE_INSTALLMENT', 'OET_FULFILLMENT', 'PAYMENT_MULTISTEP_INSTALLMENT'),
  ('OT_PLEDGE_INSTALLMENT', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_PLEDGE_INSTALLMENT', 'OET_TIME', 'CALENDAR_HAS_CYCLE_HAS_DEADLINE'),
  ('OT_PLEDGE_BULLET', 'OET_NATURE', 'TERM_LOAN_OBLIGATION'),
  ('OT_PLEDGE_BULLET', 'OET_VALUE', 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  ('OT_PLEDGE_BULLET', 'OET_ACTIVATION', 'EVENT_LENDER_DISBURSEMENT'),
  ('OT_PLEDGE_BULLET', 'OET_FULFILLMENT', 'PAYMENT_BULLET'),
  ('OT_PLEDGE_BULLET', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_PLEDGE_BULLET', 'OET_TIME', 'CALENDAR_HAS_DEADLINE'),
  ('OT_UNSECURED', 'OET_NATURE', 'TERM_LOAN_OBLIGATION'),
  ('OT_UNSECURED', 'OET_VALUE', 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  ('OT_UNSECURED', 'OET_ACTIVATION', 'EVENT_LENDER_DISBURSEMENT'),
  ('OT_UNSECURED', 'OET_FULFILLMENT', 'PAYMENT_MULTISTEP_INSTALLMENT'),
  ('OT_UNSECURED', 'OET_RECOVERY', 'UNSECURED'),
  ('OT_UNSECURED', 'OET_TIME', 'CALENDAR_HAS_CYCLE_HAS_DEADLINE'),
  ('OT_FACILITY', 'OET_NATURE', 'FACILITY_OBLIGATION'),
  ('OT_FACILITY', 'OET_VALUE', 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY'),
  ('OT_FACILITY', 'OET_ACTIVATION', 'EVENT_FACILITY_OPEN'),
  ('OT_FACILITY', 'OET_FULFILLMENT', 'PAYMENT_CYCLE_STATEMENT'),
  ('OT_FACILITY', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_FACILITY', 'OET_TIME', 'CALENDAR_HAS_CYCLE'),
  ('OT_GUARANTEE', 'OET_NATURE', 'CONDITIONAL_OBLIGATION'),
  ('OT_GUARANTEE', 'OET_VALUE', 'VALUE_BY_EVENT'),
  ('OT_GUARANTEE', 'OET_ACTIVATION', 'CONDITIONAL_TRIGGER'),
  ('OT_GUARANTEE', 'OET_FULFILLMENT', 'PAYMENT_BULLET'),
  ('OT_GUARANTEE', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_GUARANTEE', 'OET_TIME', 'CALENDAR_HAS_DEADLINE'),
  ('OT_AUTO_PLEDGE', 'OET_NATURE', 'TERM_LOAN_OBLIGATION'),
  ('OT_AUTO_PLEDGE', 'OET_VALUE', 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  ('OT_AUTO_PLEDGE', 'OET_ACTIVATION', 'EVENT_LENDER_DISBURSEMENT'),
  ('OT_AUTO_PLEDGE', 'OET_FULFILLMENT', 'PAYMENT_MULTISTEP_INSTALLMENT'),
  ('OT_AUTO_PLEDGE', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_AUTO_PLEDGE', 'OET_TIME', 'CALENDAR_HAS_CYCLE_HAS_DEADLINE'),
  ('OT_GOLD_BULLET', 'OET_NATURE', 'TERM_LOAN_OBLIGATION'),
  ('OT_GOLD_BULLET', 'OET_VALUE', 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  ('OT_GOLD_BULLET', 'OET_ACTIVATION', 'EVENT_LENDER_DISBURSEMENT'),
  ('OT_GOLD_BULLET', 'OET_FULFILLMENT', 'PAYMENT_BULLET'),
  ('OT_GOLD_BULLET', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_GOLD_BULLET', 'OET_TIME', 'CALENDAR_HAS_DEADLINE'),
  ('OT_FACILITY_AUTO', 'OET_NATURE', 'FACILITY_OBLIGATION'),
  ('OT_FACILITY_AUTO', 'OET_VALUE', 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY'),
  ('OT_FACILITY_AUTO', 'OET_ACTIVATION', 'EVENT_FACILITY_OPEN'),
  ('OT_FACILITY_AUTO', 'OET_FULFILLMENT', 'PAYMENT_CYCLE_STATEMENT'),
  ('OT_FACILITY_AUTO', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_FACILITY_AUTO', 'OET_TIME', 'CALENDAR_HAS_CYCLE'),
  ('OT_COMMITMENT', 'OET_NATURE', 'CONDITIONAL_OBLIGATION'),
  ('OT_COMMITMENT', 'OET_VALUE', 'VALUE_BY_EVENT'),
  ('OT_COMMITMENT', 'OET_ACTIVATION', 'CONDITIONAL_TRIGGER'),
  ('OT_COMMITMENT', 'OET_FULFILLMENT', 'FULFILL_ON_CONDITION'),
  ('OT_COMMITMENT', 'OET_RECOVERY', 'ASSET_PLEDGE'),
  ('OT_COMMITMENT', 'OET_TIME', 'CALENDAR_HAS_DEADLINE');

-- ===== 8. lifecycle + lifecycle_state (danh sách state [suy luận] theo đúng SỐ STATE trên UI) =====
INSERT INTO "lifecycle" ("code", "name", "governs", "status") VALUES
  ('LIFE_CYCLE_TERM_LOAN', 'Vòng đời khoản vay kỳ hạn', 'Term Loan Obligation', 'published'),
  ('LIFE_CYCLE_FACILITY', 'Vòng đời hạn mức', 'Facility Obligation', 'published'),
  ('LIFE_PRODUCT', 'Vòng đời sản phẩm', 'Product Variant', 'published'),
  ('LIFE_PATTERN', 'Vòng đời Pattern', 'Product Pattern', 'published'),
  ('LIFE_CONFIG', 'Vòng đời Config (maker–checker)', 'Product Config', 'published'),
  ('LIFE_DOMAIN', 'Vòng đời Domain', 'Domain', 'approved');

INSERT INTO "lifecycle_state" ("lifecycle_code", "sort_order", "name") VALUES
  ('LIFE_CYCLE_TERM_LOAN', 1, 'Draft'),
  ('LIFE_CYCLE_TERM_LOAN', 2, 'Approved'),
  ('LIFE_CYCLE_TERM_LOAN', 3, 'Disbursed'),
  ('LIFE_CYCLE_TERM_LOAN', 4, 'Active'),
  ('LIFE_CYCLE_TERM_LOAN', 5, 'Overdue'),
  ('LIFE_CYCLE_TERM_LOAN', 6, 'Restructured'),
  ('LIFE_CYCLE_TERM_LOAN', 7, 'Closed'),
  ('LIFE_CYCLE_FACILITY', 1, 'Draft'),
  ('LIFE_CYCLE_FACILITY', 2, 'Approved'),
  ('LIFE_CYCLE_FACILITY', 3, 'Open'),
  ('LIFE_CYCLE_FACILITY', 4, 'Active'),
  ('LIFE_CYCLE_FACILITY', 5, 'Suspended'),
  ('LIFE_CYCLE_FACILITY', 6, 'Closed'),
  ('LIFE_PRODUCT', 1, 'Draft'),
  ('LIFE_PRODUCT', 2, 'Approved'),
  ('LIFE_PRODUCT', 3, 'Published'),
  ('LIFE_PRODUCT', 4, 'Suspended'),
  ('LIFE_PRODUCT', 5, 'Retired'),
  ('LIFE_PATTERN', 1, 'Draft'),
  ('LIFE_PATTERN', 2, 'Review'),
  ('LIFE_PATTERN', 3, 'Approved'),
  ('LIFE_PATTERN', 4, 'Published'),
  ('LIFE_PATTERN', 5, 'Retired'),
  ('LIFE_CONFIG', 1, 'Draft'),
  ('LIFE_CONFIG', 2, 'Review'),
  ('LIFE_CONFIG', 3, 'Approved'),
  ('LIFE_CONFIG', 4, 'Rejected'),
  ('LIFE_CONFIG', 5, 'Published'),
  ('LIFE_CONFIG', 6, 'Retired'),
  ('LIFE_DOMAIN', 1, 'Draft'),
  ('LIFE_DOMAIN', 2, 'Active'),
  ('LIFE_DOMAIN', 3, 'Deprecated'),
  ('LIFE_DOMAIN', 4, 'Retired');

-- ===== 9. domain =====
INSERT INTO "domain" ("code", "name", "description", "entity_count", "status") VALUES
  ('DOM_PRODUCT', 'Product', 'Miền sản phẩm & cấu trúc bán', 142, 'published'),
  ('DOM_OBLIGATION', 'Obligation', 'Miền nghĩa vụ tài chính', 98, 'published'),
  ('DOM_PARTY', 'Party', 'Miền các bên tham gia', 37, 'published'),
  ('DOM_COLLATERAL', 'Collateral', 'Miền tài sản đảm bảo', 54, 'published'),
  ('DOM_PRICING', 'Pricing', 'Miền giá & lãi suất', 29, 'approved');

-- ===== 10. data_type — 7 hiển thị + DT_REF, DT_TEXT (badge UI ghi 9) =====
INSERT INTO "data_type" ("code", "name") VALUES
  ('DT_MONEY', 'Money'),
  ('DT_PERCENT', 'Percent'),
  ('DT_INT', 'Integer'),
  ('DT_ENUM', 'Enum'),
  ('DT_RANGE', 'Range'),
  ('DT_BOOL', 'Boolean'),
  ('DT_FORMULA', 'Formula'),
  ('DT_REF', 'Reference'),
  ('DT_TEXT', 'Text');

-- ===== 11. attribute_group — 6 hiển thị + 6 [suy luận] phủ hết attribute (badge UI ghi 12) =====
INSERT INTO "attribute_group" ("code", "name", "domain_code") VALUES
  ('GRP_PRICING', 'Pricing', 'DOM_PRICING'),
  ('GRP_LIMIT', 'Limit', 'DOM_PRODUCT'),
  ('GRP_COLLATERAL', 'Collateral', 'DOM_COLLATERAL'),
  ('GRP_REPAYMENT', 'Repayment', 'DOM_OBLIGATION'),
  ('GRP_PARTY', 'Party', 'DOM_PARTY'),
  ('GRP_PENALTY', 'Penalty', 'DOM_OBLIGATION'),
  ('GRP_ELIGIBILITY', 'Eligibility', 'DOM_PARTY'),
  ('GRP_DISBURSEMENT', 'Disbursement', 'DOM_PRODUCT'),
  ('GRP_BILLING', 'Billing', 'DOM_PRODUCT'),
  ('GRP_LEGAL', 'Legal & Compliance', 'DOM_PRODUCT'),
  ('GRP_FEE', 'Fee', 'DOM_PRICING'),
  ('GRP_VALUE', 'Value Base', 'DOM_PRODUCT');

-- ===== 12. attribute — 31 attribute từ ATTR_NAMES (từ điển đầy đủ 64, HTML chứa 31) =====
INSERT INTO "attribute" ("code", "name", "group_code", "data_type_code", "is_required", "default_value", "unit") VALUES
  ('base_rate', 'Lãi suất cơ sở', 'GRP_PRICING', 'DT_PERCENT', true, '1,5%/tháng', '%/tháng'),
  ('rate_type', 'Loại lãi suất', 'GRP_PRICING', 'DT_ENUM', true, 'Cố định', NULL),
  ('interest_calc', 'Công thức tính lãi', 'GRP_PRICING', 'DT_FORMULA', true, 'Dư nợ giảm dần', NULL),
  ('limit_amount', 'Hạn mức cấp', 'GRP_LIMIT', 'DT_MONEY', true, '3tr – 2 tỷ', 'VND'),
  ('min_amount', 'Số dư tối thiểu', 'GRP_LIMIT', 'DT_MONEY', false, '0đ', 'VND'),
  ('capacity_range', 'Khoảng capacity', 'GRP_LIMIT', 'DT_RANGE', true, 'Có quản trị', NULL),
  ('ltv', 'Tỷ lệ cho vay (LTV)', 'GRP_COLLATERAL', 'DT_PERCENT', true, '80%', '%'),
  ('asset_type', 'Loại tài sản', 'GRP_COLLATERAL', 'DT_ENUM', true, 'Xe máy', NULL),
  ('asset_valuation', 'Công thức định giá TS', 'GRP_COLLATERAL', 'DT_FORMULA', true, '70% giá trị', NULL),
  ('repay_method', 'Phương thức trả nợ', 'GRP_REPAYMENT', 'DT_ENUM', true, 'Trả góp nhiều kỳ', NULL),
  ('installment_count', 'Số kỳ trả góp', 'GRP_REPAYMENT', 'DT_INT', true, '1 – 18', 'kỳ'),
  ('schedule', 'Lịch trả nợ', 'GRP_REPAYMENT', 'DT_ENUM', true, 'Hàng tháng', NULL),
  ('lender_party', 'Bên cho vay', 'GRP_PARTY', 'DT_REF', true, 'F88', NULL),
  ('borrower_type', 'Loại bên vay', 'GRP_PARTY', 'DT_ENUM', true, 'Cá nhân', NULL),
  ('beneficiary', 'Bên thụ hưởng', 'GRP_PARTY', 'DT_REF', false, NULL, NULL),
  ('penalty_rate', 'Lãi suất phạt', 'GRP_PENALTY', 'DT_PERCENT', false, '150% lãi', '% lãi trong hạn'),
  ('grace', 'Số ngày ân hạn', 'GRP_PENALTY', 'DT_INT', false, '5 ngày', 'ngày'),
  ('age', 'Độ tuổi', 'GRP_ELIGIBILITY', 'DT_RANGE', true, '18 – 60', 'tuổi'),
  ('occupation', 'Nghề nghiệp', 'GRP_ELIGIBILITY', 'DT_ENUM', false, NULL, NULL),
  ('min_income', 'Thu nhập tối thiểu', 'GRP_ELIGIBILITY', 'DT_MONEY', true, '5.000.000đ', 'VND'),
  ('decrease_method', 'Phương thức giảm gốc', 'GRP_VALUE', 'DT_ENUM', true, 'Giảm dần theo gốc', NULL),
  ('principal_base', 'Cơ sở gốc', 'GRP_VALUE', 'DT_ENUM', true, 'Gốc vay', NULL),
  ('disb_method', 'Phương thức giải ngân', 'GRP_DISBURSEMENT', 'DT_ENUM', true, 'Chuyển khoản', NULL),
  ('disb_syntax', 'Cú pháp giải ngân', 'GRP_DISBURSEMENT', 'DT_TEXT', false, 'F88 {contract}', NULL),
  ('transfer_content', 'Nội dung chuyển tiền', 'GRP_DISBURSEMENT', 'DT_TEXT', false, NULL, NULL),
  ('fee_type', 'Loại phí', 'GRP_FEE', 'DT_ENUM', true, 'Phí thẩm định', NULL),
  ('fee_amount', 'Số tiền phí', 'GRP_FEE', 'DT_MONEY', false, NULL, 'VND'),
  ('legal_form', 'Hình thức pháp lý', 'GRP_LEGAL', 'DT_ENUM', true, 'Giấy nhận nợ', NULL),
  ('compliance', 'Cờ tuân thủ', 'GRP_LEGAL', 'DT_BOOL', true, 'Bật', NULL),
  ('stmt_cycle', 'Chu kỳ sao kê', 'GRP_BILLING', 'DT_ENUM', false, 'Hàng tháng', NULL),
  ('billing_day', 'Ngày chốt sao kê', 'GRP_BILLING', 'DT_INT', false, 'Ngày 5', NULL);

-- ===== 13. attribute_constraint — từ cột RÀNG BUỘC + cfgValidate() =====
INSERT INTO "attribute_constraint" ("attribute_code", "kind", "min_value", "max_value", "step_value", "expression", "depends_on_attribute_code", "message") VALUES
  ('base_rate', 'regulatory', NULL, 1.65, NULL, '≤ 1,65%/tháng (trần NHNN)', NULL, 'Vượt trần 1,65%/tháng'),
  ('base_rate', 'range', 0.3, 1.65, 0.1, 'cảnh báo khi > 1,5', NULL, 'Gần trần'),
  ('ltv', 'regulatory', NULL, 80, NULL, '≤ 80%', NULL, 'Vượt LTV 80%'),
  ('ltv', 'dependency', NULL, NULL, NULL, 'Chỉ áp dụng khi Recovery = ASSET_PLEDGE', 'asset_type', 'LTV yêu cầu tài sản cầm cố'),
  ('limit_amount', 'range', 3000000, 2000000000, NULL, '3.000.000đ – 2 tỷ', NULL, 'Ngoài khoảng hạn mức cho phép'),
  ('limit_amount', 'dependency', NULL, NULL, NULL, 'limit_amount ≤ ltv × asset_value', 'ltv', 'Vượt hạn mức theo LTV'),
  ('installment_count', 'range', 1, 18, 1, '1 – 18', NULL, 'Số kỳ ngoài khoảng 1–18'),
  ('penalty_rate', 'regulatory', NULL, 150, NULL, '≤ 150% lãi trong hạn', NULL, 'Vượt trần lãi phạt'),
  ('asset_type', 'enum', NULL, NULL, NULL, 'TwoWheels / Car / Gold…', NULL, NULL),
  ('age', 'range', 18, 60, NULL, 'MIN 18', NULL, 'Ngoài độ tuổi cho phép'),
  ('min_income', 'range', 0, NULL, NULL, '≥ 0', NULL, NULL),
  ('billing_day', 'range', 1, 28, 1, '1–28', NULL, 'Ngày chốt ngoài 1–28'),
  ('lender_party', 'required', NULL, NULL, NULL, 'is_identify = true', NULL, NULL),
  ('compliance', 'required', NULL, NULL, NULL, 'by-default', NULL, NULL),
  ('capacity_range', 'required', NULL, NULL, NULL, 'HAS_CAPACITY', NULL, NULL);

-- ===== 14. attribute_enum_value =====
INSERT INTO "attribute_enum_value" ("attribute_code", "sort_order", "value") VALUES
  ('asset_type', 1, 'Xe máy (TwoWheels)'),
  ('asset_type', 2, 'Ô tô (Car)'),
  ('asset_type', 3, 'Vàng (Gold)'),
  ('rate_type', 1, 'Cố định'),
  ('rate_type', 2, 'Thả nổi'),
  ('occupation', 1, 'Nhân viên văn phòng'),
  ('occupation', 2, 'Công nhân'),
  ('occupation', 3, 'Kinh doanh tự do'),
  ('occupation', 4, 'Giáo viên / Công chức'),
  ('repay_method', 1, 'Trả góp nhiều kỳ'),
  ('repay_method', 2, 'Trả 1 lần (Bullet)'),
  ('borrower_type', 1, 'Cá nhân'),
  ('borrower_type', 2, 'Doanh nghiệp'),
  ('schedule', 1, 'Hàng tháng'),
  ('schedule', 2, 'Hàng quý'),
  ('legal_form', 1, 'Giấy nhận nợ'),
  ('legal_form', 2, 'Hợp đồng tín dụng'),
  ('fee_type', 1, 'Phí thẩm định'),
  ('fee_type', 2, 'Phí quản lý'),
  ('stmt_cycle', 1, 'Hàng tháng'),
  ('decrease_method', 1, 'Giảm dần theo gốc'),
  ('principal_base', 1, 'Gốc vay'),
  ('disb_method', 1, 'Chuyển khoản'),
  ('disb_method', 2, 'Tiền mặt');

-- ===== 15. block — 12 block (BLOCKS) =====
INSERT INTO "block" ("id", "code", "name", "biz_group", "governed_by_element_code", "governed_by_aspect", "status") VALUES
  ('BLK_ELIGIBILITY', 'BLOCK_ELIGIBILITY', 'Điều kiện tham gia', 'Khởi tạo', NULL, 'Eligibility', 'published'),
  ('BLK_COUNTERPARTY', 'BLOCK_COUNTERPARTY', 'Bên tham gia', 'Khởi tạo', NULL, 'Obligor Party', 'published'),
  ('BLK_REGULATORY', 'BLOCK_REGULATORY', 'Tuân thủ & Pháp lý', 'Khởi tạo', NULL, 'Legal Form', 'published'),
  ('BLK_LIMIT', 'BLOCK_LIMIT', 'Hạn mức (Limit)', 'Giá trị', 'FACILITY_OBLIGATION', NULL, 'published'),
  ('BLK_VALUEBASE', 'BLOCK_VALUE_BASE', 'Cơ sở giá trị (Value Base)', 'Giá trị', 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE', NULL, 'published'),
  ('BLK_DISBURSEMENT', 'BLOCK_DISBURSEMENT', 'Giải ngân (Disbursement)', 'Kích hoạt', 'EVENT_LENDER_DISBURSEMENT', NULL, 'published'),
  ('BLK_INTEREST', 'BLOCK_INTEREST', 'Lãi suất (Interest)', 'Vận hành', 'TERM_LOAN_OBLIGATION', NULL, 'published'),
  ('BLK_FEE', 'BLOCK_FEE', 'Phí (Fee)', 'Vận hành', 'TERM_LOAN_OBLIGATION', NULL, 'published'),
  ('BLK_REPAYMENT', 'BLOCK_REPAYMENT', 'Trả nợ (Repayment)', 'Vận hành', 'PAYMENT_MULTISTEP_INSTALLMENT', NULL, 'published'),
  ('BLK_COLLATERAL', 'BLOCK_COLLATERAL', 'Tài sản đảm bảo', 'Thu hồi', 'ASSET_PLEDGE', NULL, 'published'),
  ('BLK_PENALTY', 'BLOCK_PENALTY', 'Phạt & Quá hạn', 'Thu hồi', NULL, 'PENALTY', 'published'),
  ('BLK_BILLING', 'BLOCK_BILLING', 'Sao kê & Hóa đơn', 'Vận hành', 'CALENDAR_HAS_CYCLE', NULL, 'published');

-- ===== 16. answer_slot — 30 slot (BLOCKS[].slots) =====
INSERT INTO "answer_slot" ("block_id", "code", "name", "attribute_code", "is_required", "default_value", "rule_text") VALUES
  ('BLK_ELIGIBILITY', 'age', 'Độ tuổi', 'age', true, '18 – 60', 'MIN 18'),
  ('BLK_ELIGIBILITY', 'occupation', 'Nghề nghiệp', 'occupation', false, NULL, NULL),
  ('BLK_ELIGIBILITY', 'min_income', 'Thu nhập tối thiểu', 'min_income', true, '5.000.000đ', '≥ 0'),
  ('BLK_COUNTERPARTY', 'lender_party', 'Lender Party', 'lender_party', true, 'F88', 'is_identify'),
  ('BLK_COUNTERPARTY', 'borrower_type', 'Borrower Party Type', 'borrower_type', true, 'Cá nhân', NULL),
  ('BLK_COUNTERPARTY', 'beneficiary', 'Beneficiary Party', 'beneficiary', false, NULL, NULL),
  ('BLK_REGULATORY', 'legal_form', 'Legal Form', 'legal_form', true, 'Giấy nhận nợ', NULL),
  ('BLK_REGULATORY', 'compliance', 'Compliance Flag', 'compliance', true, 'Bật', 'by-default'),
  ('BLK_LIMIT', 'limit_amount', 'Hạn mức cấp', 'limit_amount', true, '3tr – 2 tỷ', 'range'),
  ('BLK_LIMIT', 'min_amount', 'Số dư tối thiểu', 'min_amount', false, '0đ', NULL),
  ('BLK_LIMIT', 'capacity_range', 'Capacity Range', 'capacity_range', true, 'Có quản trị', 'HAS_CAPACITY'),
  ('BLK_VALUEBASE', 'decrease_method', 'Decrease Method', 'decrease_method', true, 'Giảm dần theo gốc', 'MULTI_DECREASE'),
  ('BLK_VALUEBASE', 'principal_base', 'Principal Base', 'principal_base', true, 'Gốc vay', 'NO_INCREASE'),
  ('BLK_DISBURSEMENT', 'disb_method', 'Disbursement Method', 'disb_method', true, 'Chuyển khoản', NULL),
  ('BLK_DISBURSEMENT', 'disb_syntax', 'Disbursement Syntax', 'disb_syntax', false, 'F88 {contract}', NULL),
  ('BLK_DISBURSEMENT', 'transfer_content', 'Money Transfer Content', 'transfer_content', false, NULL, NULL),
  ('BLK_INTEREST', 'interest_calc', 'Interest Calculation', 'interest_calc', true, 'Dư nợ giảm dần', NULL),
  ('BLK_INTEREST', 'base_rate', 'Base Rate', 'base_rate', true, '1,5%/tháng', '≤ trần NHNN'),
  ('BLK_INTEREST', 'rate_type', 'Rate Type', 'rate_type', true, 'Cố định', NULL),
  ('BLK_FEE', 'fee_type', 'Fee Type', 'fee_type', true, 'Phí thẩm định', NULL),
  ('BLK_FEE', 'fee_amount', 'Fee Amount', 'fee_amount', false, NULL, NULL),
  ('BLK_REPAYMENT', 'repay_method', 'Repayment Method', 'repay_method', true, 'Trả góp nhiều kỳ', 'MULTISTEP'),
  ('BLK_REPAYMENT', 'installment_count', 'Số kỳ', 'installment_count', true, '1 – 18', NULL),
  ('BLK_REPAYMENT', 'schedule', 'Lịch trả', 'schedule', true, 'Hàng tháng', 'HAS_CYCLE'),
  ('BLK_COLLATERAL', 'asset_type', 'Asset Type', 'asset_type', true, 'Xe máy', 'ASSET_PLEDGE'),
  ('BLK_COLLATERAL', 'asset_valuation', 'Asset Valuation Formula', 'asset_valuation', true, '70% giá trị', 'LTV ≤ 80%'),
  ('BLK_COLLATERAL', 'ltv', 'LTV tối đa', 'ltv', true, '80%', '≤ 80%'),
  ('BLK_PENALTY', 'penalty_rate', 'Penalty Rate', 'penalty_rate', true, '150% lãi', '≤ 150%'),
  ('BLK_PENALTY', 'grace', 'Grace Period', 'grace', false, '5 ngày', NULL),
  ('BLK_BILLING', 'stmt_cycle', 'Statement Cycle', 'stmt_cycle', false, 'Hàng tháng', NULL),
  ('BLK_BILLING', 'billing_day', 'Billing Day', 'billing_day', false, 'Ngày 5', '1–28');

-- ===== 17. selector_scope — priority: people > place > time > default (CFG_PRIORITY) =====
INSERT INTO "selector_scope" ("code", "name", "priority") VALUES
  ('default', 'Mặc định', 0),
  ('time', 'Time (Hiệu lực)', 1),
  ('place', 'Place (Khu vực)', 2),
  ('people', 'People (Borrower Segment)', 3);

-- ===== 17b. app_user — Giai đoạn 42: người dùng thật cho bộ chọn "đổi vai trò" ở sidebar.
-- 5/6 tên đã tồn tại thật, dùng nhất quán trong activity_log/version_entry từ trước (không bịa
-- người mới) — chỉ 'Quản trị viên' (Admin) là nhân vật mới thêm để demo vai trò xem-toàn-bộ. =====
INSERT INTO "app_user" ("code", "name", "role", "status") VALUES
  ('USR-01', 'Phạm An', 'Product Designer', 'published'),
  ('USR-02', 'Trần Lan', 'Product Owner', 'published'),
  ('USR-03', 'Lê Minh', 'Checker / Approver', 'published'),
  ('USR-04', 'Phạm Designer', 'Product Designer', 'published'),
  ('USR-05', 'Hệ thống', 'Operations', 'published'),
  ('USR-06', 'Quản trị viên', 'Admin', 'published');

-- ===== 18. business_intent — 7 BI (list view; period/objective theo UI) =====
INSERT INTO "business_intent" ("id", "name", "owner", "period", "objective", "status") VALUES
  (1, 'Mở rộng tín dụng nhân văn 2025', 'Khối Kinh doanh', 'Năm 2025', 'Phục vụ KH dưới chuẩn ngân hàng', 'published'),
  (2, 'Tăng trưởng cầm cố xe máy', 'Khối Sản phẩm', 'Năm 2025', 'Chiếm thị phần vay nhanh tài sản', 'published'),
  (3, 'Số hóa hành trình vay', 'Khối Công nghệ', 'Năm 2025', 'Đẩy tỷ trọng giải ngân qua App', 'review'),
  (4, 'Sản phẩm vay hạn mức linh hoạt', 'Khối Sản phẩm', 'Năm 2025', 'Giữ chân KH vay nhiều lần', 'approved'),
  (5, 'Cho vay tín chấp lương', 'Khối Kinh doanh', 'Năm 2025', 'Khai thác tệp KH có thu nhập ổn định', 'draft'),
  (6, 'Tối ưu thu hồi & rủi ro', 'Khối Quản trị rủi ro', 'Năm 2025', 'Giảm tỷ lệ quá hạn xuống <3%', 'published'),
  (7, 'Gói KH thân thiết', 'Khối Marketing', 'Năm 2025', 'Ưu đãi lãi suất theo lịch sử trả nợ', 'review');

SELECT setval(pg_get_serial_sequence('business_intent','id'), 7);

-- ===== 19. business_intent_kpi — KPI mẫu của BI-01 (wizard defaults) =====
INSERT INTO "business_intent_kpi" ("business_intent_id", "sort_order", "metric", "target", "unit") VALUES
  (1, 1, 'Dư nợ giải ngân mới', '1.200 tỷ', 'VND/năm'),
  (1, 2, 'Số hợp đồng', '48.000', 'HĐ/năm'),
  (1, 3, 'Tỷ lệ nợ xấu (NPL)', '≤ 3,0', '%'),
  (6, 1, 'Tỷ lệ quá hạn', '< 3,0', '%');

-- ===== 19b. business_intent_kpi — bổ sung KPI cho BI-02,03,04,05,07 (thiếu trong bản gốc, suy diễn từ objective từng BI) =====
INSERT INTO "business_intent_kpi" ("business_intent_id", "sort_order", "metric", "target", "unit") VALUES
  (2, 1, 'Dư nợ cầm cố xe máy mới', '300 tỷ', 'VND/năm'),
  (2, 2, 'Số hợp đồng cầm cố xe máy', '15.000', 'HĐ/năm'),
  (2, 3, 'Thời gian giải ngân trung bình', '≤ 30', 'phút'),
  (3, 1, 'Tỷ trọng giải ngân qua App', '≥ 60', '%'),
  (3, 2, 'Thời gian phê duyệt online', '≤ 15', 'phút'),
  (3, 3, 'Tỷ lệ hồ sơ e-KYC thành công', '≥ 95', '%'),
  (4, 1, 'Số KH có hạn mức tái sử dụng', '20.000', 'KH'),
  (4, 2, 'Tỷ lệ tái vay trong hạn mức', '≥ 40', '%'),
  (4, 3, 'Dư nợ hạn mức bình quân', '150 tỷ', 'VND'),
  (5, 1, 'Dư nợ tín chấp lương mới', '200 tỷ', 'VND/năm'),
  (5, 2, 'Số hợp đồng tín chấp lương', '8.000', 'HĐ/năm'),
  (5, 3, 'Tỷ lệ nợ xấu tín chấp', '≤ 4,0', '%'),
  (7, 1, 'Số KH đạt hạng Loyalty/VIP', '10.000', 'KH'),
  (7, 2, 'Tỷ lệ giữ chân KH thân thiết', '≥ 70', '%'),
  (7, 3, 'Mức ưu đãi lãi suất bình quân', '−0,4', '%/tháng');

-- ===== 20. customer_segment — audience (tplWizard) + tier (simulation segMap) =====
INSERT INTO "customer_segment" ("code", "name", "audience", "tier", "legal_requirement") VALUES
  ('SEG_INDIVIDUAL', 'Khách hàng cá nhân', 'individual', NULL, 'CMND/CCCD · Giấy nhận nợ cá nhân'),
  ('SEG_BUSINESS', 'Khách hàng doanh nghiệp', 'business', NULL, 'ĐKKD · Hợp đồng tín dụng DN'),
  ('SEG_STANDARD', 'Khách hàng tiêu chuẩn', 'individual', 'standard', 'CMND/CCCD · Giấy nhận nợ cá nhân'),
  ('SEG_LOYALTY', 'Khách hàng thân thiết (−0,5%/tháng)', 'individual', 'loyalty', 'CMND/CCCD · Giấy nhận nợ cá nhân'),
  ('SEG_VIP', 'Khách hàng VIP (−0,3%/tháng)', 'individual', 'vip', 'CMND/CCCD · Giấy nhận nợ cá nhân');

-- ===== 21. product_intent — 6 PI (list view; liên kết BI [suy luận] theo chủ đề) =====
INSERT INTO "product_intent" ("id", "code", "name", "business_intent_id", "nature_element_code", "archetype_code", "status") VALUES
  (1, 'PI-001', 'Cho vay tiêu dùng nhỏ lẻ', 1, 'TERM_LOAN_OBLIGATION', 'FOA_TERM_LOAN', 'published'),
  (2, 'PI-002', 'Cấp hạn mức để cho vay', 4, 'FACILITY_OBLIGATION', 'FOA_REVOLVING', 'published'),
  (3, 'PI-003', 'Cho vay tiêu dùng có hạn mức', 4, 'FACILITY_OBLIGATION', 'FOA_REVOLVING', 'review'),
  (4, 'PI-004', 'Cho vay cầm cố ô tô', 2, 'TERM_LOAN_OBLIGATION', 'FOA_TERM_LOAN', 'approved'),
  (5, 'PI-005', 'Cho vay cầm cố xe máy trả góp', 2, 'TERM_LOAN_OBLIGATION', 'FOA_TERM_LOAN', 'published'),
  (6, 'PI-006', 'Vay tín chấp lương', 5, 'TERM_LOAN_OBLIGATION', 'FOA_TERM_LOAN', 'draft');

SELECT setval(pg_get_serial_sequence('product_intent','id'), 6);

-- ===== 22. product_intent_element — element nền (PI-003 ghép FACILITY + LOAN theo list view) =====
INSERT INTO "product_intent_element" ("product_intent_id", "element_code") VALUES
  (3, 'TERM_LOAN_OBLIGATION'),
  (3, 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY'),
  (3, 'PAYMENT_CYCLE_STATEMENT'),
  (5, 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  (5, 'EVENT_LENDER_DISBURSEMENT'),
  (5, 'PAYMENT_MULTISTEP_INSTALLMENT'),
  (5, 'ASSET_PLEDGE'),
  (5, 'CALENDAR_HAS_CYCLE_HAS_DEADLINE');

-- ===== 22b. product_intent_element — bổ sung PI-001,002,004,006 (thiếu trong bản gốc; suy diễn nguyên vẹn
-- từ obligation_type_composition của Obligation Type mà Pattern gắn với Intent đó dùng, không bịa mã mới) =====
INSERT INTO "product_intent_element" ("product_intent_id", "element_code") VALUES
  -- PI-001 'Cho vay tiêu dùng nhỏ lẻ' → PT-005/PT-003 nhóm tín chấp+cầm cố trả góp dùng chung archetype FOA_TERM_LOAN;
  -- lấy nguyên bộ composition của OT_UNSECURED (đại diện Term Loan không TSĐB)
  (1, 'TERM_LOAN_OBLIGATION'),
  (1, 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  (1, 'EVENT_LENDER_DISBURSEMENT'),
  (1, 'PAYMENT_MULTISTEP_INSTALLMENT'),
  (1, 'UNSECURED'),
  (1, 'CALENDAR_HAS_CYCLE_HAS_DEADLINE'),
  -- PI-002 'Cấp hạn mức để cho vay' → archetype FOA_REVOLVING; lấy nguyên bộ composition của OT_FACILITY
  (2, 'FACILITY_OBLIGATION'),
  (2, 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY'),
  (2, 'EVENT_FACILITY_OPEN'),
  (2, 'PAYMENT_CYCLE_STATEMENT'),
  (2, 'ASSET_PLEDGE'),
  (2, 'CALENDAR_HAS_CYCLE'),
  -- PI-004 'Cho vay cầm cố ô tô' → Pattern PT-006 gắn OT_AUTO_PLEDGE; lấy nguyên bộ composition tương ứng
  (4, 'TERM_LOAN_OBLIGATION'),
  (4, 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  (4, 'EVENT_LENDER_DISBURSEMENT'),
  (4, 'PAYMENT_MULTISTEP_INSTALLMENT'),
  (4, 'ASSET_PLEDGE'),
  (4, 'CALENDAR_HAS_CYCLE_HAS_DEADLINE'),
  -- PI-006 'Vay tín chấp lương' → Pattern PT-005 gắn OT_UNSECURED; lấy nguyên bộ composition tương ứng
  (6, 'TERM_LOAN_OBLIGATION'),
  (6, 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE'),
  (6, 'EVENT_LENDER_DISBURSEMENT'),
  (6, 'PAYMENT_MULTISTEP_INSTALLMENT'),
  (6, 'UNSECURED'),
  (6, 'CALENDAR_HAS_CYCLE_HAS_DEADLINE');

-- ===== 23. product_pattern — 6 PT (list view; intent nguồn: PT-002←PI-003 theo version note, còn lại [suy luận]) =====
INSERT INTO "product_pattern" ("code", "name", "product_intent_id", "status") VALUES
  ('PT-001', 'Khuôn vay cầm cố trả góp', 5, 'published'),
  ('PT-002', 'Khuôn vay tiêu dùng có hạn mức', 3, 'review'),
  ('PT-003', 'Khuôn vay cầm cố Bullet', 1, 'approved'),
  ('PT-004', 'Khuôn vay hạn mức Facility', 2, 'draft'),
  ('PT-005', 'Khuôn vay tín chấp lương', 6, 'published'),
  ('PT-006', 'Khuôn vay cầm cố ô tô', 4, 'approved');

-- ===== 24. pattern_block — canvas theo SỐ BLOCK trên list + Ma trận 3/4 =====
INSERT INTO "pattern_block" ("pattern_code", "block_id", "position", "usage") VALUES
  ('PT-001', 'BLK_COUNTERPARTY', 1, 'active'),
  ('PT-001', 'BLK_REGULATORY', 2, 'active'),
  ('PT-001', 'BLK_INTEREST', 3, 'active'),
  ('PT-001', 'BLK_FEE', 4, 'active'),
  ('PT-001', 'BLK_REPAYMENT', 5, 'active'),
  ('PT-001', 'BLK_COLLATERAL', 6, 'active'),
  ('PT-001', 'BLK_PENALTY', 7, 'active'),
  ('PT-002', 'BLK_ELIGIBILITY', 1, 'active'),
  ('PT-002', 'BLK_COUNTERPARTY', 2, 'active'),
  ('PT-002', 'BLK_REGULATORY', 3, 'active'),
  ('PT-002', 'BLK_LIMIT', 4, 'active'),
  ('PT-002', 'BLK_INTEREST', 5, 'active'),
  ('PT-002', 'BLK_REPAYMENT', 6, 'active'),
  ('PT-002', 'BLK_COLLATERAL', 7, 'active'),
  ('PT-002', 'BLK_PENALTY', 8, 'active'),
  ('PT-002', 'BLK_BILLING', 9, 'active'),
  ('PT-003', 'BLK_COUNTERPARTY', 1, 'active'),
  ('PT-003', 'BLK_REGULATORY', 2, 'active'),
  ('PT-003', 'BLK_DISBURSEMENT', 3, 'active'),
  ('PT-003', 'BLK_INTEREST', 4, 'active'),
  ('PT-003', 'BLK_COLLATERAL', 5, 'active'),
  ('PT-003', 'BLK_PENALTY', 6, 'active'),
  ('PT-004', 'BLK_COUNTERPARTY', 1, 'active'),
  ('PT-004', 'BLK_REGULATORY', 2, 'active'),
  ('PT-004', 'BLK_LIMIT', 3, 'active'),
  ('PT-004', 'BLK_INTEREST', 4, 'active'),
  ('PT-004', 'BLK_FEE', 5, 'active'),
  ('PT-004', 'BLK_REPAYMENT', 6, 'active'),
  ('PT-004', 'BLK_BILLING', 7, 'active'),
  ('PT-004', 'BLK_PENALTY', 8, 'active'),
  ('PT-005', 'BLK_ELIGIBILITY', 1, 'active'),
  ('PT-005', 'BLK_COUNTERPARTY', 2, 'active'),
  ('PT-005', 'BLK_INTEREST', 3, 'active'),
  ('PT-005', 'BLK_REPAYMENT', 4, 'active'),
  ('PT-005', 'BLK_PENALTY', 5, 'active'),
  ('PT-006', 'BLK_COUNTERPARTY', 1, 'active'),
  ('PT-006', 'BLK_REGULATORY', 2, 'active'),
  ('PT-006', 'BLK_INTEREST', 3, 'active'),
  ('PT-006', 'BLK_FEE', 4, 'active'),
  ('PT-006', 'BLK_REPAYMENT', 5, 'active'),
  ('PT-006', 'BLK_COLLATERAL', 6, 'active'),
  ('PT-006', 'BLK_PENALTY', 7, 'active');

-- ===== 25. pattern_obligation_type =====
INSERT INTO "pattern_obligation_type" ("pattern_code", "obligation_type_code", "role") VALUES
  ('PT-001', 'OT_PLEDGE_INSTALLMENT', 'Primary'),
  ('PT-002', 'OT_FACILITY', 'Primary'),
  ('PT-002', 'OT_PLEDGE_INSTALLMENT', 'Support'),
  ('PT-003', 'OT_PLEDGE_BULLET', 'Primary'),
  ('PT-004', 'OT_FACILITY', 'Primary'),
  ('PT-005', 'OT_UNSECURED', 'Primary'),
  ('PT-006', 'OT_AUTO_PLEDGE', 'Primary');

-- ===== 26. product_template — 6 TPL (list view) =====
INSERT INTO "product_template" ("code", "name", "from_pattern_code", "status") VALUES
  ('TPL-001', 'Vay cầm cố trả góp · KH cá nhân', 'PT-001', 'published'),
  ('TPL-002', 'Vay cầm cố trả góp · KH doanh nghiệp', 'PT-001', 'approved'),
  -- TPL-003 sửa 'review' → 'published' (Giai đoạn 43): version_entry head thật (v1.2, is_head=true)
  -- đã ở status 'published' từ 2026-06-30, và cả CFG-0042/CFG-0041 (đóng gói từ TPL-003) đều đã
  -- published — Template nguồn không thể ở lifecycle sau Config↔Variant. Lỗi seed cùng loại với
  -- Giai đoạn 40 (Config↔Variant), lần này ở cấp Template↔version_entry.
  ('TPL-003', 'Vay hạn mức cầm cố · KH cá nhân', 'PT-002', 'published'),
  ('TPL-004', 'Vay cầm cố ô tô · trả góp', 'PT-006', 'published'),
  ('TPL-005', 'Vay Bullet cầm cố · cá nhân', 'PT-003', 'draft'),
  ('TPL-006', 'Vay tín chấp lương · cá nhân', 'PT-005', 'published');

-- ===== 27. template_segment =====
INSERT INTO "template_segment" ("template_code", "segment_code") VALUES
  ('TPL-001', 'SEG_INDIVIDUAL'),
  ('TPL-002', 'SEG_BUSINESS'),
  ('TPL-003', 'SEG_INDIVIDUAL'),
  ('TPL-004', 'SEG_INDIVIDUAL'),
  ('TPL-005', 'SEG_INDIVIDUAL'),
  ('TPL-006', 'SEG_INDIVIDUAL');

-- ===== 28. template_frame — giá trị khung TPL-003 (TPL_BLOCKS + version v1.2: LTV khung 75%, khóa Penalty) =====
INSERT INTO "template_frame" ("template_code", "block_id", "slot_code", "frame_value") VALUES
  ('TPL-003', 'BLK_COUNTERPARTY', 'lender_party', 'F88'),
  ('TPL-003', 'BLK_COUNTERPARTY', 'borrower_type', 'Cá nhân'),
  ('TPL-003', 'BLK_LIMIT', 'limit_amount', '3tr – 50tr'),
  ('TPL-003', 'BLK_INTEREST', 'base_rate', '1,5%/tháng'),
  ('TPL-003', 'BLK_INTEREST', 'rate_type', 'Cố định'),
  ('TPL-003', 'BLK_REPAYMENT', 'installment_count', '1 – 18'),
  ('TPL-003', 'BLK_REPAYMENT', 'schedule', 'Hàng tháng'),
  ('TPL-003', 'BLK_COLLATERAL', 'asset_type', 'Xe máy'),
  ('TPL-003', 'BLK_COLLATERAL', 'ltv', '75%'),
  ('TPL-003', 'BLK_BILLING', 'stmt_cycle', 'Hàng tháng');

-- ===== 28b. template_frame — bổ sung TPL-001,002,004,005,006 (thiếu trong bản gốc; suy diễn theo đúng block
-- của Pattern gốc mỗi Template — pattern_block — và slot_code/default_value thật của answer_slot). Phủ ĐỦ
-- mọi slot BẮT BUỘC (is_required=true) của từng block — không chỉ 1 vài slot "tiêu đề" như bản trước, để
-- tránh hiện "— chưa đặt giá trị khung —" cho slot lẽ ra phải có; slot KHÔNG bắt buộc (beneficiary, min_amount,
-- fee_amount, grace, disb_syntax, transfer_content, occupation, billing_day) chủ động để trống — đúng nghĩa
-- "chưa cấu hình", không phải lỗi. =====
INSERT INTO "template_frame" ("template_code", "block_id", "slot_code", "frame_value") VALUES
  -- TPL-001 'Vay cầm cố trả góp · KH cá nhân' ← PT-001 (COUNTERPARTY/REGULATORY/INTEREST/FEE/REPAYMENT/COLLATERAL/PENALTY)
  ('TPL-001', 'BLK_COUNTERPARTY', 'lender_party', 'F88'),
  ('TPL-001', 'BLK_COUNTERPARTY', 'borrower_type', 'Cá nhân'),
  ('TPL-001', 'BLK_REGULATORY', 'legal_form', 'Giấy nhận nợ'),
  ('TPL-001', 'BLK_REGULATORY', 'compliance', 'Bật'),
  ('TPL-001', 'BLK_INTEREST', 'interest_calc', 'Dư nợ giảm dần'),
  ('TPL-001', 'BLK_INTEREST', 'base_rate', '1,5%/tháng'),
  ('TPL-001', 'BLK_INTEREST', 'rate_type', 'Cố định'),
  ('TPL-001', 'BLK_FEE', 'fee_type', 'Phí thẩm định'),
  ('TPL-001', 'BLK_REPAYMENT', 'repay_method', 'Trả góp nhiều kỳ'),
  ('TPL-001', 'BLK_REPAYMENT', 'installment_count', '1 – 18'),
  ('TPL-001', 'BLK_REPAYMENT', 'schedule', 'Hàng tháng'),
  ('TPL-001', 'BLK_COLLATERAL', 'asset_type', 'Xe máy'),
  ('TPL-001', 'BLK_COLLATERAL', 'asset_valuation', '80% giá trị'),
  ('TPL-001', 'BLK_COLLATERAL', 'ltv', '80%'),
  ('TPL-001', 'BLK_PENALTY', 'penalty_rate', '150% lãi'),
  -- TPL-002 'Vay cầm cố trả góp · KH doanh nghiệp' ← PT-001 (đối tượng doanh nghiệp)
  ('TPL-002', 'BLK_COUNTERPARTY', 'lender_party', 'F88'),
  ('TPL-002', 'BLK_COUNTERPARTY', 'borrower_type', 'Doanh nghiệp'),
  ('TPL-002', 'BLK_REGULATORY', 'legal_form', 'Hợp đồng tín dụng'),
  ('TPL-002', 'BLK_REGULATORY', 'compliance', 'Bật'),
  ('TPL-002', 'BLK_INTEREST', 'interest_calc', 'Dư nợ giảm dần'),
  ('TPL-002', 'BLK_INTEREST', 'base_rate', '1,3%/tháng'),
  ('TPL-002', 'BLK_INTEREST', 'rate_type', 'Cố định'),
  ('TPL-002', 'BLK_FEE', 'fee_type', 'Phí quản lý'),
  ('TPL-002', 'BLK_REPAYMENT', 'repay_method', 'Trả góp nhiều kỳ'),
  ('TPL-002', 'BLK_REPAYMENT', 'installment_count', '6 – 24'),
  ('TPL-002', 'BLK_REPAYMENT', 'schedule', 'Hàng tháng'),
  ('TPL-002', 'BLK_COLLATERAL', 'asset_type', 'Ô tô'),
  ('TPL-002', 'BLK_COLLATERAL', 'asset_valuation', '70% giá trị'),
  ('TPL-002', 'BLK_COLLATERAL', 'ltv', '70%'),
  ('TPL-002', 'BLK_PENALTY', 'penalty_rate', '150% lãi'),
  -- TPL-004 'Vay cầm cố ô tô · trả góp' ← PT-006 (COUNTERPARTY/REGULATORY/INTEREST/FEE/REPAYMENT/COLLATERAL/PENALTY)
  ('TPL-004', 'BLK_COUNTERPARTY', 'lender_party', 'F88'),
  ('TPL-004', 'BLK_COUNTERPARTY', 'borrower_type', 'Cá nhân'),
  ('TPL-004', 'BLK_REGULATORY', 'legal_form', 'Giấy nhận nợ'),
  ('TPL-004', 'BLK_REGULATORY', 'compliance', 'Bật'),
  ('TPL-004', 'BLK_INTEREST', 'interest_calc', 'Dư nợ giảm dần'),
  ('TPL-004', 'BLK_INTEREST', 'base_rate', '1,1%/tháng'),
  ('TPL-004', 'BLK_INTEREST', 'rate_type', 'Cố định'),
  ('TPL-004', 'BLK_FEE', 'fee_type', 'Phí thẩm định'),
  ('TPL-004', 'BLK_REPAYMENT', 'repay_method', 'Trả góp nhiều kỳ'),
  ('TPL-004', 'BLK_REPAYMENT', 'installment_count', '6 – 36'),
  ('TPL-004', 'BLK_REPAYMENT', 'schedule', 'Hàng tháng'),
  ('TPL-004', 'BLK_COLLATERAL', 'asset_type', 'Ô tô'),
  ('TPL-004', 'BLK_COLLATERAL', 'asset_valuation', '70% giá trị'),
  ('TPL-004', 'BLK_COLLATERAL', 'ltv', '70%'),
  ('TPL-004', 'BLK_PENALTY', 'penalty_rate', '150% lãi'),
  -- TPL-005 'Vay Bullet cầm cố · cá nhân' ← PT-003 (COUNTERPARTY/REGULATORY/DISBURSEMENT/INTEREST/COLLATERAL/PENALTY)
  ('TPL-005', 'BLK_COUNTERPARTY', 'lender_party', 'F88'),
  ('TPL-005', 'BLK_COUNTERPARTY', 'borrower_type', 'Cá nhân'),
  ('TPL-005', 'BLK_REGULATORY', 'legal_form', 'Giấy nhận nợ'),
  ('TPL-005', 'BLK_REGULATORY', 'compliance', 'Bật'),
  ('TPL-005', 'BLK_DISBURSEMENT', 'disb_method', 'Chuyển khoản'),
  ('TPL-005', 'BLK_INTEREST', 'interest_calc', 'Lãi hàng tháng, gốc cuối kỳ (Bullet)'),
  ('TPL-005', 'BLK_INTEREST', 'base_rate', '1,3%/tháng'),
  ('TPL-005', 'BLK_INTEREST', 'rate_type', 'Cố định'),
  ('TPL-005', 'BLK_COLLATERAL', 'asset_type', 'Vàng'),
  ('TPL-005', 'BLK_COLLATERAL', 'asset_valuation', '85% giá trị'),
  ('TPL-005', 'BLK_COLLATERAL', 'ltv', '85%'),
  ('TPL-005', 'BLK_PENALTY', 'penalty_rate', '150% lãi'),
  -- TPL-006 'Vay tín chấp lương · cá nhân' ← PT-005 (ELIGIBILITY/COUNTERPARTY/INTEREST/REPAYMENT/PENALTY)
  ('TPL-006', 'BLK_ELIGIBILITY', 'age', '18 – 60'),
  ('TPL-006', 'BLK_ELIGIBILITY', 'min_income', '5.000.000đ'),
  ('TPL-006', 'BLK_COUNTERPARTY', 'lender_party', 'F88'),
  ('TPL-006', 'BLK_COUNTERPARTY', 'borrower_type', 'Cá nhân'),
  ('TPL-006', 'BLK_INTEREST', 'interest_calc', 'Dư nợ giảm dần'),
  ('TPL-006', 'BLK_INTEREST', 'base_rate', '1,6%/tháng'),
  ('TPL-006', 'BLK_INTEREST', 'rate_type', 'Cố định'),
  ('TPL-006', 'BLK_REPAYMENT', 'repay_method', 'Trả góp nhiều kỳ'),
  ('TPL-006', 'BLK_REPAYMENT', 'installment_count', '6 – 24'),
  ('TPL-006', 'BLK_REPAYMENT', 'schedule', 'Hàng tháng'),
  ('TPL-006', 'BLK_PENALTY', 'penalty_rate', '150% lãi');

-- ===== 28c. template_frame — bổ sung TPL-003 (thiếu 3 block ELIGIBILITY/REGULATORY/PENALTY mà Pattern
-- PT-002 (9 block) thực có nhưng bản gốc Giai đoạn 21 chỉ mới cover 6 block; + slot bắt buộc còn thiếu
-- trong 4 block đã có: capacity_range/interest_calc/repay_method/asset_valuation) — giữ nguyên 10 dòng
-- gốc phía trên (28), chỉ bổ sung thêm =====
INSERT INTO "template_frame" ("template_code", "block_id", "slot_code", "frame_value") VALUES
  ('TPL-003', 'BLK_ELIGIBILITY', 'age', '18 – 60'),
  ('TPL-003', 'BLK_ELIGIBILITY', 'min_income', '5.000.000đ'),
  ('TPL-003', 'BLK_REGULATORY', 'legal_form', 'Giấy nhận nợ'),
  ('TPL-003', 'BLK_REGULATORY', 'compliance', 'Bật'),
  ('TPL-003', 'BLK_LIMIT', 'capacity_range', 'Có quản trị'),
  ('TPL-003', 'BLK_INTEREST', 'interest_calc', 'Dư nợ giảm dần'),
  ('TPL-003', 'BLK_REPAYMENT', 'repay_method', 'Trả góp nhiều kỳ'),
  ('TPL-003', 'BLK_COLLATERAL', 'asset_valuation', '75% giá trị'),
  ('TPL-003', 'BLK_PENALTY', 'penalty_rate', '150% lãi');

-- ===== 28d. template_frame — phủ NỐT slot KHÔNG bắt buộc còn lại của cả 6 template lên 100% (user yêu cầu
-- không để trống slot nào). Slot có default_value thật trong answer_slot (min_amount/grace/disb_syntax/
-- billing_day) dùng đúng giá trị đó; slot không có default nào sẵn trong DB (beneficiary/fee_amount/
-- transfer_content/occupation) dùng mô tả trung thực đúng ý nghĩa nghiệp vụ của việc "không bắt buộc"
-- (vd occupation "Không giới hạn" = không ràng buộc nghề nghiệp cụ thể) — không bịa số liệu giả định. =====
INSERT INTO "template_frame" ("template_code", "block_id", "slot_code", "frame_value") VALUES
  -- TPL-001 (PT-001)
  ('TPL-001', 'BLK_COUNTERPARTY', 'beneficiary', 'Không chỉ định (mặc định là Bên vay)'),
  ('TPL-001', 'BLK_FEE', 'fee_amount', '300.000đ'),
  ('TPL-001', 'BLK_PENALTY', 'grace', '5 ngày'),
  -- TPL-002 (PT-001, doanh nghiệp)
  ('TPL-002', 'BLK_COUNTERPARTY', 'beneficiary', 'Không chỉ định (mặc định là Bên vay)'),
  ('TPL-002', 'BLK_FEE', 'fee_amount', '800.000đ'),
  ('TPL-002', 'BLK_PENALTY', 'grace', '5 ngày'),
  -- TPL-003 (PT-002)
  ('TPL-003', 'BLK_ELIGIBILITY', 'occupation', 'Không giới hạn'),
  ('TPL-003', 'BLK_COUNTERPARTY', 'beneficiary', 'Không chỉ định (mặc định là Bên vay)'),
  ('TPL-003', 'BLK_LIMIT', 'min_amount', '0đ'),
  ('TPL-003', 'BLK_PENALTY', 'grace', '5 ngày'),
  ('TPL-003', 'BLK_BILLING', 'billing_day', 'Ngày 5'),
  -- TPL-004 (PT-006)
  ('TPL-004', 'BLK_COUNTERPARTY', 'beneficiary', 'Không chỉ định (mặc định là Bên vay)'),
  ('TPL-004', 'BLK_FEE', 'fee_amount', '400.000đ'),
  ('TPL-004', 'BLK_PENALTY', 'grace', '5 ngày'),
  -- TPL-005 (PT-003)
  ('TPL-005', 'BLK_COUNTERPARTY', 'beneficiary', 'Không chỉ định (mặc định là Bên vay)'),
  ('TPL-005', 'BLK_DISBURSEMENT', 'disb_syntax', 'F88 {contract}'),
  ('TPL-005', 'BLK_DISBURSEMENT', 'transfer_content', 'Giai ngan {contract} - F88'),
  ('TPL-005', 'BLK_PENALTY', 'grace', '5 ngày'),
  -- TPL-006 (PT-005)
  ('TPL-006', 'BLK_ELIGIBILITY', 'occupation', 'Không giới hạn'),
  ('TPL-006', 'BLK_COUNTERPARTY', 'beneficiary', 'Không chỉ định (mặc định là Bên vay)'),
  ('TPL-006', 'BLK_PENALTY', 'grace', '5 ngày');

-- ===== 29. product_config — 6 CFG (list view) + CFG-0021 [suy luận] làm nguồn cho VAR-106 retired =====
-- CFG-0042 sửa từ TPL-001 → TPL-003: TPL-001 không có dòng template_frame nào (không thể suy ra
-- block nào "đang áp dụng"), trong khi toàn bộ 15 fragment của CFG-0042 dùng đúng 6 block mà
-- TPL-003 có template_frame (BLK_COUNTERPARTY/LIMIT/INTEREST/COLLATERAL/REPAYMENT/PENALTY) và
-- version_entry lịch sử ghi rõ "Khởi tạo Config từ Template TPL-003 v1.2" — TPL-001 là lỗi seed.
-- Sửa Giai đoạn 40: CFG-0042/0041/0038 trước đây có status THẤP hơn Variant đóng gói từ nó
-- (VAR-101 published ← CFG-0042 review; VAR-102 published ← CFG-0041 approved; VAR-105 review
-- ← CFG-0038 draft) — vi phạm thứ tự lifecycle Config→Variant (Variant không thể tiến xa hơn
-- Config nguồn). Nâng status Config khớp/vượt Variant, bổ sung version_entry + activity_log
-- tương ứng (approve/publish) để có dấu vết lịch sử đầy đủ, không đổi trơ 1 cột.
INSERT INTO "product_config" ("code", "name", "from_template_code", "status") VALUES
  ('CFG-0042', 'Vay nhanh Xe máy 18 tháng', 'TPL-003', 'published'),
  ('CFG-0041', 'Vay ô tô hạn mức HCM', 'TPL-003', 'published'),
  ('CFG-0040', 'Vay xe máy KH thân thiết', 'TPL-001', 'published'),
  ('CFG-0039', 'Vay Bullet vàng 3 tháng', 'TPL-005', 'approved'),
  ('CFG-0038', 'Vay tín chấp lương GV', 'TPL-006', 'review'),
  ('CFG-0037', 'Vay cầm cố DN nhỏ', 'TPL-002', 'review'),
  ('CFG-0021', 'Vay cầm cố laptop', 'TPL-001', 'retired'),
  -- Giai đoạn 41: sản phẩm mới "Vay xe máy mùa tựu trường" — đóng gói từ Template TPL-001 published
  -- (cùng khuôn PT-001/TPL-001 mà CFG-0040/VAR-103 đang dùng, chỉ khác Fragment ưu đãi thời vụ) —
  -- đã đi đủ draft→review→approved→published (xem version_entry + activity_log bên dưới).
  ('CFG-0043', 'Vay xe máy mùa tựu trường', 'TPL-001', 'published');

-- ===== 30. fragment — 18 fragment của CFG-0042 (configBase; base_rate Place HCM,HN warn 'Gần trần') =====
-- 3 dòng cuối (interest_calc/capacity_range/asset_valuation) BỔ SUNG so với configBase() gốc
-- của prototype: bundler chỉ mô phỏng rút gọn 2/3 slot mỗi block Lãi suất/Hạn mức/Tài sản đảm
-- bảo, nhưng answer_slot thật của các block này có thêm slot bắt buộc thứ 3 (interest_calc,
-- capacity_range, asset_valuation) mà bundler không mô phỏng. Vật chất hóa đúng default_value
-- đã có sẵn của answer_slot/attribute thành fragment scope mặc định — không bịa giá trị mới.
INSERT INTO "fragment" ("config_code", "block_id", "slot_code", "scope_code", "scope_value", "value", "is_warning", "validation_msg") VALUES
  ('CFG-0042', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88 (Cho vay)', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Cá nhân', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_LIMIT', 'limit_amount', 'default', NULL, '3.000.000đ – 50.000.000đ', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_LIMIT', 'limit_amount', 'place', 'HCM, HN', 'tối đa 60.000.000đ', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,5%/tháng', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_INTEREST', 'base_rate', 'people', 'Loyalty', '1,0%/tháng', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_INTEREST', 'base_rate', 'people', 'VIP', '1,2%/tháng', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_INTEREST', 'base_rate', 'place', 'HCM, HN', '1,4%/tháng', true, 'Gần trần'),
  ('CFG-0042', 'BLK_INTEREST', 'base_rate', 'time', 'Khuyến mãi Tết', '0,9%/tháng', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_COLLATERAL', 'asset_type', 'default', NULL, 'Xe máy (TwoWheels)', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_COLLATERAL', 'ltv', 'default', NULL, '80%', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_COLLATERAL', 'ltv', 'place', 'HCM, HN', '75%', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_REPAYMENT', 'repay_method', 'default', NULL, 'Trả góp nhiều kỳ', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_REPAYMENT', 'installment_count', 'default', NULL, '1 – 18 kỳ', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Dư nợ giảm dần', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_LIMIT', 'capacity_range', 'default', NULL, 'Có quản trị', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_COLLATERAL', 'asset_valuation', 'default', NULL, '70% giá trị', false, 'Hợp lệ');

-- ===== 30b. fragment — bổ sung CFG-0021/0037/0038/0039/0040/0041 (thiếu trong bản gốc — chỉ CFG-0042 có
-- fragment, vi phạm bất biến "mỗi (config, slot) phải có ≥1 fragment scope=default" ghi ở comment bảng
-- fragment). Suy diễn từ block/slot thật của Pattern gắn với Template mỗi Config, giá trị mặc định lấy
-- theo answer_slot/template_frame tương ứng hoặc điều chỉnh hợp lý theo tên Config (không bịa số liệu).
-- CFG-0021/0037/0038/0039 có thêm fragment scope people/place/time (không chỉ default) trên slot base_rate
-- — nếu không, panel "Xem trước Resolution" của các config này sẽ có Place/Time dropdown trống (chỉ
-- CFG-0040/0041/0042 có biến thể scope trước đó), khác với prototype luôn hiển thị đủ 3 ngữ cảnh. =====
INSERT INTO "fragment" ("config_code", "block_id", "slot_code", "scope_code", "scope_value", "value", "is_warning", "validation_msg") VALUES
  -- CFG-0021 'Vay cầm cố laptop' (retired) ← TPL-001/PT-001
  ('CFG-0021', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Cá nhân', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_REGULATORY', 'legal_form', 'default', NULL, 'Giấy nhận nợ', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_REGULATORY', 'compliance', 'default', NULL, 'Bật', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Dư nợ giảm dần', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,8%/tháng', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_INTEREST', 'base_rate', 'people', 'Loyalty', '1,5%/tháng', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_INTEREST', 'base_rate', 'place', 'HCM, HN', '1,7%/tháng', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_INTEREST', 'base_rate', 'time', 'Khuyến mãi Tết', '1,3%/tháng', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_FEE', 'fee_type', 'default', NULL, 'Phí thẩm định', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_REPAYMENT', 'repay_method', 'default', NULL, 'Trả góp nhiều kỳ', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_REPAYMENT', 'installment_count', 'default', NULL, '1 – 12', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_REPAYMENT', 'schedule', 'default', NULL, 'Hàng tháng', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_COLLATERAL', 'asset_type', 'default', NULL, 'Thiết bị điện tử (Laptop)', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_COLLATERAL', 'asset_valuation', 'default', NULL, '60% giá trị', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_COLLATERAL', 'ltv', 'default', NULL, '60%', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ'),
  -- CFG-0037 'Vay cầm cố DN nhỏ' (review) ← TPL-002/PT-001 (đối tượng doanh nghiệp)
  ('CFG-0037', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Doanh nghiệp', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_REGULATORY', 'legal_form', 'default', NULL, 'Hợp đồng tín dụng', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_REGULATORY', 'compliance', 'default', NULL, 'Bật', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Dư nợ giảm dần', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,2%/tháng', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_INTEREST', 'base_rate', 'place', 'HCM, HN', '1,15%/tháng', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_INTEREST', 'base_rate', 'time', 'Khuyến mãi Tết', '1,0%/tháng', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_FEE', 'fee_type', 'default', NULL, 'Phí quản lý', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_REPAYMENT', 'repay_method', 'default', NULL, 'Trả góp nhiều kỳ', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_REPAYMENT', 'installment_count', 'default', NULL, '6 – 24', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_REPAYMENT', 'schedule', 'default', NULL, 'Hàng tháng', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_COLLATERAL', 'asset_type', 'default', NULL, 'Ô tô (Car)', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_COLLATERAL', 'asset_valuation', 'default', NULL, '70% giá trị', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_COLLATERAL', 'ltv', 'default', NULL, '70%', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ'),
  -- CFG-0038 'Vay tín chấp lương GV' (draft) ← TPL-006/PT-005
  ('CFG-0038', 'BLK_ELIGIBILITY', 'age', 'default', NULL, '22 – 55', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_ELIGIBILITY', 'min_income', 'default', NULL, '8.000.000đ', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Cá nhân', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Dư nợ giảm dần', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,6%/tháng', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_INTEREST', 'base_rate', 'people', 'Loyalty', '1,4%/tháng', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_INTEREST', 'base_rate', 'place', 'HCM, HN', '1,55%/tháng', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_INTEREST', 'base_rate', 'time', 'Khuyến mãi Tết', '1,3%/tháng', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_REPAYMENT', 'repay_method', 'default', NULL, 'Trả góp nhiều kỳ', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_REPAYMENT', 'installment_count', 'default', NULL, '6 – 24', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_REPAYMENT', 'schedule', 'default', NULL, 'Hàng tháng', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ'),
  -- CFG-0039 'Vay Bullet vàng 3 tháng' (approved) ← TPL-005/PT-003
  ('CFG-0039', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Cá nhân', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_REGULATORY', 'legal_form', 'default', NULL, 'Giấy nhận nợ', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_REGULATORY', 'compliance', 'default', NULL, 'Bật', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_DISBURSEMENT', 'disb_method', 'default', NULL, 'Chuyển khoản', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Lãi hàng tháng, gốc cuối kỳ (Bullet)', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,3%/tháng', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_INTEREST', 'base_rate', 'people', 'VIP', '1,1%/tháng', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_INTEREST', 'base_rate', 'place', 'HCM, HN', '1,25%/tháng', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_INTEREST', 'base_rate', 'time', 'Khuyến mãi Tết', '1,0%/tháng', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_COLLATERAL', 'asset_type', 'default', NULL, 'Vàng (Gold)', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_COLLATERAL', 'asset_valuation', 'default', NULL, '80% giá trị', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_COLLATERAL', 'ltv', 'default', NULL, '80%', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ'),
  -- CFG-0040 'Vay xe máy KH thân thiết' (published) ← TPL-001/PT-001 (ưu đãi Loyalty)
  ('CFG-0040', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Cá nhân', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_REGULATORY', 'legal_form', 'default', NULL, 'Giấy nhận nợ', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_REGULATORY', 'compliance', 'default', NULL, 'Bật', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Dư nợ giảm dần', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,0%/tháng', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_INTEREST', 'base_rate', 'people', 'Loyalty', '0,8%/tháng', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_FEE', 'fee_type', 'default', NULL, 'Phí thẩm định', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_REPAYMENT', 'repay_method', 'default', NULL, 'Trả góp nhiều kỳ', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_REPAYMENT', 'installment_count', 'default', NULL, '1 – 18', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_REPAYMENT', 'schedule', 'default', NULL, 'Hàng tháng', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_COLLATERAL', 'asset_type', 'default', NULL, 'Xe máy (TwoWheels)', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_COLLATERAL', 'asset_valuation', 'default', NULL, '80% giá trị', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_COLLATERAL', 'ltv', 'default', NULL, '80%', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ'),
  -- CFG-0041 'Vay ô tô hạn mức HCM' (approved) ← TPL-003/PT-002 (override asset_type Ô tô so với khung Xe máy của template)
  ('CFG-0041', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88 (Cho vay)', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Cá nhân', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_LIMIT', 'limit_amount', 'default', NULL, '50.000.000đ – 2.000.000.000đ', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_LIMIT', 'capacity_range', 'default', NULL, 'Có quản trị', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Dư nợ giảm dần', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,1%/tháng', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_INTEREST', 'base_rate', 'place', 'HCM', '1,05%/tháng', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_COLLATERAL', 'asset_type', 'default', NULL, 'Ô tô (Car)', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_COLLATERAL', 'asset_valuation', 'default', NULL, '70% giá trị', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_COLLATERAL', 'ltv', 'default', NULL, '70%', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_REPAYMENT', 'repay_method', 'default', NULL, 'Trả góp nhiều kỳ', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_REPAYMENT', 'installment_count', 'default', NULL, '6 – 36', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ');

-- ===== 30c. fragment — CFG-0043 'Vay xe máy mùa tựu trường' (Giai đoạn 41) ← TPL-001/PT-001,
-- cùng khuôn Block với CFG-0040 (xe máy KH thân thiết) — khác ở 2 Fragment ưu đãi thời vụ:
-- base_rate scope people 'Học sinh, sinh viên' + scope time 'Mùa tựu trường' (01/08–30/09).
-- installment_count ngắn hơn (3–12) vì đây là khoản vay theo mùa, không phải trả góp dài hạn. =====
INSERT INTO "fragment" ("config_code", "block_id", "slot_code", "scope_code", "scope_value", "value", "is_warning", "validation_msg") VALUES
  ('CFG-0043', 'BLK_COUNTERPARTY', 'lender_party', 'default', NULL, 'F88', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_COUNTERPARTY', 'borrower_type', 'default', NULL, 'Cá nhân', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_REGULATORY', 'legal_form', 'default', NULL, 'Giấy nhận nợ', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_REGULATORY', 'compliance', 'default', NULL, 'Bật', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_INTEREST', 'interest_calc', 'default', NULL, 'Dư nợ giảm dần', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_INTEREST', 'base_rate', 'default', NULL, '1,3%/tháng', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_INTEREST', 'base_rate', 'people', 'Học sinh, sinh viên', '0,99%/tháng', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_INTEREST', 'base_rate', 'time', 'Mùa tựu trường (01/08–30/09)', '0,89%/tháng', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_FEE', 'fee_type', 'default', NULL, 'Phí thẩm định', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_REPAYMENT', 'repay_method', 'default', NULL, 'Trả góp nhiều kỳ', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_REPAYMENT', 'installment_count', 'default', NULL, '3 – 12', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_REPAYMENT', 'schedule', 'default', NULL, 'Hàng tháng', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_COLLATERAL', 'asset_type', 'default', NULL, 'Xe máy (TwoWheels)', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_COLLATERAL', 'asset_valuation', 'default', NULL, '80% giá trị', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_COLLATERAL', 'ltv', 'default', NULL, '80%', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ');

-- ===== 31. product_variant — 8 VAR (list view + catalog) =====
INSERT INTO "product_variant" ("code", "name", "from_config_code", "family", "limit_range", "display_rate", "marketing_content", "status") VALUES
  ('VAR-101', 'Vay nhanh Xe máy 18 tháng', 'CFG-0042', 'Cầm cố', '3tr – 50tr', '1,5%/tháng', NULL, 'published'),
  ('VAR-102', 'Vay ô tô hạn mức', 'CFG-0041', 'Hạn mức', '50tr – 2 tỷ', '1,1%/tháng', NULL, 'published'),
  ('VAR-103', 'Vay xe máy KH thân thiết', 'CFG-0040', 'Cầm cố', '3tr – 80tr', '1,0%/tháng', NULL, 'published'),
  ('VAR-104', 'Vay Bullet vàng 3 tháng', 'CFG-0039', 'Cầm cố', '5tr – 500tr', '1,3%/tháng', NULL, 'approved'),
  ('VAR-105', 'Vay tín chấp lương GV', 'CFG-0038', 'Tín chấp', '10tr – 100tr', '1,6%/tháng', NULL, 'review'),
  ('VAR-106', 'Vay cầm cố laptop', 'CFG-0021', 'Cầm cố', '2tr – 30tr', '1,8%/tháng', NULL, 'retired'),
  ('VAR-107', 'Vay cầm cố DN nhỏ', 'CFG-0037', 'Cầm cố', '100tr – 2 tỷ', '1,2%/tháng', NULL, 'draft'),
  -- Giai đoạn 41: đóng gói từ CFG-0043 (published) — đã đi đủ draft→review→approved→published,
  -- niêm yết Catalog App+Web (xem catalog_listing + activity_log bên dưới).
  ('VAR-108', 'Vay xe máy mùa tựu trường', 'CFG-0043', 'Cầm cố', '3tr – 40tr', '1,3%/tháng', 'Ưu đãi mùa tựu trường: lãi suất chỉ từ 0,99%/tháng cho học sinh, sinh viên (01/08–30/09), hồ sơ đơn giản, giải ngân trong ngày.', 'published');

-- ===== 32. product_catalog — 3 kệ theo kênh =====
INSERT INTO "product_catalog" ("id", "name", "channel") VALUES
  (1, 'Kệ sản phẩm App', 'App'),
  (2, 'Kệ sản phẩm Web', 'Web'),
  (3, 'Kệ sản phẩm PGD', 'PGD');

SELECT setval(pg_get_serial_sequence('product_catalog','id'), 3);

-- ===== 33. catalog_listing — kênh của từng variant (catalog view) =====
INSERT INTO "catalog_listing" ("catalog_id", "variant_code", "published_date", "status") VALUES
  (1, 'VAR-101', '2026-05-10', 'published'),
  (2, 'VAR-101', '2026-05-10', 'published'),
  (3, 'VAR-101', '2026-05-10', 'published'),
  (1, 'VAR-102', '2026-05-18', 'published'),
  (3, 'VAR-102', '2026-05-18', 'published'),
  (1, 'VAR-103', '2026-06-01', 'published'),
  (2, 'VAR-103', '2026-06-01', 'published'),
  (3, 'VAR-104', NULL, 'approved'),
  (1, 'VAR-105', NULL, 'review'),
  (3, 'VAR-107', NULL, 'draft'),
  (2, 'VAR-107', NULL, 'draft'),
  (1, 'VAR-108', '2026-07-07', 'published'),
  (2, 'VAR-108', '2026-07-07', 'published');

-- ===== 34. constraint_matrix — 3 ma trận (matrixDefs; Ma trận 4 Pattern×Block ngoài phạm vi v3) =====
INSERT INTO "constraint_matrix" ("id", "kind", "title", "description") VALUES
  (1, 'ARCHETYPE_X_ELEMENT', 'Ma trận 1: Financial Obligation Archetype × Obligation Element', 'Quy định Obligation Element nào bắt buộc / được phép với từng Archetype. Ma trận gốc để suy diễn Family & hợp lệ hóa Pattern.'),
  (2, 'ELEMENTTYPE_X_ELEMENTTYPE', 'Ma trận 2: Element Type × Element Type (tương thích)', 'Kiểm tra tính tương thích giữa các nhóm Element Type khi ghép vào một Obligation Type — tránh cấu hình mâu thuẫn.'),
  (3, 'OBLIGATIONTYPE_X_BLOCK', 'Ma trận 3: Obligation Type × Block', 'Block nào bắt buộc / tùy chọn / không dùng cho từng Obligation Type. Dùng để dựng khung Block khi tạo Pattern.');

SELECT setval(pg_get_serial_sequence('constraint_matrix','id'), 3);

-- ===== 35. matrix_cell — verdict 'no' của UI quy đổi thành 'na' =====
INSERT INTO "matrix_cell" ("matrix_id", "row_code", "col_code", "verdict", "is_override") VALUES
  (1, 'TERM_LOAN_OBLIGATION', 'FOA_TERM_LOAN', 'req', false),
  (1, 'TERM_LOAN_OBLIGATION', 'FOA_REVOLVING', 'na', false),
  (1, 'TERM_LOAN_OBLIGATION', 'FOA_CONDITIONAL', 'pos', false),
  (1, 'FACILITY_OBLIGATION', 'FOA_TERM_LOAN', 'na', false),
  (1, 'FACILITY_OBLIGATION', 'FOA_REVOLVING', 'req', false),
  (1, 'FACILITY_OBLIGATION', 'FOA_CONDITIONAL', 'pos', false),
  (1, 'CONDITIONAL_OBLIGATION', 'FOA_TERM_LOAN', 'na', false),
  (1, 'CONDITIONAL_OBLIGATION', 'FOA_REVOLVING', 'na', false),
  (1, 'CONDITIONAL_OBLIGATION', 'FOA_CONDITIONAL', 'req', false),
  (1, 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE', 'FOA_TERM_LOAN', 'req', false),
  (1, 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE', 'FOA_REVOLVING', 'na', false),
  (1, 'PRINCIPAL_NO_INCREASE_MULTI_DECREASE', 'FOA_CONDITIONAL', 'pos', false),
  (1, 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY', 'FOA_TERM_LOAN', 'na', false),
  (1, 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY', 'FOA_REVOLVING', 'req', false),
  (1, 'LIMIT_MULTI_INC_DEC_HAS_CAPACITY', 'FOA_CONDITIONAL', 'na', false),
  (1, 'EVENT_LENDER_DISBURSEMENT', 'FOA_TERM_LOAN', 'req', false),
  (1, 'EVENT_LENDER_DISBURSEMENT', 'FOA_REVOLVING', 'pos', false),
  (1, 'EVENT_LENDER_DISBURSEMENT', 'FOA_CONDITIONAL', 'na', false),
  (1, 'PAYMENT_MULTISTEP_INSTALLMENT', 'FOA_TERM_LOAN', 'req', false),
  (1, 'PAYMENT_MULTISTEP_INSTALLMENT', 'FOA_REVOLVING', 'pos', false),
  (1, 'PAYMENT_MULTISTEP_INSTALLMENT', 'FOA_CONDITIONAL', 'pos', false),
  (1, 'ASSET_PLEDGE', 'FOA_TERM_LOAN', 'pos', false),
  (1, 'ASSET_PLEDGE', 'FOA_REVOLVING', 'pos', false),
  (1, 'ASSET_PLEDGE', 'FOA_CONDITIONAL', 'pos', false),
  (1, 'CALENDAR_HAS_CYCLE_HAS_DEADLINE', 'FOA_TERM_LOAN', 'req', false),
  (1, 'CALENDAR_HAS_CYCLE_HAS_DEADLINE', 'FOA_REVOLVING', 'req', false),
  (1, 'CALENDAR_HAS_CYCLE_HAS_DEADLINE', 'FOA_CONDITIONAL', 'pos', false),
  (2, 'OET_NATURE', 'OET_NATURE', 'req', false),
  (2, 'OET_NATURE', 'OET_VALUE', 'req', false),
  (2, 'OET_NATURE', 'OET_ACTIVATION', 'req', false),
  (2, 'OET_NATURE', 'OET_FULFILLMENT', 'req', false),
  (2, 'OET_NATURE', 'OET_RECOVERY', 'pos', false),
  (2, 'OET_NATURE', 'OET_TIME', 'req', false),
  (2, 'OET_VALUE', 'OET_NATURE', 'req', false),
  (2, 'OET_VALUE', 'OET_VALUE', 'req', false),
  (2, 'OET_VALUE', 'OET_ACTIVATION', 'pos', false),
  (2, 'OET_VALUE', 'OET_FULFILLMENT', 'req', false),
  (2, 'OET_VALUE', 'OET_RECOVERY', 'pos', false),
  (2, 'OET_VALUE', 'OET_TIME', 'pos', false),
  (2, 'OET_ACTIVATION', 'OET_NATURE', 'req', false),
  (2, 'OET_ACTIVATION', 'OET_VALUE', 'pos', false),
  (2, 'OET_ACTIVATION', 'OET_ACTIVATION', 'req', false),
  (2, 'OET_ACTIVATION', 'OET_FULFILLMENT', 'pos', false),
  (2, 'OET_ACTIVATION', 'OET_RECOVERY', 'na', false),
  (2, 'OET_ACTIVATION', 'OET_TIME', 'req', false),
  (2, 'OET_FULFILLMENT', 'OET_NATURE', 'req', false),
  (2, 'OET_FULFILLMENT', 'OET_VALUE', 'req', false),
  (2, 'OET_FULFILLMENT', 'OET_ACTIVATION', 'pos', false),
  (2, 'OET_FULFILLMENT', 'OET_FULFILLMENT', 'req', false),
  (2, 'OET_FULFILLMENT', 'OET_RECOVERY', 'pos', false),
  (2, 'OET_FULFILLMENT', 'OET_TIME', 'req', false),
  (2, 'OET_RECOVERY', 'OET_NATURE', 'pos', false),
  (2, 'OET_RECOVERY', 'OET_VALUE', 'pos', false),
  (2, 'OET_RECOVERY', 'OET_ACTIVATION', 'na', false),
  (2, 'OET_RECOVERY', 'OET_FULFILLMENT', 'pos', false),
  (2, 'OET_RECOVERY', 'OET_RECOVERY', 'req', false),
  (2, 'OET_RECOVERY', 'OET_TIME', 'pos', false),
  (2, 'OET_TIME', 'OET_NATURE', 'req', false),
  (2, 'OET_TIME', 'OET_VALUE', 'pos', false),
  (2, 'OET_TIME', 'OET_ACTIVATION', 'req', false),
  (2, 'OET_TIME', 'OET_FULFILLMENT', 'req', false),
  (2, 'OET_TIME', 'OET_RECOVERY', 'pos', false),
  (2, 'OET_TIME', 'OET_TIME', 'req', false),
  (3, 'OT_PLEDGE_INSTALLMENT', 'BLK_COUNTERPARTY', 'req', false),
  (3, 'OT_PLEDGE_INSTALLMENT', 'BLK_INTEREST', 'req', false),
  (3, 'OT_PLEDGE_INSTALLMENT', 'BLK_COLLATERAL', 'req', false),
  (3, 'OT_PLEDGE_INSTALLMENT', 'BLK_REPAYMENT', 'req', false),
  (3, 'OT_PLEDGE_INSTALLMENT', 'BLK_LIMIT', 'na', false),
  (3, 'OT_PLEDGE_INSTALLMENT', 'BLK_PENALTY', 'pos', false),
  (3, 'OT_PLEDGE_BULLET', 'BLK_COUNTERPARTY', 'req', false),
  (3, 'OT_PLEDGE_BULLET', 'BLK_INTEREST', 'req', false),
  (3, 'OT_PLEDGE_BULLET', 'BLK_COLLATERAL', 'req', false),
  (3, 'OT_PLEDGE_BULLET', 'BLK_REPAYMENT', 'na', false),
  (3, 'OT_PLEDGE_BULLET', 'BLK_LIMIT', 'na', false),
  (3, 'OT_PLEDGE_BULLET', 'BLK_PENALTY', 'pos', false),
  (3, 'OT_FACILITY', 'BLK_COUNTERPARTY', 'req', false),
  (3, 'OT_FACILITY', 'BLK_INTEREST', 'req', false),
  (3, 'OT_FACILITY', 'BLK_COLLATERAL', 'pos', false),
  (3, 'OT_FACILITY', 'BLK_REPAYMENT', 'req', false),
  (3, 'OT_FACILITY', 'BLK_LIMIT', 'req', false),
  (3, 'OT_FACILITY', 'BLK_PENALTY', 'pos', false),
  (3, 'OT_UNSECURED', 'BLK_COUNTERPARTY', 'req', false),
  (3, 'OT_UNSECURED', 'BLK_INTEREST', 'req', false),
  (3, 'OT_UNSECURED', 'BLK_COLLATERAL', 'na', false),
  (3, 'OT_UNSECURED', 'BLK_REPAYMENT', 'req', false),
  (3, 'OT_UNSECURED', 'BLK_LIMIT', 'na', false),
  (3, 'OT_UNSECURED', 'BLK_PENALTY', 'req', false),
  (3, 'OT_AUTO_PLEDGE', 'BLK_COUNTERPARTY', 'req', false),
  (3, 'OT_AUTO_PLEDGE', 'BLK_INTEREST', 'req', false),
  (3, 'OT_AUTO_PLEDGE', 'BLK_COLLATERAL', 'req', false),
  (3, 'OT_AUTO_PLEDGE', 'BLK_REPAYMENT', 'req', false),
  (3, 'OT_AUTO_PLEDGE', 'BLK_LIMIT', 'na', false),
  (3, 'OT_AUTO_PLEDGE', 'BLK_PENALTY', 'pos', false);

-- ===== 36. maker_checker_process + process_step + checklist (releaseSteps; done=4, đang ở bước 5) =====
INSERT INTO "maker_checker_process" ("id", "variant_code", "product_name", "done_count") VALUES
  (1, 'VAR-101', 'Vay nhanh Xe máy 18 tháng (CFG-0042 → VAR-101)', 4);

SELECT setval(pg_get_serial_sequence('maker_checker_process','id'), 1);

INSERT INTO "process_step" ("process_id", "step_no", "title", "role", "step_status", "input_desc", "output_desc") VALUES
  (1, 1, 'Xác định Business Intent', 'Product Owner', 'done', 'Định hướng kinh doanh', 'Business Intent'),
  (1, 2, 'Tạo Product Intent', 'Product Designer', 'done', 'Business Intent', 'Product Intent'),
  (1, 3, 'Dựng Product Pattern', 'Product Designer', 'done', 'Product Intent', 'Product Pattern'),
  (1, 4, 'Tạo Product Template', 'Product Designer', 'done', 'Product Pattern', 'Product Template'),
  (1, 5, 'Cấu hình Product Config', 'Product Designer', 'current', 'Product Template', 'Product Config'),
  (1, 6, 'Mô phỏng & Kiểm thử', 'Product Designer / QA', 'upcoming', 'Product Config', 'Kết quả mô phỏng hợp lệ'),
  (1, 7, 'Phê duyệt (Maker–Checker)', 'Checker / Approver', 'upcoming', 'Product Config (chờ duyệt)', 'Config đã duyệt'),
  (1, 8, 'Đóng gói & Phát hành Catalog', 'Operations', 'upcoming', 'Config đã duyệt', 'Product Variant trên kệ');

INSERT INTO "process_step_checklist" ("process_id", "step_no", "sort_order", "item", "is_done") VALUES
  (1, 1, 1, 'Xác định mục tiêu & KPI kinh doanh', true),
  (1, 1, 2, 'Chọn Financial Obligation Archetype', true),
  (1, 1, 3, 'Khoanh vùng tệp khách hàng mục tiêu', true),
  (1, 2, 1, 'Gán Obligation Nature định danh', true),
  (1, 2, 2, 'Khai báo Obligation Element nền', true),
  (1, 2, 3, 'Đối chiếu Ma trận FOA × Element', true),
  (1, 3, 1, 'Gán Obligation Type cho khuôn', true),
  (1, 3, 2, 'Kéo-thả Block bắt buộc/tùy chọn', true),
  (1, 3, 3, 'Khai báo Answer Slot cho từng Block', true),
  (1, 4, 1, 'Chọn đối tượng khách hàng', true),
  (1, 4, 2, 'Khóa các Block không áp dụng', true),
  (1, 4, 3, 'Đặt giá trị khung cho Answer Slot', true),
  (1, 5, 1, 'Điền đầy đủ Answer Slot bắt buộc', true),
  (1, 5, 2, 'Tạo Fragment theo People/Place/Time', false),
  (1, 5, 3, 'Kiểm tra ràng buộc Attribute', false),
  (1, 6, 1, 'Chạy ≥ 1 kịch bản đại diện', false),
  (1, 6, 2, 'Đối chiếu ràng buộc (LTV, trần lãi, hạn mức)', false),
  (1, 6, 3, 'So sánh phương án & xuất báo cáo', false),
  (1, 7, 1, 'Maker gửi duyệt (Draft → Review)', false),
  (1, 7, 2, 'Checker rà soát & đối chiếu chính sách', false),
  (1, 7, 3, 'Phê duyệt (Review → Approved)', false),
  (1, 8, 1, 'Đóng gói Variant & gán giá hiển thị', false),
  (1, 8, 2, 'Chọn kênh (App / Web / PGD)', false),
  (1, 8, 3, 'Xuất bản (Approved → Published)', false);

-- ===== 37. simulation_scenario + schedule — kịch bản mặc định (state.sim), annuity dư nợ giảm dần =====
INSERT INTO "simulation_scenario" ("id", "config_code", "variant_code", "amount", "months", "base_rate_pct", "asset_value", "segment_code", "start_date", "appraisal_fee", "periodic_fee_pct", "grace_months", "pinned_label", "effective_rate", "monthly_payment", "total_interest", "total_payment", "ltv_pct") VALUES
  (1, 'CFG-0042', 'VAR-101', 30000000, 18, 1.5, 45000000, 'SEG_STANDARD', '2026-07-15', 500000, 0.15, NULL, 'A', 1.5, 1914173, 4455122, 35400634, 66.67);

SELECT setval(pg_get_serial_sequence('simulation_scenario','id'), 1);

INSERT INTO "simulation_schedule_row" ("scenario_id", "period_no", "due_date", "opening_balance", "principal", "interest", "fee", "penalty", "payment", "closing_balance") VALUES
  (1, 1, '2026-08-15', 30000000, 1464173, 450000, 45000, NULL, 1959173, 28535827),
  (1, 2, '2026-09-15', 28535827, 1486136, 428037, 42804, NULL, 1956977, 27049690),
  (1, 3, '2026-10-15', 27049690, 1508428, 405745, 40575, NULL, 1954748, 25541262),
  (1, 4, '2026-11-15', 25541262, 1531055, 383119, 38312, NULL, 1952485, 24010208),
  (1, 5, '2026-12-15', 24010208, 1554020, 360153, 36015, NULL, 1950189, 22456188),
  (1, 6, '2027-01-15', 22456188, 1577331, 336843, 33684, NULL, 1947858, 20878857),
  (1, 7, '2027-02-15', 20878857, 1600991, 313183, 31318, NULL, 1945492, 19277866),
  (1, 8, '2027-03-15', 19277866, 1625005, 289168, 28917, NULL, 1943090, 17652861),
  (1, 9, '2027-04-15', 17652861, 1649381, 264793, 26479, NULL, 1940653, 16003480),
  (1, 10, '2027-05-15', 16003480, 1674121, 240052, 24005, NULL, 1938179, 14329359),
  (1, 11, '2027-06-15', 14329359, 1699233, 214940, 21494, NULL, 1935667, 12630126),
  (1, 12, '2027-07-15', 12630126, 1724722, 189452, 18945, NULL, 1933119, 10905404),
  (1, 13, '2027-08-15', 10905404, 1750592, 163581, 16358, NULL, 1930532, 9154812),
  (1, 14, '2027-09-15', 9154812, 1776851, 137322, 13732, NULL, 1927906, 7377961),
  (1, 15, '2027-10-15', 7377961, 1803504, 110669, 11067, NULL, 1925240, 5574457),
  (1, 16, '2027-11-15', 5574457, 1830557, 83617, 8362, NULL, 1922535, 3743900),
  (1, 17, '2027-12-15', 3743900, 1858015, 56159, 5616, NULL, 1919789, 1885885),
  (1, 18, '2028-01-15', 1885885, 1885885, 28288, 2829, NULL, 1917002, 0);

-- ===== 38. version_entry — 10 version (versionData; changes[] gộp vào note vì v3 không có bảng version_change) =====
INSERT INTO "version_entry" ("entity_type", "entity_code", "version", "status", "is_active", "is_head", "author", "created_at", "note") VALUES
  ('pattern', 'PT-002', 'v0.3', 'review', false, true, 'Phạm Designer', '2026-07-01 09:40:00', 'Thêm Block Hạn mức (Limit) & gán Obligation Type "Vay hạn mức" | + Block Hạn mức (3 slot); ~ Gán thêm OT Facility; + Answer Slot capacity_range'),
  ('pattern', 'PT-002', 'v0.2', 'draft', false, false, 'Phạm Designer', '2026-06-30 14:10:00', 'Bổ sung Block Trả nợ & Phạt | + Block Trả nợ; + Block Phạt & Quá hạn'),
  ('pattern', 'PT-002', 'v0.1', 'draft', false, false, 'Trần Lan', '2026-06-28 10:00:00', 'Khởi tạo khuôn từ Product Intent PI-003 | + Block Bên tham gia; + Block Lãi suất; + Block Tài sản ĐB'),
  ('template', 'TPL-003', 'v1.2', 'published', true, true, 'Lê Minh', '2026-06-30 08:30:00', 'Khóa Block Phạt cho KH cá nhân, cập nhật giá trị khung LTV | ~ Khóa Block Phạt; ~ LTV khung 75%'),
  ('template', 'TPL-003', 'v1.1', 'approved', false, false, 'Lê Minh', '2026-06-24 11:00:00', 'Điều chỉnh đối tượng KH & khung số kỳ | ~ Số kỳ khung 1–18; ~ Đối tượng: Cá nhân'),
  ('template', 'TPL-003', 'v1.0', 'retired', false, false, 'Phạm Designer', '2026-06-10 09:00:00', 'Phiên bản phát hành đầu tiên từ Pattern PT-002 v0.x | Phát hành lần đầu'),
  -- Sửa Giai đoạn 40: v0.4 trước là head (review) — nhưng Variant VAR-101 đóng gói từ CFG-0042 đã
  -- published, Config nguồn phải hoàn tất duyệt+phát hành. Thêm v0.5/v0.6 SAU v0.4 theo đúng thời
  -- gian, chuyển head sang v0.6. (Lưu ý: bản thân lịch sử CFG-0042 v0.1–v0.4 đã có sẵn từ trước vẫn
  -- đang được ghi muộn hơn ngày VAR-101 publish 2026-06-18 trong activity_log — đây là nghịch lý
  -- thời gian CÓ SẴN từ trước, không sửa ở đây vì phạm vi yêu cầu chỉ là khớp status, không phải
  -- viết lại toàn bộ mốc thời gian của VAR-101/hoạt động liên quan.)
  ('config', 'CFG-0042', 'v0.6', 'published', true, true, 'Hệ thống', '2026-07-03 14:00:00', 'Xuất bản Config, sẵn sàng đóng gói Variant | → Phát hành (Approved→Published)'),
  ('config', 'CFG-0042', 'v0.5', 'approved', false, false, 'Lê Minh', '2026-07-02 10:00:00', 'Phê duyệt Config sau khi rà soát Fragment Base Rate | → Phê duyệt (Review→Approved)'),
  ('config', 'CFG-0042', 'v0.4', 'review', false, false, 'Trần Lan', '2026-07-01 09:42:00', 'Thêm Fragment Base Rate cho Place HCM/HN, gửi duyệt | + Fragment Base Rate · Place HCM,HN; + Fragment LTV · Place; → Gửi duyệt (Draft→Review)'),
  ('config', 'CFG-0042', 'v0.3', 'draft', false, false, 'Trần Lan', '2026-06-30 15:20:00', 'Thêm ưu đãi Loyalty & VIP cho Base Rate | + Fragment Base Rate · Loyalty; + Fragment Base Rate · VIP'),
  ('config', 'CFG-0042', 'v0.2', 'draft', false, false, 'Trần Lan', '2026-06-29 10:05:00', 'Điền Answer Slot bắt buộc của Block Trả nợ & Tài sản | + asset_type, ltv; + repay_method, installment_count'),
  ('config', 'CFG-0042', 'v0.1', 'draft', false, false, 'Phạm An', '2026-06-27 16:00:00', 'Khởi tạo Config từ Template TPL-003 v1.2 | Khởi tạo từ Template; + Fragment mặc định Base Rate');

-- ===== 38b. version_entry — bổ sung lịch sử cho 5 Pattern (PT-001,003,004,005,006) và 6 Config
-- (CFG-0021,0037,0038,0039,0040,0041) còn thiếu trong bản gốc (chỉ PT-002/CFG-0042 có, khiến nút
-- "Phiên bản" của mọi Pattern/Config khác không có gì để hiển thị). is_active=true chỉ gán cho
-- version HEAD của thực thể đã ở status 'published' (đang thật sự vận hành); approved/review/draft/
-- retired đều is_active=false — khớp đúng ý nghĩa "đang hoạt động" thay vì đánh dấu tùy tiện. =====
INSERT INTO "version_entry" ("entity_type", "entity_code", "version", "status", "is_active", "is_head", "author", "created_at", "note") VALUES
  -- PT-001 'Khuôn vay cầm cố trả góp' (published, từ PI-005)
  ('pattern', 'PT-001', 'v0.1', 'draft', false, false, 'Phạm An', '2026-05-10 09:00:00', 'Khởi tạo khuôn từ Product Intent PI-005 | + Block Bên tham gia; + Block Lãi suất; + Block Tài sản ĐB'),
  ('pattern', 'PT-001', 'v0.2', 'published', true, true, 'Phạm Designer', '2026-05-20 11:30:00', 'Hoàn thiện cấu trúc Block & phát hành | + Block Trả nợ; + Block Phạt & Quá hạn; + Block Tuân thủ & Pháp lý; → Phát hành (Review→Published)'),
  -- PT-003 'Khuôn vay cầm cố Bullet' (approved, từ PI-001)
  ('pattern', 'PT-003', 'v0.1', 'draft', false, false, 'Trần Lan', '2026-05-12 10:15:00', 'Khởi tạo khuôn Bullet từ Product Intent PI-001 | + Block Bên tham gia; + Block Lãi suất'),
  ('pattern', 'PT-003', 'v0.2', 'approved', false, true, 'Lê Minh', '2026-05-25 14:00:00', 'Bổ sung Block Giải ngân & Tài sản, gửi duyệt | + Block Giải ngân; + Block Tài sản ĐB; → Phê duyệt (Review→Approved)'),
  -- PT-004 'Khuôn vay hạn mức Facility' (draft, từ PI-002 — vừa tạo)
  ('pattern', 'PT-004', 'v0.1', 'draft', false, true, 'Phạm An', '2026-07-01 08:50:00', 'Khởi tạo khuôn Facility từ Product Intent PI-002 | + Block Bên tham gia; + Block Hạn mức; + Block Lãi suất'),
  -- PT-005 'Khuôn vay tín chấp lương' (published, từ PI-006)
  ('pattern', 'PT-005', 'v0.1', 'draft', false, false, 'Trần Lan', '2026-04-15 09:20:00', 'Khởi tạo khuôn tín chấp lương từ Product Intent PI-006 | + Block Điều kiện tham gia; + Block Bên tham gia'),
  ('pattern', 'PT-005', 'v0.2', 'published', true, true, 'Phạm Designer', '2026-04-28 15:45:00', 'Hoàn thiện Block Lãi suất/Trả nợ/Phạt & phát hành | + Block Lãi suất; + Block Trả nợ; + Block Phạt & Quá hạn; → Phát hành (Review→Published)'),
  -- PT-006 'Khuôn vay cầm cố ô tô' (approved, từ PI-004)
  ('pattern', 'PT-006', 'v0.1', 'draft', false, false, 'Lê Minh', '2026-06-01 09:00:00', 'Khởi tạo khuôn cầm cố ô tô từ Product Intent PI-004 | + Block Bên tham gia; + Block Lãi suất; + Block Tài sản ĐB'),
  ('pattern', 'PT-006', 'v0.2', 'approved', false, true, 'Phạm An', '2026-06-15 13:30:00', 'Bổ sung Block Phí & Trả nợ, gửi duyệt | + Block Phí; + Block Trả nợ; → Phê duyệt (Review→Approved)'),
  -- CFG-0021 'Vay cầm cố laptop' (retired, sản phẩm đã ngừng)
  ('config', 'CFG-0021', 'v0.1', 'draft', false, false, 'Phạm An', '2026-01-10 09:00:00', 'Khởi tạo Config từ Template TPL-001 v1.0 | Khởi tạo từ Template; + Fragment mặc định'),
  ('config', 'CFG-0021', 'v0.2', 'published', false, false, 'Trần Lan', '2026-01-20 10:30:00', 'Hoàn thiện fragment & phát hành | + Fragment còn lại; → Phát hành (Approved→Published)'),
  ('config', 'CFG-0021', 'v0.3', 'retired', false, true, 'Trần Lan', '2026-06-29 14:05:00', 'Thu hồi sản phẩm laptop ngừng kinh doanh | → Thu hồi (Published→Retired)'),
  -- CFG-0037 'Vay cầm cố DN nhỏ' (review)
  ('config', 'CFG-0037', 'v0.1', 'draft', false, false, 'Lê Minh', '2026-06-20 09:30:00', 'Khởi tạo Config từ Template TPL-002 v1.0 | Khởi tạo từ Template; + Fragment mặc định'),
  ('config', 'CFG-0037', 'v0.2', 'review', false, true, 'Lê Minh', '2026-07-01 09:10:00', 'Điền đủ Answer Slot bắt buộc, gửi duyệt | + Fragment Base Rate Place/Time; → Gửi duyệt (Draft→Review)'),
  -- CFG-0038 'Vay tín chấp lương GV' (review — Giai đoạn 40: nâng từ draft vì Variant VAR-105 đóng
  -- gói từ nó đã ở review, Config nguồn không thể ở sau Variant trong lifecycle)
  ('config', 'CFG-0038', 'v0.1', 'draft', false, false, 'Phạm An', '2026-06-30 11:00:00', 'Khởi tạo Config tín chấp lương GV từ Template TPL-006 v1.0 | Khởi tạo từ Template; + Fragment mặc định Base Rate'),
  ('config', 'CFG-0038', 'v0.2', 'review', false, true, 'Phạm An', '2026-07-01 09:00:00', 'Điền đủ Answer Slot bắt buộc, gửi duyệt | + Fragment Base Rate People/Place/Time; → Gửi duyệt (Draft→Review)'),
  -- CFG-0039 'Vay Bullet vàng 3 tháng' (approved)
  ('config', 'CFG-0039', 'v0.1', 'draft', false, false, 'Trần Lan', '2026-05-05 09:15:00', 'Khởi tạo Config Bullet vàng từ Template TPL-005 v1.0 | Khởi tạo từ Template; + Fragment mặc định'),
  ('config', 'CFG-0039', 'v0.2', 'approved', false, true, 'Phạm Designer', '2026-05-18 14:20:00', 'Bổ sung ưu đãi VIP & khu vực, phê duyệt | + Fragment Base Rate People/Place/Time; → Phê duyệt (Review→Approved)'),
  -- CFG-0040 'Vay xe máy KH thân thiết' (published)
  ('config', 'CFG-0040', 'v0.1', 'draft', false, false, 'Phạm An', '2026-05-25 10:00:00', 'Khởi tạo Config xe máy KH thân thiết từ Template TPL-001 v1.0 | Khởi tạo từ Template; + Fragment mặc định'),
  ('config', 'CFG-0040', 'v0.2', 'published', true, true, 'Trần Lan', '2026-06-30 09:45:00', 'Thêm ưu đãi Loyalty & phát hành | + Fragment Base Rate Loyalty; → Phát hành (Approved→Published)'),
  -- CFG-0041 'Vay ô tô hạn mức HCM' (published — Giai đoạn 40: nâng từ approved vì Variant VAR-102
  -- đóng gói từ nó đã published, Config nguồn không thể ở sau Variant trong lifecycle)
  ('config', 'CFG-0041', 'v0.1', 'draft', false, false, 'Lê Minh', '2026-06-05 09:30:00', 'Khởi tạo Config ô tô hạn mức từ Template TPL-003 v1.2 | Khởi tạo từ Template; + Fragment mặc định'),
  ('config', 'CFG-0041', 'v0.2', 'approved', false, false, 'Phạm Designer', '2026-06-20 15:00:00', 'Override loại tài sản Ô tô & thêm ưu đãi khu vực HCM, phê duyệt | ~ Fragment Asset Type → Ô tô; + Fragment Base Rate Place HCM; → Phê duyệt (Review→Approved)'),
  ('config', 'CFG-0041', 'v0.3', 'published', true, true, 'Hệ thống', '2026-06-22 17:00:00', 'Xuất bản Config, sẵn sàng đóng gói Variant | → Phát hành (Approved→Published)'),
  -- CFG-0043 'Vay xe máy mùa tựu trường' (Giai đoạn 41 — published, đi đủ 4 bước duyệt)
  ('config', 'CFG-0043', 'v0.1', 'draft', false, false, 'Phạm An', '2026-07-04 09:00:00', 'Khởi tạo Config mùa tựu trường từ Template TPL-001 v1.0 | Khởi tạo từ Template; + Fragment mặc định'),
  ('config', 'CFG-0043', 'v0.2', 'draft', false, false, 'Phạm An', '2026-07-04 14:30:00', 'Thêm ưu đãi lãi suất Học sinh/sinh viên & thời vụ | + Fragment Base Rate People Học sinh sinh viên; + Fragment Base Rate Time Mùa tựu trường'),
  ('config', 'CFG-0043', 'v0.3', 'review', false, false, 'Trần Lan', '2026-07-05 09:15:00', 'Điền đủ Answer Slot bắt buộc (Tài sản/Trả nợ/Phạt), gửi duyệt | + Fragment còn lại; → Gửi duyệt (Draft→Review)'),
  ('config', 'CFG-0043', 'v0.4', 'approved', false, false, 'Lê Minh', '2026-07-05 16:00:00', 'Phê duyệt Config chương trình mùa tựu trường | → Phê duyệt (Review→Approved)'),
  ('config', 'CFG-0043', 'v0.5', 'published', true, true, 'Hệ thống', '2026-07-06 09:00:00', 'Xuất bản Config, sẵn sàng đóng gói Variant | → Phát hành (Approved→Published)');

-- ===== 39. activity_log — 40 hoạt động (activity view; mốc thời gian quy đổi quanh 01/07/2026) =====
-- 8 dòng đầu (01/07 → 28/06) là seed gốc. 20 dòng bổ sung (27/06 → 18/06) phản ánh đúng các
-- sự kiện tạo/gửi duyệt/phê duyệt/xuất bản/thu hồi đã THẬT SỰ xảy ra với entity đang ở đúng
-- trạng thái đó trong DB (business_intent/product_intent/product_pattern/product_template/
-- product_config/product_variant) — không bịa entity/trạng thái mới, chỉ ghi lại lịch sử khớp
-- với status hiện có để list đủ dày cho màn Nhật ký hoạt động. 3 dòng (Giai đoạn 40) bổ sung
-- approve/publish CFG-0042/0041 + submit_review CFG-0038 khi sửa lệch lifecycle Config↔Variant.
-- 8 dòng cuối (Giai đoạn 41) là dấu vết đủ 4 bước duyệt (create→submit_review→approve→publish)
-- của CFG-0043/VAR-108 "Vay xe máy mùa tựu trường" — sản phẩm mới đóng gói từ khuôn PT-001/TPL-001
-- có sẵn (published), khớp đúng version_entry CFG-0043 vừa thêm ở trên.
INSERT INTO "activity_log" ("occurred_at", "actor", "action", "entity_type", "entity_code", "detail") VALUES
  ('2026-07-07 11:00:00', 'Hệ thống', 'publish', 'ProductVariant', 'VAR-108', 'Xuất bản Variant — Vay xe máy mùa tựu trường · kênh API'),
  ('2026-07-07 09:30:00', 'Lê Minh', 'approve', 'ProductVariant', 'VAR-108', 'Phê duyệt Variant — Vay xe máy mùa tựu trường · kênh Web'),
  ('2026-07-06 15:00:00', 'Phạm An', 'submit_review', 'ProductVariant', 'VAR-108', 'Gửi duyệt Variant — Vay xe máy mùa tựu trường · kênh Web'),
  ('2026-07-06 10:00:00', 'Phạm An', 'create', 'ProductVariant', 'VAR-108', 'Tạo Variant — Vay xe máy mùa tựu trường · kênh Web'),
  ('2026-07-06 09:00:00', 'Hệ thống', 'publish', 'ProductConfig', 'CFG-0043', 'Xuất bản Config — Vay xe máy mùa tựu trường · kênh API'),
  ('2026-07-05 16:00:00', 'Lê Minh', 'approve', 'ProductConfig', 'CFG-0043', 'Phê duyệt Config — Vay xe máy mùa tựu trường · kênh Web'),
  ('2026-07-05 09:15:00', 'Trần Lan', 'submit_review', 'ProductConfig', 'CFG-0043', 'Gửi duyệt Config — Vay xe máy mùa tựu trường · kênh Web'),
  ('2026-07-04 09:00:00', 'Phạm An', 'create', 'ProductConfig', 'CFG-0043', 'Tạo Config — Vay xe máy mùa tựu trường · kênh Web'),
  ('2026-07-03 14:00:00', 'Hệ thống', 'publish', 'ProductConfig', 'CFG-0042', 'Xuất bản Config — Vay nhanh Xe máy 18 tháng · kênh API'),
  ('2026-07-02 10:00:00', 'Lê Minh', 'approve', 'ProductConfig', 'CFG-0042', 'Phê duyệt Config — Vay nhanh Xe máy 18 tháng · kênh Web'),
  ('2026-07-01 09:42:00', 'Trần Lan', 'submit_review', 'ProductConfig', 'CFG-0042', 'Gửi duyệt Config — Vay nhanh Xe máy · kênh Web'),
  ('2026-07-01 09:15:00', 'Lê Minh', 'approve', 'ProductTemplate', 'TPL-002', 'Phê duyệt Template — Vay cầm cố · DN · kênh Web'),
  ('2026-07-01 08:50:00', 'Phạm An', 'create', 'ProductPattern', 'PT-004', 'Tạo Pattern — Khuôn vay hạn mức · kênh Web'),
  ('2026-06-30 10:00:00', 'Hệ thống', 'publish', 'ProductVariant', 'VAR-103', 'Xuất bản Variant — Vay xe máy thân thiết · kênh API'),
  ('2026-06-30 09:30:00', 'Lê Minh', 'update', 'AnswerSlot', 'BLOCK_INTEREST.base_rate', 'Cập nhật Base Rate · kênh Web'),
  ('2026-06-29 14:00:00', 'Trần Lan', 'retire', 'ProductVariant', 'VAR-106', 'Thu hồi Variant — Vay cầm cố laptop · kênh Web'),
  ('2026-06-29 11:20:00', 'Phạm An', 'assign', 'ProductPattern', 'PT-002', 'Gán Obligation Type — PT-002 ← Vay hạn mức · kênh Web'),
  ('2026-06-28 08:00:00', 'Hệ thống', 'sync', 'ConstraintMatrix', '1', 'Đồng bộ Matrix — FOA × Obligation Element · kênh API'),
  ('2026-06-27 16:20:00', 'Lê Minh', 'approve', 'BusinessIntent', 'BI-04', 'Phê duyệt Business Intent — Sản phẩm vay hạn mức linh hoạt · kênh Web'),
  ('2026-06-27 10:05:00', 'Phạm An', 'submit_review', 'BusinessIntent', 'BI-03', 'Gửi duyệt Business Intent — Số hóa hành trình vay · kênh Web'),
  ('2026-06-26 14:40:00', 'Lê Minh', 'approve', 'ProductIntent', 'PI-004', 'Phê duyệt Product Intent — Cho vay cầm cố ô tô · kênh Web'),
  ('2026-06-26 09:00:00', 'Trần Lan', 'create', 'BusinessIntent', 'BI-05', 'Tạo Business Intent — Cho vay tín chấp lương · kênh Web'),
  ('2026-06-25 11:15:00', 'Phạm An', 'submit_review', 'ProductIntent', 'PI-003', 'Gửi duyệt Product Intent — Cho vay tiêu dùng có hạn mức · kênh Web'),
  ('2026-06-25 08:30:00', 'Trần Lan', 'create', 'ProductIntent', 'PI-006', 'Tạo Product Intent — Vay tín chấp lương · kênh Web'),
  ('2026-06-24 15:10:00', 'Lê Minh', 'approve', 'ProductPattern', 'PT-003', 'Phê duyệt Pattern — Khuôn vay cầm cố Bullet · kênh Web'),
  ('2026-06-24 09:00:00', 'Hệ thống', 'publish', 'ProductPattern', 'PT-005', 'Xuất bản Pattern — Khuôn vay tín chấp lương · kênh API'),
  ('2026-06-23 13:45:00', 'Phạm An', 'submit_review', 'ProductTemplate', 'TPL-003', 'Gửi duyệt Template — Vay hạn mức cầm cố · KH cá nhân · kênh Web'),
  ('2026-06-23 09:30:00', 'Hệ thống', 'publish', 'ProductTemplate', 'TPL-004', 'Xuất bản Template — Vay cầm cố ô tô · trả góp · kênh API'),
  ('2026-06-22 17:00:00', 'Hệ thống', 'publish', 'ProductConfig', 'CFG-0041', 'Xuất bản Config — Vay ô tô hạn mức HCM · kênh API'),
  ('2026-06-22 16:00:00', 'Lê Minh', 'approve', 'ProductConfig', 'CFG-0041', 'Phê duyệt Config — Vay ô tô hạn mức HCM · kênh Web'),
  ('2026-06-22 10:00:00', 'Trần Lan', 'create', 'ProductTemplate', 'TPL-005', 'Tạo Template — Vay Bullet cầm cố · cá nhân · kênh Web'),
  ('2026-06-21 09:00:00', 'Hệ thống', 'publish', 'ProductConfig', 'CFG-0040', 'Xuất bản Config — Vay xe máy KH thân thiết · kênh API'),
  ('2026-06-21 08:20:00', 'Trần Lan', 'create', 'ProductConfig', 'CFG-0038', 'Tạo Config — Vay tín chấp lương GV · kênh Web'),
  ('2026-07-01 09:00:00', 'Phạm An', 'submit_review', 'ProductConfig', 'CFG-0038', 'Gửi duyệt Config — Vay tín chấp lương GV · kênh Web'),
  ('2026-06-20 14:30:00', 'Phạm An', 'retire', 'ProductConfig', 'CFG-0021', 'Thu hồi Config — Vay cầm cố laptop · kênh Web'),
  ('2026-06-20 11:00:00', 'Lê Minh', 'approve', 'ProductVariant', 'VAR-104', 'Phê duyệt Variant — Vay Bullet vàng 3 tháng · kênh Web'),
  ('2026-06-19 15:20:00', 'Phạm An', 'submit_review', 'ProductVariant', 'VAR-105', 'Gửi duyệt Variant — Vay tín chấp lương GV · kênh Web'),
  ('2026-06-19 09:10:00', 'Trần Lan', 'create', 'ProductVariant', 'VAR-107', 'Tạo Variant — Vay cầm cố DN nhỏ · kênh Web'),
  ('2026-06-18 09:00:00', 'Hệ thống', 'publish', 'ProductVariant', 'VAR-101', 'Xuất bản Variant — Vay nhanh Xe máy 18 tháng · kênh API'),
  ('2026-06-18 08:40:00', 'Hệ thống', 'publish', 'ProductVariant', 'VAR-102', 'Xuất bản Variant — Vay ô tô hạn mức · kênh API'),
  -- ===== Giai đoạn 43: bổ sung TOÀN BỘ bước duyệt còn thiếu cho Pattern/Template/Config/Variant
  -- (audit phát hiện: "Lịch sử duyệt" trống trơn ở nhiều sản phẩm dù status đã approved/published —
  -- vì activity_log chỉ có 0-1 dòng lẻ tẻ cho các entity này, không phải lỗi code (API/component đã
  -- đúng, chỉ thiếu dữ liệu). Bổ sung đủ create→submit_review→approve→publish/retire khớp ĐÚNG status
  -- hiện có của từng entity, dùng lại đúng actor/mốc thời gian đã có trong version_entry khi có sẵn. =====
  -- PT-001 (published, chưa có dòng nào)
  ('2026-05-10 09:00:00', 'Phạm An', 'create', 'ProductPattern', 'PT-001', 'Tạo Pattern — Khuôn vay cầm cố trả góp · kênh Web'),
  ('2026-05-14 10:00:00', 'Trần Lan', 'submit_review', 'ProductPattern', 'PT-001', 'Gửi duyệt Pattern — Khuôn vay cầm cố trả góp · kênh Web'),
  ('2026-05-18 15:00:00', 'Lê Minh', 'approve', 'ProductPattern', 'PT-001', 'Phê duyệt Pattern — Khuôn vay cầm cố trả góp · kênh Web'),
  ('2026-05-20 11:30:00', 'Hệ thống', 'publish', 'ProductPattern', 'PT-001', 'Xuất bản Pattern — Khuôn vay cầm cố trả góp · kênh API'),
  -- PT-002 (review, đã có 'assign' — thiếu create/submit_review)
  ('2026-06-28 10:00:00', 'Trần Lan', 'create', 'ProductPattern', 'PT-002', 'Tạo Pattern — Khuôn vay tiêu dùng có hạn mức · kênh Web'),
  ('2026-07-01 09:40:00', 'Phạm Designer', 'submit_review', 'ProductPattern', 'PT-002', 'Gửi duyệt Pattern — Khuôn vay tiêu dùng có hạn mức · kênh Web'),
  -- PT-003 (approved, đã có 'approve' — thiếu create/submit_review)
  ('2026-05-12 10:15:00', 'Trần Lan', 'create', 'ProductPattern', 'PT-003', 'Tạo Pattern — Khuôn vay cầm cố Bullet · kênh Web'),
  ('2026-05-20 09:00:00', 'Trần Lan', 'submit_review', 'ProductPattern', 'PT-003', 'Gửi duyệt Pattern — Khuôn vay cầm cố Bullet · kênh Web'),
  -- PT-005 (published, đã có 'publish' — thiếu create/submit_review/approve)
  ('2026-04-15 09:20:00', 'Trần Lan', 'create', 'ProductPattern', 'PT-005', 'Tạo Pattern — Khuôn vay tín chấp lương · kênh Web'),
  ('2026-04-20 10:00:00', 'Phạm Designer', 'submit_review', 'ProductPattern', 'PT-005', 'Gửi duyệt Pattern — Khuôn vay tín chấp lương · kênh Web'),
  ('2026-04-25 14:00:00', 'Lê Minh', 'approve', 'ProductPattern', 'PT-005', 'Phê duyệt Pattern — Khuôn vay tín chấp lương · kênh Web'),
  -- PT-006 (approved, chưa có dòng nào)
  ('2026-06-01 09:00:00', 'Lê Minh', 'create', 'ProductPattern', 'PT-006', 'Tạo Pattern — Khuôn vay cầm cố ô tô · kênh Web'),
  ('2026-06-08 10:00:00', 'Phạm An', 'submit_review', 'ProductPattern', 'PT-006', 'Gửi duyệt Pattern — Khuôn vay cầm cố ô tô · kênh Web'),
  ('2026-06-15 13:30:00', 'Phạm An', 'approve', 'ProductPattern', 'PT-006', 'Phê duyệt Pattern — Khuôn vay cầm cố ô tô · kênh Web'),
  -- TPL-001 (published, chưa có dòng nào — đúng bug user báo cáo, KH cá nhân)
  ('2026-01-02 09:00:00', 'Phạm An', 'create', 'ProductTemplate', 'TPL-001', 'Tạo Template — Vay cầm cố trả góp · KH cá nhân · kênh Web'),
  ('2026-01-04 10:00:00', 'Trần Lan', 'submit_review', 'ProductTemplate', 'TPL-001', 'Gửi duyệt Template — Vay cầm cố trả góp · KH cá nhân · kênh Web'),
  ('2026-01-06 14:00:00', 'Lê Minh', 'approve', 'ProductTemplate', 'TPL-001', 'Phê duyệt Template — Vay cầm cố trả góp · KH cá nhân · kênh Web'),
  ('2026-01-08 09:00:00', 'Hệ thống', 'publish', 'ProductTemplate', 'TPL-001', 'Xuất bản Template — Vay cầm cố trả góp · KH cá nhân · kênh API'),
  -- TPL-002 (approved, đã có 'approve' — thiếu create/submit_review)
  ('2026-05-01 09:00:00', 'Trần Lan', 'create', 'ProductTemplate', 'TPL-002', 'Tạo Template — Vay cầm cố trả góp · KH doanh nghiệp · kênh Web'),
  ('2026-05-10 10:00:00', 'Trần Lan', 'submit_review', 'ProductTemplate', 'TPL-002', 'Gửi duyệt Template — Vay cầm cố trả góp · KH doanh nghiệp · kênh Web'),
  -- TPL-003 (sửa status → published ở trên; đã có 'submit_review' — thiếu create/approve/publish,
  -- mốc approve/publish khớp đúng version_entry v1.1/v1.2 thật)
  ('2026-06-10 09:00:00', 'Phạm Designer', 'create', 'ProductTemplate', 'TPL-003', 'Tạo Template — Vay hạn mức cầm cố · KH cá nhân · kênh Web'),
  ('2026-06-24 11:00:00', 'Lê Minh', 'approve', 'ProductTemplate', 'TPL-003', 'Phê duyệt Template — Vay hạn mức cầm cố · KH cá nhân · kênh Web'),
  ('2026-06-30 08:30:00', 'Lê Minh', 'publish', 'ProductTemplate', 'TPL-003', 'Xuất bản Template — Vay hạn mức cầm cố · KH cá nhân · kênh API'),
  -- TPL-004 (published, đã có 'publish' — thiếu create/submit_review/approve)
  ('2026-05-15 09:00:00', 'Lê Minh', 'create', 'ProductTemplate', 'TPL-004', 'Tạo Template — Vay cầm cố ô tô · trả góp · kênh Web'),
  ('2026-05-25 10:00:00', 'Phạm An', 'submit_review', 'ProductTemplate', 'TPL-004', 'Gửi duyệt Template — Vay cầm cố ô tô · trả góp · kênh Web'),
  ('2026-06-05 14:00:00', 'Lê Minh', 'approve', 'ProductTemplate', 'TPL-004', 'Phê duyệt Template — Vay cầm cố ô tô · trả góp · kênh Web'),
  -- TPL-006 (published, chưa có dòng nào)
  ('2026-03-10 09:00:00', 'Trần Lan', 'create', 'ProductTemplate', 'TPL-006', 'Tạo Template — Vay tín chấp lương · cá nhân · kênh Web'),
  ('2026-03-15 10:00:00', 'Phạm An', 'submit_review', 'ProductTemplate', 'TPL-006', 'Gửi duyệt Template — Vay tín chấp lương · cá nhân · kênh Web'),
  ('2026-03-20 14:00:00', 'Lê Minh', 'approve', 'ProductTemplate', 'TPL-006', 'Phê duyệt Template — Vay tín chấp lương · cá nhân · kênh Web'),
  ('2026-03-22 09:00:00', 'Hệ thống', 'publish', 'ProductTemplate', 'TPL-006', 'Xuất bản Template — Vay tín chấp lương · cá nhân · kênh API'),
  -- CFG-0042 (published, đã có submit_review/approve/publish — thiếu create)
  ('2026-06-27 16:00:00', 'Phạm An', 'create', 'ProductConfig', 'CFG-0042', 'Tạo Config — Vay nhanh Xe máy 18 tháng · kênh Web'),
  -- CFG-0041 (published, đã có approve/publish — thiếu create/submit_review)
  ('2026-06-05 09:30:00', 'Lê Minh', 'create', 'ProductConfig', 'CFG-0041', 'Tạo Config — Vay ô tô hạn mức HCM · kênh Web'),
  ('2026-06-20 15:00:00', 'Phạm Designer', 'submit_review', 'ProductConfig', 'CFG-0041', 'Gửi duyệt Config — Vay ô tô hạn mức HCM · kênh Web'),
  -- CFG-0040 (published, đã có 'publish' — thiếu create/submit_review/approve)
  ('2026-05-25 10:00:00', 'Phạm An', 'create', 'ProductConfig', 'CFG-0040', 'Tạo Config — Vay xe máy KH thân thiết · kênh Web'),
  ('2026-06-05 09:00:00', 'Trần Lan', 'submit_review', 'ProductConfig', 'CFG-0040', 'Gửi duyệt Config — Vay xe máy KH thân thiết · kênh Web'),
  ('2026-06-15 10:00:00', 'Lê Minh', 'approve', 'ProductConfig', 'CFG-0040', 'Phê duyệt Config — Vay xe máy KH thân thiết · kênh Web'),
  -- CFG-0039 (approved, chưa có dòng nào)
  ('2026-05-05 09:15:00', 'Trần Lan', 'create', 'ProductConfig', 'CFG-0039', 'Tạo Config — Vay Bullet vàng 3 tháng · kênh Web'),
  ('2026-05-12 10:00:00', 'Trần Lan', 'submit_review', 'ProductConfig', 'CFG-0039', 'Gửi duyệt Config — Vay Bullet vàng 3 tháng · kênh Web'),
  ('2026-05-18 14:20:00', 'Phạm Designer', 'approve', 'ProductConfig', 'CFG-0039', 'Phê duyệt Config — Vay Bullet vàng 3 tháng · kênh Web'),
  -- CFG-0037 (review, chưa có dòng nào)
  ('2026-06-20 09:30:00', 'Lê Minh', 'create', 'ProductConfig', 'CFG-0037', 'Tạo Config — Vay cầm cố DN nhỏ · kênh Web'),
  ('2026-07-01 09:10:00', 'Lê Minh', 'submit_review', 'ProductConfig', 'CFG-0037', 'Gửi duyệt Config — Vay cầm cố DN nhỏ · kênh Web'),
  -- CFG-0021 (retired, đã có 'retire' — thiếu create/submit_review/approve/publish)
  ('2026-01-10 09:00:00', 'Phạm An', 'create', 'ProductConfig', 'CFG-0021', 'Tạo Config — Vay cầm cố laptop · kênh Web'),
  ('2026-01-14 10:00:00', 'Phạm An', 'submit_review', 'ProductConfig', 'CFG-0021', 'Gửi duyệt Config — Vay cầm cố laptop · kênh Web'),
  ('2026-01-17 14:00:00', 'Trần Lan', 'approve', 'ProductConfig', 'CFG-0021', 'Phê duyệt Config — Vay cầm cố laptop · kênh Web'),
  ('2026-01-20 10:30:00', 'Trần Lan', 'publish', 'ProductConfig', 'CFG-0021', 'Xuất bản Config — Vay cầm cố laptop · kênh API'),
  -- VAR-101 (published, đã có 'publish' — thiếu create/submit_review/approve)
  ('2026-06-01 09:00:00', 'Hệ thống', 'create', 'ProductVariant', 'VAR-101', 'Tạo Variant — Vay nhanh Xe máy 18 tháng · kênh Web'),
  ('2026-06-05 10:00:00', 'Trần Lan', 'submit_review', 'ProductVariant', 'VAR-101', 'Gửi duyệt Variant — Vay nhanh Xe máy 18 tháng · kênh Web'),
  ('2026-06-10 14:00:00', 'Lê Minh', 'approve', 'ProductVariant', 'VAR-101', 'Phê duyệt Variant — Vay nhanh Xe máy 18 tháng · kênh Web'),
  -- VAR-102 (published, đã có 'publish' — thiếu create/submit_review/approve)
  ('2026-05-20 09:00:00', 'Hệ thống', 'create', 'ProductVariant', 'VAR-102', 'Tạo Variant — Vay ô tô hạn mức · kênh Web'),
  ('2026-05-25 10:00:00', 'Phạm Designer', 'submit_review', 'ProductVariant', 'VAR-102', 'Gửi duyệt Variant — Vay ô tô hạn mức · kênh Web'),
  ('2026-06-01 14:00:00', 'Lê Minh', 'approve', 'ProductVariant', 'VAR-102', 'Phê duyệt Variant — Vay ô tô hạn mức · kênh Web'),
  -- VAR-103 (published, đã có 'publish' — thiếu create/submit_review/approve)
  ('2026-06-10 09:00:00', 'Trần Lan', 'create', 'ProductVariant', 'VAR-103', 'Tạo Variant — Vay xe máy KH thân thiết · kênh Web'),
  ('2026-06-18 10:00:00', 'Trần Lan', 'submit_review', 'ProductVariant', 'VAR-103', 'Gửi duyệt Variant — Vay xe máy KH thân thiết · kênh Web'),
  ('2026-06-25 14:00:00', 'Lê Minh', 'approve', 'ProductVariant', 'VAR-103', 'Phê duyệt Variant — Vay xe máy KH thân thiết · kênh Web'),
  -- VAR-104 (approved, đã có 'approve' — thiếu create/submit_review)
  ('2026-05-25 09:00:00', 'Trần Lan', 'create', 'ProductVariant', 'VAR-104', 'Tạo Variant — Vay Bullet vàng 3 tháng · kênh Web'),
  ('2026-06-05 10:00:00', 'Phạm Designer', 'submit_review', 'ProductVariant', 'VAR-104', 'Gửi duyệt Variant — Vay Bullet vàng 3 tháng · kênh Web'),
  -- VAR-105 (review, đã có 'submit_review' — thiếu create)
  ('2026-06-15 09:00:00', 'Phạm An', 'create', 'ProductVariant', 'VAR-105', 'Tạo Variant — Vay tín chấp lương GV · kênh Web'),
  -- VAR-106 (retired, đã có 'retire' — thiếu create/submit_review/approve/publish)
  ('2026-02-01 09:00:00', 'Trần Lan', 'create', 'ProductVariant', 'VAR-106', 'Tạo Variant — Vay cầm cố laptop · kênh Web'),
  ('2026-02-05 10:00:00', 'Phạm An', 'submit_review', 'ProductVariant', 'VAR-106', 'Gửi duyệt Variant — Vay cầm cố laptop · kênh Web'),
  ('2026-02-10 14:00:00', 'Lê Minh', 'approve', 'ProductVariant', 'VAR-106', 'Phê duyệt Variant — Vay cầm cố laptop · kênh Web'),
  ('2026-02-12 09:00:00', 'Hệ thống', 'publish', 'ProductVariant', 'VAR-106', 'Xuất bản Variant — Vay cầm cố laptop · kênh API'),
  -- ===== Giai đoạn 44: bổ sung "Lịch sử duyệt" cho Business Intent & Product Intent (cùng đợt vá
  -- lỗ hổng activity_log như Giai đoạn 43, mở rộng lên 2 tầng đầu Pipeline) =====
  -- BI-01 (published, chưa có dòng nào)
  ('2025-11-05 09:00:00', 'Trần Lan', 'create', 'BusinessIntent', 'BI-01', 'Tạo Business Intent — Mở rộng tín dụng nhân văn 2025 · kênh Web'),
  ('2025-11-10 10:00:00', 'Phạm An', 'submit_review', 'BusinessIntent', 'BI-01', 'Gửi duyệt Business Intent — Mở rộng tín dụng nhân văn 2025 · kênh Web'),
  ('2025-11-15 14:00:00', 'Lê Minh', 'approve', 'BusinessIntent', 'BI-01', 'Phê duyệt Business Intent — Mở rộng tín dụng nhân văn 2025 · kênh Web'),
  ('2025-11-18 09:00:00', 'Hệ thống', 'publish', 'BusinessIntent', 'BI-01', 'Xuất bản Business Intent — Mở rộng tín dụng nhân văn 2025 · kênh API'),
  -- BI-02 (published, chưa có dòng nào)
  ('2025-12-01 09:00:00', 'Phạm An', 'create', 'BusinessIntent', 'BI-02', 'Tạo Business Intent — Tăng trưởng cầm cố xe máy · kênh Web'),
  ('2025-12-05 10:00:00', 'Trần Lan', 'submit_review', 'BusinessIntent', 'BI-02', 'Gửi duyệt Business Intent — Tăng trưởng cầm cố xe máy · kênh Web'),
  ('2025-12-10 14:00:00', 'Lê Minh', 'approve', 'BusinessIntent', 'BI-02', 'Phê duyệt Business Intent — Tăng trưởng cầm cố xe máy · kênh Web'),
  ('2025-12-12 09:00:00', 'Hệ thống', 'publish', 'BusinessIntent', 'BI-02', 'Xuất bản Business Intent — Tăng trưởng cầm cố xe máy · kênh API'),
  -- BI-03 (review, đã có 'submit_review' — thiếu create)
  ('2026-06-20 09:00:00', 'Phạm An', 'create', 'BusinessIntent', 'BI-03', 'Tạo Business Intent — Số hóa hành trình vay · kênh Web'),
  -- BI-04 (approved, đã có 'approve' — thiếu create/submit_review)
  ('2026-06-10 09:00:00', 'Trần Lan', 'create', 'BusinessIntent', 'BI-04', 'Tạo Business Intent — Sản phẩm vay hạn mức linh hoạt · kênh Web'),
  ('2026-06-20 10:00:00', 'Trần Lan', 'submit_review', 'BusinessIntent', 'BI-04', 'Gửi duyệt Business Intent — Sản phẩm vay hạn mức linh hoạt · kênh Web'),
  -- BI-06 (published, chưa có dòng nào)
  ('2026-01-05 09:00:00', 'Lê Minh', 'create', 'BusinessIntent', 'BI-06', 'Tạo Business Intent — Tối ưu thu hồi & rủi ro · kênh Web'),
  ('2026-01-10 10:00:00', 'Phạm An', 'submit_review', 'BusinessIntent', 'BI-06', 'Gửi duyệt Business Intent — Tối ưu thu hồi & rủi ro · kênh Web'),
  ('2026-01-15 14:00:00', 'Trần Lan', 'approve', 'BusinessIntent', 'BI-06', 'Phê duyệt Business Intent — Tối ưu thu hồi & rủi ro · kênh Web'),
  ('2026-01-18 09:00:00', 'Hệ thống', 'publish', 'BusinessIntent', 'BI-06', 'Xuất bản Business Intent — Tối ưu thu hồi & rủi ro · kênh API'),
  -- BI-07 (review, chưa có dòng nào)
  ('2026-06-15 09:00:00', 'Trần Lan', 'create', 'BusinessIntent', 'BI-07', 'Tạo Business Intent — Gói KH thân thiết · kênh Web'),
  ('2026-06-22 10:00:00', 'Trần Lan', 'submit_review', 'BusinessIntent', 'BI-07', 'Gửi duyệt Business Intent — Gói KH thân thiết · kênh Web'),
  -- PI-001 (published, chưa có dòng nào)
  ('2025-11-20 09:00:00', 'Trần Lan', 'create', 'ProductIntent', 'PI-001', 'Tạo Product Intent — Cho vay tiêu dùng nhỏ lẻ · kênh Web'),
  ('2025-11-25 10:00:00', 'Phạm An', 'submit_review', 'ProductIntent', 'PI-001', 'Gửi duyệt Product Intent — Cho vay tiêu dùng nhỏ lẻ · kênh Web'),
  ('2025-11-28 14:00:00', 'Lê Minh', 'approve', 'ProductIntent', 'PI-001', 'Phê duyệt Product Intent — Cho vay tiêu dùng nhỏ lẻ · kênh Web'),
  ('2025-12-01 09:00:00', 'Hệ thống', 'publish', 'ProductIntent', 'PI-001', 'Xuất bản Product Intent — Cho vay tiêu dùng nhỏ lẻ · kênh API'),
  -- PI-002 (published, chưa có dòng nào)
  ('2026-01-20 09:00:00', 'Lê Minh', 'create', 'ProductIntent', 'PI-002', 'Tạo Product Intent — Cấp hạn mức để cho vay · kênh Web'),
  ('2026-01-25 10:00:00', 'Phạm An', 'submit_review', 'ProductIntent', 'PI-002', 'Gửi duyệt Product Intent — Cấp hạn mức để cho vay · kênh Web'),
  ('2026-01-28 14:00:00', 'Trần Lan', 'approve', 'ProductIntent', 'PI-002', 'Phê duyệt Product Intent — Cấp hạn mức để cho vay · kênh Web'),
  ('2026-02-01 09:00:00', 'Hệ thống', 'publish', 'ProductIntent', 'PI-002', 'Xuất bản Product Intent — Cấp hạn mức để cho vay · kênh API'),
  -- PI-003 (review, đã có 'submit_review' — thiếu create)
  ('2026-06-18 09:00:00', 'Trần Lan', 'create', 'ProductIntent', 'PI-003', 'Tạo Product Intent — Cho vay tiêu dùng có hạn mức · kênh Web'),
  -- PI-004 (approved, đã có 'approve' — thiếu create/submit_review)
  ('2026-06-05 09:00:00', 'Lê Minh', 'create', 'ProductIntent', 'PI-004', 'Tạo Product Intent — Cho vay cầm cố ô tô · kênh Web'),
  ('2026-06-15 10:00:00', 'Phạm An', 'submit_review', 'ProductIntent', 'PI-004', 'Gửi duyệt Product Intent — Cho vay cầm cố ô tô · kênh Web'),
  -- PI-005 (published, chưa có dòng nào)
  ('2026-03-01 09:00:00', 'Trần Lan', 'create', 'ProductIntent', 'PI-005', 'Tạo Product Intent — Cho vay cầm cố xe máy trả góp · kênh Web'),
  ('2026-03-05 10:00:00', 'Phạm Designer', 'submit_review', 'ProductIntent', 'PI-005', 'Gửi duyệt Product Intent — Cho vay cầm cố xe máy trả góp · kênh Web'),
  ('2026-03-10 14:00:00', 'Lê Minh', 'approve', 'ProductIntent', 'PI-005', 'Phê duyệt Product Intent — Cho vay cầm cố xe máy trả góp · kênh Web'),
  ('2026-03-12 09:00:00', 'Hệ thống', 'publish', 'ProductIntent', 'PI-005', 'Xuất bản Product Intent — Cho vay cầm cố xe máy trả góp · kênh API');

-- ===== 40. Populate created_user/updated_user (Giai đoạn 42, VIẾT LẠI ở Giai đoạn 43 + 44) — suy
-- TRỰC TIẾP từ activity_log thật ở trên: created_user = actor của hành động 'create' (nếu có);
-- updated_user = actor của hành động MUỘN NHẤT theo occurred_at (create/submit_review/approve/
-- publish/retire...). Giai đoạn 43 đã bổ sung đủ activity_log cho Pattern/Template/Config/Variant;
-- Giai đoạn 44 bổ sung tiếp Business Intent + Product Intent (đi kèm khối "Lịch sử duyệt" mới trên
-- 2 màn detail) — 6 loại entity Pipeline nay đều hết NULL. product_catalog vẫn CHƯA từng xuất hiện
-- trong activity_log — không có UI "Lịch sử duyệt" nào đọc, giữ NULL đúng thật, không suy đoán.
UPDATE "business_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Hệ thống' WHERE "id" = 1;
UPDATE "business_intent" SET "created_user" = 'Phạm An', "updated_user" = 'Hệ thống' WHERE "id" = 2;
UPDATE "business_intent" SET "created_user" = 'Phạm An', "updated_user" = 'Phạm An' WHERE "id" = 3;
UPDATE "business_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Lê Minh' WHERE "id" = 4;
UPDATE "business_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Trần Lan' WHERE "id" = 5;
UPDATE "business_intent" SET "created_user" = 'Lê Minh', "updated_user" = 'Hệ thống' WHERE "id" = 6;
UPDATE "business_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Trần Lan' WHERE "id" = 7;

UPDATE "product_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Hệ thống' WHERE "id" = 1;
UPDATE "product_intent" SET "created_user" = 'Lê Minh', "updated_user" = 'Hệ thống' WHERE "id" = 2;
UPDATE "product_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Phạm An' WHERE "id" = 3;
UPDATE "product_intent" SET "created_user" = 'Lê Minh', "updated_user" = 'Lê Minh' WHERE "id" = 4;
UPDATE "product_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Hệ thống' WHERE "id" = 5;
UPDATE "product_intent" SET "created_user" = 'Trần Lan', "updated_user" = 'Trần Lan' WHERE "id" = 6;

UPDATE "product_pattern" SET "created_user" = 'Phạm An', "updated_user" = 'Hệ thống' WHERE "code" = 'PT-001';
UPDATE "product_pattern" SET "created_user" = 'Trần Lan', "updated_user" = 'Phạm Designer' WHERE "code" = 'PT-002';
UPDATE "product_pattern" SET "created_user" = 'Trần Lan', "updated_user" = 'Lê Minh' WHERE "code" = 'PT-003';
UPDATE "product_pattern" SET "created_user" = 'Phạm An', "updated_user" = 'Phạm An' WHERE "code" = 'PT-004';
UPDATE "product_pattern" SET "created_user" = 'Trần Lan', "updated_user" = 'Hệ thống' WHERE "code" = 'PT-005';
UPDATE "product_pattern" SET "created_user" = 'Lê Minh', "updated_user" = 'Phạm An' WHERE "code" = 'PT-006';

UPDATE "product_template" SET "created_user" = 'Phạm An', "updated_user" = 'Hệ thống' WHERE "code" = 'TPL-001';
UPDATE "product_template" SET "created_user" = 'Trần Lan', "updated_user" = 'Lê Minh' WHERE "code" = 'TPL-002';
UPDATE "product_template" SET "created_user" = 'Phạm Designer', "updated_user" = 'Lê Minh' WHERE "code" = 'TPL-003';
UPDATE "product_template" SET "created_user" = 'Lê Minh', "updated_user" = 'Hệ thống' WHERE "code" = 'TPL-004';
UPDATE "product_template" SET "created_user" = 'Trần Lan', "updated_user" = 'Trần Lan' WHERE "code" = 'TPL-005';
UPDATE "product_template" SET "created_user" = 'Trần Lan', "updated_user" = 'Hệ thống' WHERE "code" = 'TPL-006';

UPDATE "product_config" SET "created_user" = 'Phạm An', "updated_user" = 'Hệ thống' WHERE "code" = 'CFG-0042';
UPDATE "product_config" SET "created_user" = 'Lê Minh', "updated_user" = 'Hệ thống' WHERE "code" = 'CFG-0041';
UPDATE "product_config" SET "created_user" = 'Phạm An', "updated_user" = 'Hệ thống' WHERE "code" = 'CFG-0040';
UPDATE "product_config" SET "created_user" = 'Trần Lan', "updated_user" = 'Phạm Designer' WHERE "code" = 'CFG-0039';
UPDATE "product_config" SET "created_user" = 'Trần Lan', "updated_user" = 'Phạm An' WHERE "code" = 'CFG-0038';
UPDATE "product_config" SET "created_user" = 'Lê Minh', "updated_user" = 'Lê Minh' WHERE "code" = 'CFG-0037';
UPDATE "product_config" SET "created_user" = 'Phạm An', "updated_user" = 'Trần Lan' WHERE "code" = 'CFG-0021';
UPDATE "product_config" SET "created_user" = 'Phạm An', "updated_user" = 'Hệ thống' WHERE "code" = 'CFG-0043';

UPDATE "product_variant" SET "created_user" = 'Hệ thống', "updated_user" = 'Hệ thống' WHERE "code" = 'VAR-101';
UPDATE "product_variant" SET "created_user" = 'Hệ thống', "updated_user" = 'Hệ thống' WHERE "code" = 'VAR-102';
UPDATE "product_variant" SET "created_user" = 'Trần Lan', "updated_user" = 'Hệ thống' WHERE "code" = 'VAR-103';
UPDATE "product_variant" SET "created_user" = 'Trần Lan', "updated_user" = 'Lê Minh' WHERE "code" = 'VAR-104';
UPDATE "product_variant" SET "created_user" = 'Phạm An', "updated_user" = 'Phạm An' WHERE "code" = 'VAR-105';
UPDATE "product_variant" SET "created_user" = 'Trần Lan', "updated_user" = 'Trần Lan' WHERE "code" = 'VAR-106';
UPDATE "product_variant" SET "created_user" = 'Trần Lan', "updated_user" = 'Trần Lan' WHERE "code" = 'VAR-107';
UPDATE "product_variant" SET "created_user" = 'Phạm An', "updated_user" = 'Hệ thống' WHERE "code" = 'VAR-108';
