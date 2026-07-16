-- ============================================================================
-- PRODUCT FACTORY 5.1 — SEED DATA (sinh từ mã nguồn Product_Factory_5_1.html)
-- Schema: canonical v3 (43 bảng). Chạy SAU file DDL (Untitled.sql).
-- Quy ước: dữ liệu lấy nguyên văn từ prototype; các dòng đánh dấu [suy luận]
-- là nội suy hợp lý từ badge/số đếm trên UI, không có record mẫu trong HTML.
-- Lưu ý enum: UI dùng verdict 'no' → schema v3 dùng 'na' (đã quy đổi).
-- ============================================================================

-- ===== 1. obligation_element_type — 6 chiều chuẩn (Giai đoạn 52: gỡ OET_NATURE/OET_LIFECYCLE,
-- không phải 1 trong 6 OET thật — xem Giai đoạn 52 trong PROJECT_STATUS.md) =====
INSERT INTO "obligation_element_type" ("code", "name", "short_name", "description", "is_identify") VALUES
  ('OET_PARTY', 'Party', 'Bên tham gia', 'Ai chuyển giao cho ai — Giai đoạn 51', false),
  ('OET_VALUE', 'Value Structure', 'Giá trị', 'Cách giá trị/dư nợ thay đổi theo thời gian', false),
  ('OET_ACTIVATION', 'Activation Logic', 'Kích hoạt', 'Điều kiện/sự kiện làm nghĩa vụ phát sinh', false),
  ('OET_FULFILLMENT', 'Fulfillment Logic', 'Thực thi', 'Cách thực hiện / hoàn trả nghĩa vụ', false),
  ('OET_RECOVERY', 'Recovery Anchor', 'Thu hồi', 'Phương án bảo đảm & thu hồi', false),
  ('OET_TIME', 'Time Structure', 'Thời gian', 'Chu kỳ và hạn chót của nghĩa vụ', false);

-- ===== 2. obligation_element — 17 element lõi (ONTO) + 1 từ archDetail
--          + Giai đoạn 51: 6 OE_PARTY (Data dictionary Mục 4.1) + 5 OE dùng cho OT lõi
--          Giải ngân/Bàn giao TS (Value/Activation/Time/Fulfillment/Recovery "1 lần, cố định")
--          + OE_VAL_ACCRUAL_ON_BALANCE (OT Trả lãi) =====
-- Giai đoạn 51b: đổi tên toàn bộ mã OE khớp ĐÚNG catalog 36 mã đóng của Data Dictionary Mục 4
-- (trước đó Giai đoạn 51 giữ nhầm tên cũ kiểu ONTO gốc) + bổ sung 10 mã còn thiếu cho đủ 36
-- (6 Party + 8 Value + 7 Activation + 5 Time + 5 Fulfillment + 5 Recovery).
-- OE_ACT_SETTLEMENT_TRIGGER giữ làm mã MỞ RỘNG ngoài 36 (ghi chú rõ): Ví dụ xuyên suốt cần khái
-- niệm "trigger tất toán" cho Bàn giao TS (trả) nhưng catalog 7 mã OET_ACTIVATION đóng của chính
-- Data Dictionary không có mã nào khớp đúng nghĩa này — lỗ hổng của tài liệu gốc, không phải bịa.
-- Giai đoạn 52: bỏ hẳn 3 mã OET_NATURE (TERM_LOAN_OBLIGATION/FACILITY_OBLIGATION/CONDITIONAL_OBLIGATION)
-- — trùng lặp 1:1 với financial_obligation_archetype.code, đúng tinh thần tài liệu BA v1.0 (OI-4).
INSERT INTO "obligation_element" ("code", "name", "element_type_code") VALUES
  ('OE_PARTY_LENDER_BORROWER', 'Bên cho vay → Bên vay', 'OET_PARTY'),
  ('OE_PARTY_LENDER_BENEFICIARY', 'Bên cho vay → Bên thụ hưởng', 'OET_PARTY'),
  ('OE_PARTY_BORROWER_LENDER', 'Bên vay → Bên cho vay', 'OET_PARTY'),
  ('OE_PARTY_BORROWER_INSURER', 'Bên vay → Công ty bảo hiểm', 'OET_PARTY'),
  ('OE_PARTY_BORROWER_LENDER_CUSTODY', 'Bên vay giao TS → Bên cho vay giữ', 'OET_PARTY'),
  ('OE_PARTY_LENDER_BORROWER_RELEASE', 'Bên cho vay hoàn TS → Bên vay', 'OET_PARTY'),
  ('OE_VAL_PRINCIPAL_MULTI_DECREASE', 'Gốc không tăng, giảm dần nhiều kỳ', 'OET_VALUE'),
  ('OE_VAL_PRINCIPAL_SINGLE_DECREASE', 'Gốc không tăng, giảm 1 lần (bullet)', 'OET_VALUE'),
  ('OE_VAL_LIMIT_INC_DEC_CAPACITY', 'Hạn mức tăng/giảm có capacity', 'OET_VALUE'),
  ('OE_VAL_BY_EVENT', 'Giá trị theo sự kiện kích hoạt', 'OET_VALUE'),
  ('OE_VAL_FIXED_ONE_OFF', 'Giá trị cố định, phát sinh 1 lần', 'OET_VALUE'),
  ('OE_VAL_ACCRUAL_ON_BALANCE', 'Tích lũy theo dư nợ × thời gian', 'OET_VALUE'),
  ('OE_VAL_ACCRUAL_ON_OVERDUE', 'Tích lũy trên phần quá hạn', 'OET_VALUE'),
  ('OE_VAL_PERCENT_OF_BASE', 'Tỷ lệ % trên giá trị cơ sở', 'OET_VALUE'),
  ('OE_ACT_CONTRACT_EFFECTIVE', 'Khi hợp đồng hiệu lực', 'OET_ACTIVATION'),
  ('OE_ACT_ON_DISBURSEMENT', 'Khi giải ngân', 'OET_ACTIVATION'),
  ('OE_ACT_FACILITY_OPEN', 'Khi mở hạn mức', 'OET_ACTIVATION'),
  ('OE_ACT_DRAWDOWN_REQUEST', 'Theo lệnh rút vốn của khách hàng', 'OET_ACTIVATION'),
  ('OE_ACT_CONDITIONAL_TRIGGER', 'Theo trigger điều kiện', 'OET_ACTIVATION'),
  ('OE_ACT_BREACH_EVENT', 'Khi phát sinh vi phạm/quá hạn', 'OET_ACTIVATION'),
  ('OE_ACT_CHARGEABLE_EVENT', 'Khi phát sinh sự kiện tính phí', 'OET_ACTIVATION'),
  ('OE_ACT_SETTLEMENT_TRIGGER', 'Trigger: tất toán [mở rộng ngoài 36 mã — xem ghi chú]', 'OET_ACTIVATION'),
  ('OE_TIME_POINT', 'Một thời điểm, không chu kỳ', 'OET_TIME'),
  ('OE_TIME_CYCLE_DEADLINE', 'Có chu kỳ, có hạn chót', 'OET_TIME'),
  ('OE_TIME_CYCLE_STATEMENT', 'Chu kỳ sao kê', 'OET_TIME'),
  ('OE_TIME_DEADLINE_ONLY', 'Chỉ có hạn chót', 'OET_TIME'),
  ('OE_TIME_UNTIL_EVENT', 'Kéo dài đến khi sự kiện xảy ra', 'OET_TIME'),
  ('OE_FUL_LUMP_SUM', 'Thực hiện 1 lần', 'OET_FULFILLMENT'),
  ('OE_FUL_INSTALLMENT', 'Trả góp nhiều kỳ', 'OET_FULFILLMENT'),
  ('OE_FUL_STATEMENT_CYCLE', 'Trả theo sao kê chu kỳ', 'OET_FULFILLMENT'),
  ('OE_FUL_ON_CONDITION', 'Thực thi 1 lần khi đủ điều kiện', 'OET_FULFILLMENT'),
  ('OE_FUL_PER_REQUEST', 'Thực hiện theo từng lệnh (rút vốn)', 'OET_FULFILLMENT'),
  ('OE_REC_ASSET_PLEDGE', 'Tài sản cầm cố', 'OET_RECOVERY'),
  ('OE_REC_UNSECURED', 'Tín chấp (không TSĐB)', 'OET_RECOVERY'),
  ('OE_REC_THIRD_PARTY_GUARANTEE', 'Bảo lãnh bên thứ ba', 'OET_RECOVERY'),
  ('OE_REC_RECEIVABLES', 'Khoản phải thu (tài trợ hóa đơn có truy đòi)', 'OET_RECOVERY'),
  ('OE_REC_NOT_APPLICABLE', 'Không áp dụng', 'OET_RECOVERY');

-- ===== 3. financial_obligation_archetype — 3 khuôn gốc (archDetail) =====
INSERT INTO "financial_obligation_archetype" ("code", "name", "nature", "nature_desc", "value_structure", "value_desc") VALUES
  ('FOA_TERM_LOAN', 'Term Loan Obligation', 'Nợ 1 chiều (đi vay)', 'Bên vay nhận một khoản nợ xác định và hoàn trả dần — định danh bản chất nghĩa vụ.', 'Gốc không tăng, giảm dần', 'Dư nợ gốc chỉ giảm theo từng kỳ trả, không phát sinh tăng thêm.'),
  ('FOA_REVOLVING', 'Revolving Obligation', 'Cấp hạn mức tái sử dụng', 'Bên cho vay cấp một hạn mức, bên vay rút/trả nhiều lần trong hạn mức.', 'Hạn mức tăng/giảm có capacity', 'Số dư khả dụng biến động theo rút vốn và trả nợ, có quản trị capacity.'),
  ('FOA_CONDITIONAL', 'Conditional Obligation', 'Nghĩa vụ phát sinh có điều kiện', 'Nghĩa vụ chỉ hình thành/được thực thi khi một sự kiện điều kiện xảy ra.', 'Giá trị theo sự kiện kích hoạt', 'Giá trị nghĩa vụ phụ thuộc kết quả của sự kiện kích hoạt (trigger).');

-- ===== 4. foa_element — Element gắn Archetype kèm requirement (archDetail.elementRows)
-- Giai đoạn 52: bỏ 3 dòng nature-tautology (vd FOA_TERM_LOAN→TERM_LOAN_OBLIGATION required) —
-- trùng lặp hiển nhiên (FOA nào cũng "required" đúng nature của chính nó), làm nhiễu ma trận FOA×OE
-- (foaOeMatrix() derive thẳng từ bảng này).
-- Giai đoạn 58b: đối chiếu tài liệu "Ví dụ xuyên suốt: Ma Trận FOA × OE..." (Mục 1) phát hiện lệch —
-- thêm 9 ô "possible"/"required" còn thiếu cho 5 OE đã có (mỗi OE thật ra có nhiều mức theo từng
-- FOA, không chỉ 1 cột "required" duy nhất) + thêm mới 2 OE hoàn toàn vắng mặt dù có trong bảng
-- Mục 1 (OE_VAL_PRINCIPAL_SINGLE_DECREASE "bullet", OE_REC_UNSECURED "Tín chấp") =====
INSERT INTO "foa_element" ("archetype_code", "element_code", "requirement") VALUES
  ('FOA_TERM_LOAN', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'required'),
  ('FOA_CONDITIONAL', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'possible'),
  ('FOA_TERM_LOAN', 'OE_VAL_PRINCIPAL_SINGLE_DECREASE', 'possible'),
  ('FOA_CONDITIONAL', 'OE_VAL_PRINCIPAL_SINGLE_DECREASE', 'possible'),
  ('FOA_TERM_LOAN', 'OE_ACT_ON_DISBURSEMENT', 'required'),
  ('FOA_REVOLVING', 'OE_ACT_ON_DISBURSEMENT', 'possible'),
  ('FOA_TERM_LOAN', 'OE_FUL_INSTALLMENT', 'required'),
  ('FOA_REVOLVING', 'OE_FUL_INSTALLMENT', 'possible'),
  ('FOA_CONDITIONAL', 'OE_FUL_INSTALLMENT', 'possible'),
  ('FOA_TERM_LOAN', 'OE_REC_ASSET_PLEDGE', 'possible'),
  ('FOA_TERM_LOAN', 'OE_REC_UNSECURED', 'possible'),
  ('FOA_REVOLVING', 'OE_REC_UNSECURED', 'possible'),
  ('FOA_CONDITIONAL', 'OE_REC_UNSECURED', 'possible'),
  ('FOA_TERM_LOAN', 'OE_TIME_CYCLE_DEADLINE', 'required'),
  ('FOA_REVOLVING', 'OE_TIME_CYCLE_DEADLINE', 'required'),
  ('FOA_CONDITIONAL', 'OE_TIME_CYCLE_DEADLINE', 'possible'),
  ('FOA_REVOLVING', 'OE_VAL_LIMIT_INC_DEC_CAPACITY', 'required'),
  ('FOA_REVOLVING', 'OE_ACT_FACILITY_OPEN', 'required'),
  ('FOA_TERM_LOAN', 'OE_FUL_STATEMENT_CYCLE', 'possible'),
  ('FOA_REVOLVING', 'OE_FUL_STATEMENT_CYCLE', 'required'),
  ('FOA_CONDITIONAL', 'OE_FUL_STATEMENT_CYCLE', 'possible'),
  ('FOA_REVOLVING', 'OE_REC_ASSET_PLEDGE', 'possible'),
  ('FOA_REVOLVING', 'OE_TIME_CYCLE_STATEMENT', 'required'),
  ('FOA_CONDITIONAL', 'OE_VAL_BY_EVENT', 'required'),
  ('FOA_REVOLVING', 'OE_ACT_CONDITIONAL_TRIGGER', 'possible'),
  ('FOA_CONDITIONAL', 'OE_ACT_CONDITIONAL_TRIGGER', 'required'),
  ('FOA_CONDITIONAL', 'OE_FUL_ON_CONDITION', 'required'),
  ('FOA_CONDITIONAL', 'OE_REC_ASSET_PLEDGE', 'possible'),
  ('FOA_CONDITIONAL', 'OE_TIME_DEADLINE_ONLY', 'possible');

-- ===== 5. obligation_type — 5 lõi (ONTO) + 4 từ list view / archDetail
--          Giai đoạn 51: đây là khái niệm OTF (Obligation Type Family) — bỏ family_code,
--          dùng thẳng archetype_code (obligation_family đã gộp bỏ, trùng 1:1 với FOA) =====
INSERT INTO "obligation_type" ("code", "name", "archetype_code", "status") VALUES
  ('OT_PLEDGE_INSTALLMENT', 'Vay cầm cố trả góp', 'FOA_TERM_LOAN', 'published'),
  ('OT_PLEDGE_BULLET', 'Vay cầm cố trả 1 lần (Bullet)', 'FOA_TERM_LOAN', 'published'),
  ('OT_UNSECURED', 'Vay tín chấp trả góp', 'FOA_TERM_LOAN', 'approved'),
  ('OT_FACILITY', 'Vay hạn mức (Facility)', 'FOA_REVOLVING', 'published'),
  ('OT_GUARANTEE', 'Bảo lãnh có điều kiện', 'FOA_CONDITIONAL', 'approved'),
  ('OT_AUTO_PLEDGE', 'Vay cầm cố ô tô', 'FOA_TERM_LOAN', 'published'),
  ('OT_GOLD_BULLET', 'Vay cầm cố vàng Bullet', 'FOA_TERM_LOAN', 'review'),
  ('OT_FACILITY_AUTO', 'Vay hạn mức cầm cố ô tô', 'FOA_REVOLVING', 'approved'),
  ('OT_COMMITMENT', 'Cam kết giải ngân điều kiện', 'FOA_CONDITIONAL', 'review');

-- ===== 6. obligation_type_core — Giai đoạn 51, tập đóng 7 OT lõi (Data dictionary Mục 3) =====
INSERT INTO "obligation_type_core" ("code", "name", "group_kind", "description") VALUES
  ('OT_DISBURSEMENT', 'Giải ngân', 'core', 'Chuyển giao vốn gốc: bên cho vay → bên vay'),
  ('OT_PRINCIPAL_REPAYMENT', 'Hoàn trả gốc', 'core', 'Hoàn trả vốn gốc: bên vay → bên cho vay'),
  ('OT_INTEREST', 'Trả lãi', 'core', 'Trả chi phí sử dụng vốn theo thời gian'),
  ('OT_FEE', 'Phí', 'auxiliary', 'Phí phát sinh (thẩm định, trả trước hạn...)'),
  ('OT_PENALTY', 'Phạt', 'auxiliary', 'Phạt khi vi phạm (trễ hạn...)'),
  ('OT_INSURANCE', 'Bảo hiểm', 'auxiliary', 'Nghĩa vụ liên quan bảo hiểm khoản vay'),
  ('OT_ASSET_HANDOVER', 'Bàn giao tài sản', 'auxiliary', 'Giao/hoàn trả tài sản bảo đảm (hai chiều)');

-- ===== 6b. ot_activation_rule — Giai đoạn 51, bảng tra OE → bật OT phụ trợ, độc lập FOA (Mục 6) =====
INSERT INTO "ot_activation_rule" ("trigger_element_code", "activated_ot_core_code") VALUES
  ('OE_REC_ASSET_PLEDGE', 'OT_ASSET_HANDOVER');

-- ===== 7. obligation_type_composition — Giai đoạn 51: viết lại theo tài liệu FOA/OET/OE/OT/OTF —
--          1 OTF = tổ hợp NHIỀU OT lõi, mỗi OT lõi đủ 6 OET (kể cả OET_PARTY mới). OT_DISBURSEMENT
--          cố định mọi OTF (không nằm trong ma trận FOA×OE); OT_PRINCIPAL_REPAYMENT/OT_INTEREST tái
--          dùng đúng giá trị Value/Activation/Fulfillment/Recovery/Time đã có ở bản ghi phẳng cũ;
--          OT_ASSET_HANDOVER (2 dòng nhận/trả) chỉ thêm cho OTF có Recovery=ASSET_PLEDGE (bảng tra
--          Mục 6); FOA_CONDITIONAL (OT_GUARANTEE/OT_COMMITMENT) KHÔNG có OT_INTEREST (đặc điểm riêng
--          nêu rõ ở Data dictionary Mục 5.3) =====
INSERT INTO "obligation_type_composition" ("obligation_type_code", "ot_core_code", "element_type_code", "element_code", "leg") VALUES
  -- OT_PLEDGE_INSTALLMENT (FOA_TERM_LOAN, Recovery=ASSET_PLEDGE → có Bàn giao TS)
  ('OT_PLEDGE_INSTALLMENT', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_PLEDGE_INSTALLMENT', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- OT_PLEDGE_BULLET (FOA_TERM_LOAN, Recovery=ASSET_PLEDGE)
  ('OT_PLEDGE_BULLET', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_INTEREST', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_PLEDGE_BULLET', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- OT_UNSECURED (FOA_TERM_LOAN, Recovery=UNSECURED → KHÔNG có Bàn giao TS)
  ('OT_UNSECURED', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  ('OT_UNSECURED', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_UNSECURED', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_UNSECURED', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_UNSECURED', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_UNSECURED', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_UNSECURED', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_UNSECURED', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  ('OT_UNSECURED', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_UNSECURED', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  ('OT_UNSECURED', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_UNSECURED', 'default'),
  ('OT_UNSECURED', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  ('OT_UNSECURED', 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_UNSECURED', 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  ('OT_UNSECURED', 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_UNSECURED', 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  ('OT_UNSECURED', 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_UNSECURED', 'default'),
  ('OT_UNSECURED', 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  -- OT_FACILITY (FOA_REVOLVING, Recovery=ASSET_PLEDGE)
  ('OT_FACILITY', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  ('OT_FACILITY', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_FACILITY', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_FACILITY', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_FACILITY', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_FACILITY', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_FACILITY', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_FACILITY', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_LIMIT_INC_DEC_CAPACITY', 'default'),
  ('OT_FACILITY', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  ('OT_FACILITY', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  ('OT_FACILITY', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_FACILITY', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  ('OT_FACILITY', 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_FACILITY', 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  ('OT_FACILITY', 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  ('OT_FACILITY', 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  ('OT_FACILITY', 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_FACILITY', 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_FACILITY', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- OT_GUARANTEE (FOA_CONDITIONAL — KHÔNG có OT_INTEREST, Party Giải ngân = Lender→Beneficiary)
  ('OT_GUARANTEE', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BENEFICIARY', 'default'),
  ('OT_GUARANTEE', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_GUARANTEE', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_GUARANTEE', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_GUARANTEE', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_GUARANTEE', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_GUARANTEE', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_GUARANTEE', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_BY_EVENT', 'default'),
  ('OT_GUARANTEE', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_CONDITIONAL_TRIGGER', 'default'),
  ('OT_GUARANTEE', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_GUARANTEE', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_GUARANTEE', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_GUARANTEE', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- OT_AUTO_PLEDGE (FOA_TERM_LOAN, Recovery=ASSET_PLEDGE) — cùng khuôn OT_PLEDGE_INSTALLMENT
  ('OT_AUTO_PLEDGE', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_AUTO_PLEDGE', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- OT_GOLD_BULLET (FOA_TERM_LOAN, Recovery=ASSET_PLEDGE) — cùng khuôn OT_PLEDGE_BULLET
  ('OT_GOLD_BULLET', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  ('OT_GOLD_BULLET', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_GOLD_BULLET', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_GOLD_BULLET', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_GOLD_BULLET', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_GOLD_BULLET', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_GOLD_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_GOLD_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  ('OT_GOLD_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_GOLD_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_GOLD_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_GOLD_BULLET', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  ('OT_GOLD_BULLET', 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_GOLD_BULLET', 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  ('OT_GOLD_BULLET', 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  ('OT_GOLD_BULLET', 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_GOLD_BULLET', 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_GOLD_BULLET', 'OT_INTEREST', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_GOLD_BULLET', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- OT_FACILITY_AUTO (FOA_REVOLVING, Recovery=ASSET_PLEDGE) — cùng khuôn OT_FACILITY
  ('OT_FACILITY_AUTO', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  ('OT_FACILITY_AUTO', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_FACILITY_AUTO', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_FACILITY_AUTO', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_FACILITY_AUTO', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_FACILITY_AUTO', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_FACILITY_AUTO', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_FACILITY_AUTO', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_LIMIT_INC_DEC_CAPACITY', 'default'),
  ('OT_FACILITY_AUTO', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  ('OT_FACILITY_AUTO', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  ('OT_FACILITY_AUTO', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_FACILITY_AUTO', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  ('OT_FACILITY_AUTO', 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_FACILITY_AUTO', 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  ('OT_FACILITY_AUTO', 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  ('OT_FACILITY_AUTO', 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  ('OT_FACILITY_AUTO', 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_FACILITY_AUTO', 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_FACILITY_AUTO', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- OT_COMMITMENT (FOA_CONDITIONAL — KHÔNG có OT_INTEREST, Party Giải ngân = Lender→Beneficiary)
  ('OT_COMMITMENT', 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BENEFICIARY', 'default'),
  ('OT_COMMITMENT', 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  ('OT_COMMITMENT', 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  ('OT_COMMITMENT', 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  ('OT_COMMITMENT', 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  ('OT_COMMITMENT', 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  ('OT_COMMITMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  ('OT_COMMITMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_BY_EVENT', 'default'),
  ('OT_COMMITMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_CONDITIONAL_TRIGGER', 'default'),
  ('OT_COMMITMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_ON_CONDITION', 'default'),
  ('OT_COMMITMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  ('OT_COMMITMENT', 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  ('OT_COMMITMENT', 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release');

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
  ('asset_type', 'Loại tài sản', 'GRP_COLLATERAL', 'DT_ENUM', true, 'Xe máy (TwoWheels)', NULL),
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

-- ===== 12b. attribute — Giai đoạn 61: mỗi Block thêm đúng 1 Attribute mới (làm giàu thư viện nền
-- tảng theo yêu cầu user, KHÔNG tạo Block/nhóm mới — tái dùng nguyên group_code/domain đã có của
-- từng Block). Toàn bộ is_required=false (an toàn, không phá completeness của Pattern/Config hiện có).
INSERT INTO "attribute" ("code", "name", "group_code", "data_type_code", "is_required", "default_value", "unit") VALUES
  ('co_borrower_allowed', 'Cho phép đồng vay', 'GRP_PARTY', 'DT_BOOL', false, 'Tắt', NULL),
  ('dispute_resolution', 'Cơ chế giải quyết tranh chấp', 'GRP_LEGAL', 'DT_ENUM', false, 'Toà án nơi cư trú của Bên vay', NULL),
  ('reference_index', 'Chỉ số lãi suất tham chiếu', 'GRP_PRICING', 'DT_ENUM', false, 'Không áp dụng (lãi suất cố định)', NULL),
  ('fee_collection_time', 'Thời điểm thu phí', 'GRP_FEE', 'DT_ENUM', false, 'Khi giải ngân', NULL),
  ('repay_channel', 'Kênh nhận trả nợ', 'GRP_REPAYMENT', 'DT_ENUM', false, 'Chuyển khoản', NULL),
  ('insurance_required', 'Yêu cầu bảo hiểm tài sản', 'GRP_COLLATERAL', 'DT_BOOL', false, 'Tắt', NULL),
  ('penalty_base', 'Cơ sở tính phạt', 'GRP_PENALTY', 'DT_ENUM', false, 'Trên số tiền chậm trả', NULL),
  ('review_cycle', 'Chu kỳ tái xét hạn mức', 'GRP_LIMIT', 'DT_ENUM', false, '12 tháng', NULL),
  ('rounding_rule', 'Quy tắc làm tròn', 'GRP_VALUE', 'DT_ENUM', false, 'Làm tròn đến nghìn đồng', NULL),
  ('disb_timing', 'Thời điểm giải ngân', 'GRP_DISBURSEMENT', 'DT_ENUM', false, 'Ngay sau ký hợp đồng', NULL),
  ('credit_history_required', 'Yêu cầu lịch sử tín dụng', 'GRP_ELIGIBILITY', 'DT_ENUM', false, 'Không nợ xấu nhóm 3-5', NULL),
  ('stmt_channel', 'Kênh gửi sao kê', 'GRP_BILLING', 'DT_ENUM', false, 'SMS', NULL);

-- ===== 12c. attribute — Giai đoạn 71: khóa is_overridable=false cho 6 Attribute đại diện cơ chế/
-- định dạng kỹ thuật cố định hoặc thủ tục pháp lý chuẩn hóa (KHÔNG phải giá trị "bao nhiêu" thương
-- mại biến thiên theo Selector Scope — theo đúng phân biệt của tài liệu "Lớp vỏ thương mại"). Cả 6
-- mã đều CHƯA từng có Fragment nào trong toàn bộ sample data (đã đối chiếu qua query fragment↔
-- answer_slot.attribute_code) nên khóa không ảnh hưởng completeness của bất kỳ Config hiện có nào:
-- dispute_resolution/legal_form-adjacent (GRP_LEGAL, cơ chế pháp lý); disb_syntax/transfer_content
-- (định dạng kỹ thuật cố định, vd "F88 {contract}"); rounding_rule (quy ước tính toán chuẩn hóa);
-- penalty_base (cơ chế tính phạt, khác penalty_rate là con số % vẫn giữ overridable); disb_timing
-- (gắn quy trình thẩm định rủi ro của Pattern, không phải dial thương mại).
UPDATE "attribute" SET "is_overridable" = false
  WHERE "code" IN ('dispute_resolution', 'disb_syntax', 'transfer_content', 'rounding_rule', 'penalty_base', 'disb_timing');

-- ===== 12d. attribute — Giai đoạn 73: đánh dấu is_template_customizable=true cho 17 Attribute có
-- BẰNG CHỨNG THẬT là giá trị khác nhau giữa các Template (đếm DISTINCT template_frame.frame_value
-- qua toàn bộ 6 Template — vd base_rate 4 giá trị khác nhau, asset_type/installment_count/
-- limit_amount 3, còn lại 2) — đây là nhóm "chính gốc" thật sự cần Template tự khai báo riêng.
-- 26 Attribute còn lại (KHÔNG nằm trong danh sách này, kể cả một số đang is_required=true như
-- age/compliance/lender_party/penalty_rate/rate_type/schedule) chỉ có ĐÚNG 1 giá trị y hệt ở mọi
-- Template từ trước tới giờ — is_required KHÔNG tương quan với "cần tuỳ biến theo Template" (đã xác
-- nhận qua AskUserQuestion, dùng tiêu chí dữ liệu thật thay vì suy diễn từ is_required) — giữ mặc
-- định false, tự động lấy default_value từ tầng Attribute, Template không cần khai báo lại.
UPDATE "attribute" SET "is_template_customizable" = true
  WHERE "code" IN ('base_rate', 'asset_type', 'installment_count', 'limit_amount', 'fee_amount',
                    'borrower_type', 'fee_type', 'interest_calc', 'legal_form', 'co_borrower_allowed',
                    'disb_timing', 'dispute_resolution', 'fee_collection_time', 'insurance_required',
                    'repay_channel', 'ltv', 'asset_valuation');

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
  ('asset_type', 'enum', NULL, NULL, NULL, 'TwoWheels / Car / Gold / Electronics…', NULL, NULL),
  ('age', 'range', 18, 60, NULL, 'MIN 18', NULL, 'Ngoài độ tuổi cho phép'),
  ('min_income', 'range', 0, NULL, NULL, '≥ 0', NULL, NULL),
  ('billing_day', 'range', 1, 28, 1, '1–28', NULL, 'Ngày chốt ngoài 1–28'),
  ('lender_party', 'required', NULL, NULL, NULL, 'is_identify = true', NULL, NULL),
  ('compliance', 'required', NULL, NULL, NULL, 'by-default', NULL, NULL),
  ('capacity_range', 'required', NULL, NULL, NULL, 'HAS_CAPACITY', NULL, NULL);

-- ===== 13b. attribute_constraint — Giai đoạn 61: ví dụ Dependency đúng nguyên văn tài liệu "Lớp vỏ
-- thương mại" (mục Constraint, loại Dependency: "Rate_type = 'Thả nổi' → bắt buộc có Reference Index").
-- Hiện DB chưa Config nào dùng rate_type='Thả nổi' nên reference_index vẫn để "Không áp dụng" ở mọi
-- Template — constraint này mô tả ĐÚNG quy tắc sẽ áp dụng khi có sản phẩm thả nổi sau này. =====
INSERT INTO "attribute_constraint" ("attribute_code", "kind", "min_value", "max_value", "step_value", "expression", "depends_on_attribute_code", "message") VALUES
  ('reference_index', 'dependency', NULL, NULL, NULL, 'Rate_type = ''Thả nổi'' → bắt buộc có Reference Index', 'rate_type', 'Lãi suất thả nổi phải khai báo chỉ số tham chiếu');

-- ===== 14. attribute_enum_value =====
INSERT INTO "attribute_enum_value" ("attribute_code", "sort_order", "value") VALUES
  ('asset_type', 1, 'Xe máy (TwoWheels)'),
  ('asset_type', 2, 'Ô tô (Car)'),
  ('asset_type', 3, 'Vàng (Gold)'),
  -- Giai đoạn 63: thêm giá trị thứ 4 — CFG-0021 (laptop cầm cố) đã dùng thật giá trị này ở fragment
  -- từ trước nhưng catalog chưa có, phát hiện qua đối chiếu fragment.value với attribute_enum_value.
  ('asset_type', 4, 'Thiết bị điện tử (Laptop)'),
  ('rate_type', 1, 'Cố định'),
  ('rate_type', 2, 'Thả nổi'),
  ('occupation', 1, 'Nhân viên văn phòng'),
  ('occupation', 2, 'Công nhân'),
  ('occupation', 3, 'Kinh doanh tự do'),
  ('occupation', 4, 'Giáo viên / Công chức'),
  -- Giai đoạn 63: TPL-003/TPL-006 đã dùng thật giá trị này (nghĩa "không ràng buộc nghề nghiệp cụ
  -- thể") nhưng catalog chưa có — thêm để đóng catalog, khớp đúng dữ liệu template_frame hiện có.
  ('occupation', 5, 'Không giới hạn'),
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

-- ===== 14b. attribute_enum_value — Giai đoạn 61: catalog đóng cho 10 Attribute mới thuộc DT_ENUM
-- (2 Attribute còn lại — co_borrower_allowed/insurance_required — là DT_BOOL, không cần enum). =====
INSERT INTO "attribute_enum_value" ("attribute_code", "sort_order", "value") VALUES
  ('dispute_resolution', 1, 'Toà án nơi cư trú của Bên vay'),
  ('dispute_resolution', 2, 'Trọng tài thương mại'),
  ('reference_index', 1, 'Không áp dụng (lãi suất cố định)'),
  ('reference_index', 2, 'Lãi suất tiết kiệm 12 tháng BQ 4 NHTM Nhà nước'),
  ('fee_collection_time', 1, 'Khi giải ngân'),
  ('fee_collection_time', 2, 'Hàng kỳ'),
  ('fee_collection_time', 3, 'Khi tất toán'),
  ('repay_channel', 1, 'Chuyển khoản'),
  ('repay_channel', 2, 'Tiền mặt tại PGD'),
  ('repay_channel', 3, 'Trích nợ tự động'),
  ('penalty_base', 1, 'Trên số tiền chậm trả'),
  ('penalty_base', 2, 'Trên dư nợ gốc quá hạn'),
  ('review_cycle', 1, '6 tháng'),
  ('review_cycle', 2, '12 tháng'),
  ('rounding_rule', 1, 'Làm tròn đến nghìn đồng'),
  ('rounding_rule', 2, 'Không làm tròn'),
  ('disb_timing', 1, 'Ngay sau ký hợp đồng'),
  ('disb_timing', 2, 'Sau thẩm định tài sản'),
  ('credit_history_required', 1, 'Không nợ xấu nhóm 3-5'),
  ('credit_history_required', 2, 'Không yêu cầu'),
  ('stmt_channel', 1, 'SMS'),
  ('stmt_channel', 2, 'Email'),
  ('stmt_channel', 3, 'Thông báo trong App');

-- ===== 14c. attribute_enum_value — Giai đoạn 63: catalog "giá trị kèm theo" cho 3 Attribute DT_BOOL
-- (co_borrower_allowed/compliance/insurance_required) — trước đây DT_BOOL không có dòng nào trong
-- bảng này (chỉ DT_ENUM mới có), nhưng thực chất Bool cũng là 1 tập giá trị đóng 2 phần tử. Thêm để
-- mọi Attribute (không riêng DT_ENUM) đều có sẵn "giá trị kèm theo" ngay từ khi khởi tạo — mục đích:
-- khi điền Template/Config sau này không cần gõ tay, chỉ cần lấy đúng từ danh mục này (user yêu cầu). =====
INSERT INTO "attribute_enum_value" ("attribute_code", "sort_order", "value") VALUES
  ('co_borrower_allowed', 1, 'Bật'),
  ('co_borrower_allowed', 2, 'Tắt'),
  ('compliance', 1, 'Bật'),
  ('compliance', 2, 'Tắt'),
  ('insurance_required', 1, 'Bật'),
  ('insurance_required', 2, 'Tắt');

-- ===== 15. block — 12 block (BLOCKS) =====
INSERT INTO "block" ("id", "code", "name", "biz_group", "governed_by_element_code", "governed_by_aspect", "status") VALUES
  ('BLK_ELIGIBILITY', 'BLOCK_ELIGIBILITY', 'Điều kiện tham gia', 'Khởi tạo', NULL, 'Eligibility', 'published'),
  ('BLK_COUNTERPARTY', 'BLOCK_COUNTERPARTY', 'Bên tham gia', 'Khởi tạo', NULL, 'Obligor Party', 'published'),
  ('BLK_REGULATORY', 'BLOCK_REGULATORY', 'Tuân thủ & Pháp lý', 'Khởi tạo', NULL, 'Legal Form', 'published'),
  -- Giai đoạn 52: BLK_LIMIT/BLK_INTEREST/BLK_FEE trước đây governed_by mã OET_NATURE giả (đã xóa) —
  -- chuyển sang governed_by_aspect = mã FOA thật (giữ đúng ý nghĩa gốc, không bịa liên kết OE mới).
  -- Giai đoạn 68: BLK_LIMIT/BLK_INTEREST đổi lại sang governed_by_element_code THẬT — query
  -- obligation_type_composition xác nhận OE_VAL_LIMIT_INC_DEC_CAPACITY 100% (2/2 dòng) chỉ dùng cho
  -- OTF họ Facility, OE_VAL_ACCRUAL_ON_BALANCE 100% (7/7 dòng) chỉ dùng cho OT_INTEREST — sạch,
  -- không mơ hồ (khác BLK_COUNTERPARTY còn 5 mã OE_PARTY_* không mã nào áp đảo, giữ nguyên aspect).
  -- BLK_FEE giữ nguyên aspect vì OT_FEE chưa từng có 1 dòng composition nào (không có OE thật).
  ('BLK_LIMIT', 'BLOCK_LIMIT', 'Hạn mức (Limit)', 'Giá trị', 'OE_VAL_LIMIT_INC_DEC_CAPACITY', NULL, 'published'),
  ('BLK_VALUEBASE', 'BLOCK_VALUE_BASE', 'Cơ sở giá trị (Value Base)', 'Giá trị', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', NULL, 'published'),
  ('BLK_DISBURSEMENT', 'BLOCK_DISBURSEMENT', 'Giải ngân (Disbursement)', 'Kích hoạt', 'OE_ACT_ON_DISBURSEMENT', NULL, 'published'),
  ('BLK_INTEREST', 'BLOCK_INTEREST', 'Lãi suất (Interest)', 'Vận hành', 'OE_VAL_ACCRUAL_ON_BALANCE', NULL, 'published'),
  ('BLK_FEE', 'BLOCK_FEE', 'Phí (Fee)', 'Vận hành', NULL, 'FOA_TERM_LOAN', 'published'),
  ('BLK_REPAYMENT', 'BLOCK_REPAYMENT', 'Trả nợ (Repayment)', 'Vận hành', 'OE_FUL_INSTALLMENT', NULL, 'published'),
  ('BLK_COLLATERAL', 'BLOCK_COLLATERAL', 'Tài sản đảm bảo', 'Thu hồi', 'OE_REC_ASSET_PLEDGE', NULL, 'published'),
  ('BLK_PENALTY', 'BLOCK_PENALTY', 'Phạt & Quá hạn', 'Thu hồi', NULL, 'PENALTY', 'published'),
  ('BLK_BILLING', 'BLOCK_BILLING', 'Sao kê & Hóa đơn', 'Vận hành', 'OE_TIME_CYCLE_STATEMENT', NULL, 'published');

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
  ('BLK_COLLATERAL', 'asset_type', 'Asset Type', 'asset_type', true, 'Xe máy (TwoWheels)', 'OE_REC_ASSET_PLEDGE'),
  ('BLK_COLLATERAL', 'asset_valuation', 'Asset Valuation Formula', 'asset_valuation', true, '70% giá trị', 'LTV ≤ 80%'),
  ('BLK_COLLATERAL', 'ltv', 'LTV tối đa', 'ltv', true, '80%', '≤ 80%'),
  ('BLK_PENALTY', 'penalty_rate', 'Penalty Rate', 'penalty_rate', true, '150% lãi', '≤ 150%'),
  ('BLK_PENALTY', 'grace', 'Grace Period', 'grace', false, '5 ngày', NULL),
  ('BLK_BILLING', 'stmt_cycle', 'Statement Cycle', 'stmt_cycle', false, 'Hàng tháng', NULL),
  ('BLK_BILLING', 'billing_day', 'Billing Day', 'billing_day', false, 'Ngày 5', '1–28');

-- ===== 16b. answer_slot — Giai đoạn 61: mỗi Block (12/12) thêm đúng 1 Answer Slot mới ứng với
-- Attribute mới thêm ở mục 12b — làm giàu "chiều sâu" theo yêu cầu user, không tạo Block mới. =====
INSERT INTO "answer_slot" ("block_id", "code", "name", "attribute_code", "is_required", "default_value", "rule_text") VALUES
  ('BLK_COUNTERPARTY', 'co_borrower_allowed', 'Co-borrower Allowed', 'co_borrower_allowed', false, 'Tắt', NULL),
  ('BLK_REGULATORY', 'dispute_resolution', 'Dispute Resolution', 'dispute_resolution', false, 'Toà án nơi cư trú của Bên vay', NULL),
  ('BLK_INTEREST', 'reference_index', 'Reference Index', 'reference_index', false, 'Không áp dụng (lãi suất cố định)', 'rate_type=Thả nổi → bắt buộc'),
  ('BLK_FEE', 'fee_collection_time', 'Fee Collection Time', 'fee_collection_time', false, 'Khi giải ngân', NULL),
  ('BLK_REPAYMENT', 'repay_channel', 'Repayment Channel', 'repay_channel', false, 'Chuyển khoản', NULL),
  ('BLK_COLLATERAL', 'insurance_required', 'Insurance Required', 'insurance_required', false, 'Tắt', NULL),
  ('BLK_PENALTY', 'penalty_base', 'Penalty Base', 'penalty_base', false, 'Trên số tiền chậm trả', NULL),
  ('BLK_LIMIT', 'review_cycle', 'Limit Review Cycle', 'review_cycle', false, '12 tháng', NULL),
  ('BLK_VALUEBASE', 'rounding_rule', 'Rounding Rule', 'rounding_rule', false, 'Làm tròn đến nghìn đồng', NULL),
  ('BLK_DISBURSEMENT', 'disb_timing', 'Disbursement Timing', 'disb_timing', false, 'Ngay sau ký hợp đồng', NULL),
  ('BLK_ELIGIBILITY', 'credit_history_required', 'Credit History Required', 'credit_history_required', false, 'Không nợ xấu nhóm 3-5', NULL),
  ('BLK_BILLING', 'stmt_channel', 'Statement Channel', 'stmt_channel', false, 'SMS', NULL);

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
  -- Giai đoạn 49: đổi lại mức ưu đãi cho đúng thứ tự thông thường (VIP >= Thân thiết) — trước đó
  -- seed gốc lỡ đặt Thân thiết (−0,5%) cao hơn VIP (−0,3%), khiến tổng phải trả VIP > Thân thiết.
  ('SEG_LOYALTY', 'Khách hàng thân thiết (−0,3%/tháng)', 'individual', 'loyalty', 'CMND/CCCD · Giấy nhận nợ cá nhân'),
  ('SEG_VIP', 'Khách hàng VIP (−0,5%/tháng)', 'individual', 'vip', 'CMND/CCCD · Giấy nhận nợ cá nhân');

-- ===== 21. product_intent — 6 PI (list view; liên kết BI [suy luận] theo chủ đề)
-- Giai đoạn 52: bỏ cột nature_element_code (trùng lặp 1:1 với archetype_code, xem OI-4) =====
INSERT INTO "product_intent" ("id", "code", "name", "business_intent_id", "archetype_code", "status") VALUES
  (1, 'PI-001', 'Cho vay tiêu dùng nhỏ lẻ', 1, 'FOA_TERM_LOAN', 'published'),
  (2, 'PI-002', 'Cấp hạn mức để cho vay', 4, 'FOA_REVOLVING', 'published'),
  (3, 'PI-003', 'Cho vay tiêu dùng có hạn mức', 4, 'FOA_REVOLVING', 'review'),
  (4, 'PI-004', 'Cho vay cầm cố ô tô', 2, 'FOA_TERM_LOAN', 'approved'),
  (5, 'PI-005', 'Cho vay cầm cố xe máy trả góp', 2, 'FOA_TERM_LOAN', 'published'),
  (6, 'PI-006', 'Vay tín chấp lương', 5, 'FOA_TERM_LOAN', 'draft');

SELECT setval(pg_get_serial_sequence('product_intent','id'), 6);

-- ===== 22. product_intent_element — Giai đoạn 66: viết lại hoàn toàn, đủ cấu trúc OT lõi/leg
-- (mirror obligation_type_composition, xem V1__schema.sql) thay vì 27 dòng phẳng cũ (Giai đoạn 22/51b).
-- Mỗi Intent copy NGUYÊN VẸN composition đầy đủ của đúng OTF "Primary" mà Pattern con thật của nó
-- (product_pattern.product_intent_id → pattern_obligation_type role='Primary') đang dùng — không bịa
-- mã mới, không rút gọn. Mapping thật:
--   PI-001 (id 1) ← PT-003 → OT_PLEDGE_BULLET (30 dòng)
--   PI-002 (id 2) ← PT-004 → OT_FACILITY       (30 dòng)
--   PI-003 (id 3) ← PT-002 → OT_FACILITY       (30 dòng, PT-002 còn có OT_PLEDGE_INSTALLMENT vai Support — bỏ qua, Intent chỉ phản ánh OTF chính)
--   PI-004 (id 4) ← PT-006 → OT_AUTO_PLEDGE     (30 dòng)
--   PI-005 (id 5) ← PT-001 → OT_PLEDGE_INSTALLMENT (30 dòng)
--   PI-006 (id 6) ← PT-005 → OT_UNSECURED       (18 dòng, không có OT_ASSET_HANDOVER)
-- Sửa 1 điểm lệch so với Giai đoạn 51b: PI-001 trước đây dùng tạm composition của OT_UNSECURED
-- ("đại diện cùng archetype FOA_TERM_LOAN" — chọn nhanh lúc đó), nay đúng lineage thật của Pattern
-- con (PT-003) là OT_PLEDGE_BULLET, đã sửa lại cho khớp. =====
INSERT INTO "product_intent_element" ("product_intent_id", "ot_core_code", "element_type_code", "element_code", "leg") VALUES
  -- PI-001 ← OT_PLEDGE_BULLET
  (1, 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  (1, 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  (1, 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  (1, 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  (1, 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (1, 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  (1, 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (1, 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  (1, 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (1, 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (1, 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (1, 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  (1, 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (1, 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  (1, 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (1, 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (1, 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (1, 'OT_INTEREST', 'OET_TIME', 'OE_TIME_DEADLINE_ONLY', 'default'),
  (1, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  (1, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  (1, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  (1, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  (1, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  (1, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  (1, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  (1, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  (1, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  (1, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  (1, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  (1, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- PI-002 ← OT_FACILITY
  (2, 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  (2, 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  (2, 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  (2, 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  (2, 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (2, 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  (2, 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (2, 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_LIMIT_INC_DEC_CAPACITY', 'default'),
  (2, 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  (2, 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  (2, 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (2, 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  (2, 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (2, 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  (2, 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  (2, 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  (2, 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (2, 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  (2, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  (2, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  (2, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  (2, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  (2, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  (2, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  (2, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  (2, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  (2, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  (2, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  (2, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  (2, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- PI-003 ← OT_FACILITY (Pattern con PT-002 dùng Primary; bỏ qua OT_PLEDGE_INSTALLMENT vai Support)
  (3, 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  (3, 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  (3, 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  (3, 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  (3, 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (3, 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  (3, 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (3, 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_LIMIT_INC_DEC_CAPACITY', 'default'),
  (3, 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  (3, 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  (3, 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (3, 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  (3, 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (3, 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  (3, 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_FACILITY_OPEN', 'default'),
  (3, 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_STATEMENT_CYCLE', 'default'),
  (3, 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (3, 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_STATEMENT', 'default'),
  (3, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  (3, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  (3, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  (3, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  (3, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  (3, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  (3, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  (3, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  (3, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  (3, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  (3, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  (3, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- PI-004 ← OT_AUTO_PLEDGE
  (4, 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  (4, 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  (4, 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  (4, 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  (4, 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (4, 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  (4, 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (4, 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  (4, 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (4, 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  (4, 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (4, 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  (4, 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (4, 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  (4, 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (4, 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  (4, 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (4, 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  (4, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  (4, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  (4, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  (4, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  (4, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  (4, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  (4, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  (4, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  (4, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  (4, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  (4, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  (4, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- PI-005 ← OT_PLEDGE_INSTALLMENT
  (5, 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  (5, 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  (5, 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  (5, 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  (5, 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (5, 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  (5, 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (5, 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  (5, 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (5, 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  (5, 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (5, 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  (5, 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (5, 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  (5, 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (5, 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  (5, 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_ASSET_PLEDGE', 'default'),
  (5, 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  (5, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER_CUSTODY', 'receive'),
  (5, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'receive'),
  (5, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'receive'),
  (5, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'receive'),
  (5, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'receive'),
  (5, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'receive'),
  (5, 'OT_ASSET_HANDOVER', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER_RELEASE', 'release'),
  (5, 'OT_ASSET_HANDOVER', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'release'),
  (5, 'OT_ASSET_HANDOVER', 'OET_ACTIVATION', 'OE_ACT_SETTLEMENT_TRIGGER', 'release'),
  (5, 'OT_ASSET_HANDOVER', 'OET_TIME', 'OE_TIME_POINT', 'release'),
  (5, 'OT_ASSET_HANDOVER', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'release'),
  (5, 'OT_ASSET_HANDOVER', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'release'),
  -- PI-006 ← OT_UNSECURED (không có OT_ASSET_HANDOVER — tín chấp, không tài sản đảm bảo)
  (6, 'OT_DISBURSEMENT', 'OET_PARTY', 'OE_PARTY_LENDER_BORROWER', 'default'),
  (6, 'OT_DISBURSEMENT', 'OET_VALUE', 'OE_VAL_FIXED_ONE_OFF', 'default'),
  (6, 'OT_DISBURSEMENT', 'OET_ACTIVATION', 'OE_ACT_CONTRACT_EFFECTIVE', 'default'),
  (6, 'OT_DISBURSEMENT', 'OET_TIME', 'OE_TIME_POINT', 'default'),
  (6, 'OT_DISBURSEMENT', 'OET_FULFILLMENT', 'OE_FUL_LUMP_SUM', 'default'),
  (6, 'OT_DISBURSEMENT', 'OET_RECOVERY', 'OE_REC_NOT_APPLICABLE', 'default'),
  (6, 'OT_PRINCIPAL_REPAYMENT', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (6, 'OT_PRINCIPAL_REPAYMENT', 'OET_VALUE', 'OE_VAL_PRINCIPAL_MULTI_DECREASE', 'default'),
  (6, 'OT_PRINCIPAL_REPAYMENT', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (6, 'OT_PRINCIPAL_REPAYMENT', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  (6, 'OT_PRINCIPAL_REPAYMENT', 'OET_RECOVERY', 'OE_REC_UNSECURED', 'default'),
  (6, 'OT_PRINCIPAL_REPAYMENT', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default'),
  (6, 'OT_INTEREST', 'OET_PARTY', 'OE_PARTY_BORROWER_LENDER', 'default'),
  (6, 'OT_INTEREST', 'OET_VALUE', 'OE_VAL_ACCRUAL_ON_BALANCE', 'default'),
  (6, 'OT_INTEREST', 'OET_ACTIVATION', 'OE_ACT_ON_DISBURSEMENT', 'default'),
  (6, 'OT_INTEREST', 'OET_FULFILLMENT', 'OE_FUL_INSTALLMENT', 'default'),
  (6, 'OT_INTEREST', 'OET_RECOVERY', 'OE_REC_UNSECURED', 'default'),
  (6, 'OT_INTEREST', 'OET_TIME', 'OE_TIME_CYCLE_DEADLINE', 'default');

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
  -- Giai đoạn 48: bổ sung Block "Hạn mức" — Pattern gốc thiếu sót từ đầu (CFG-0021/0040/0043
  -- đóng gói từ TPL-001 đều có product_variant.limit_range thật nhưng chưa từng đi qua Answer Slot).
  ('PT-001', 'BLK_LIMIT', 8, 'active'),
  -- Giai đoạn 60: bổ sung 2 Block còn thiếu theo ma trận OE×Block derived (Giai đoạn 58/59) — Pattern
  -- đã published mà OTF gán vào (OT_PLEDGE_INSTALLMENT) có OE_VAL_PRINCIPAL_MULTI_DECREASE/OE_ACT_ON_DISBURSEMENT
  -- trong composition nhưng Block tương ứng (BLK_VALUEBASE/BLK_DISBURSEMENT) chưa từng được gán vào canvas.
  ('PT-001', 'BLK_VALUEBASE', 9, 'active'),
  ('PT-001', 'BLK_DISBURSEMENT', 10, 'active'),
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
  -- Giai đoạn 60: BLK_DISBURSEMENT đã có sẵn từ đầu; chỉ thiếu BLK_VALUEBASE (OTF OT_PLEDGE_BULLET
  -- vẫn có OE_VAL_PRINCIPAL_MULTI_DECREASE trong composition dù là Bullet — đúng dữ liệu thật hiện có).
  ('PT-003', 'BLK_VALUEBASE', 7, 'active'),
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
  ('PT-005', 'BLK_VALUEBASE', 6, 'active'),
  ('PT-005', 'BLK_DISBURSEMENT', 7, 'active'),
  ('PT-006', 'BLK_COUNTERPARTY', 1, 'active'),
  ('PT-006', 'BLK_REGULATORY', 2, 'active'),
  ('PT-006', 'BLK_INTEREST', 3, 'active'),
  ('PT-006', 'BLK_FEE', 4, 'active'),
  ('PT-006', 'BLK_REPAYMENT', 5, 'active'),
  ('PT-006', 'BLK_COLLATERAL', 6, 'active'),
  ('PT-006', 'BLK_PENALTY', 7, 'active'),
  ('PT-006', 'BLK_VALUEBASE', 8, 'active'),
  ('PT-006', 'BLK_DISBURSEMENT', 9, 'active');

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
  ('TPL-003', 'BLK_COLLATERAL', 'asset_type', 'Xe máy (TwoWheels)'),
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
  ('TPL-001', 'BLK_COLLATERAL', 'asset_type', 'Xe máy (TwoWheels)'),
  ('TPL-001', 'BLK_COLLATERAL', 'asset_valuation', '80% giá trị'),
  ('TPL-001', 'BLK_COLLATERAL', 'ltv', '80%'),
  ('TPL-001', 'BLK_PENALTY', 'penalty_rate', '150% lãi'),
  -- Giai đoạn 48: BLK_LIMIT mới thêm vào PT-001 — giá trị khung chung, từng Config override riêng.
  ('TPL-001', 'BLK_LIMIT', 'limit_amount', '3tr – 80tr'),
  -- Giai đoạn 72: vá lỗ hổng phát hiện qua audit — capacity_range (bắt buộc) và min_amount của
  -- BLK_LIMIT chưa từng có khung Template dù mọi Config đã dùng TPL-001 đều có Fragment/default
  -- riêng khớp đúng 2 giá trị này (capacity_range='Có quản trị' — khớp answer_slot.default_value
  -- và mọi Fragment thật; min_amount='0đ' — khớp answer_slot.default_value, chưa Config nào override).
  ('TPL-001', 'BLK_LIMIT', 'capacity_range', 'Có quản trị'),
  ('TPL-001', 'BLK_LIMIT', 'min_amount', '0đ'),
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
  ('TPL-002', 'BLK_COLLATERAL', 'asset_type', 'Ô tô (Car)'),
  ('TPL-002', 'BLK_COLLATERAL', 'asset_valuation', '70% giá trị'),
  ('TPL-002', 'BLK_COLLATERAL', 'ltv', '70%'),
  ('TPL-002', 'BLK_PENALTY', 'penalty_rate', '150% lãi'),
  ('TPL-002', 'BLK_LIMIT', 'limit_amount', '50tr – 2 tỷ'),
  -- Giai đoạn 72: cùng lỗ hổng như TPL-001 (xem comment ở trên) — vá cho TPL-002.
  ('TPL-002', 'BLK_LIMIT', 'capacity_range', 'Có quản trị'),
  ('TPL-002', 'BLK_LIMIT', 'min_amount', '0đ'),
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
  ('TPL-004', 'BLK_COLLATERAL', 'asset_type', 'Ô tô (Car)'),
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
  ('TPL-005', 'BLK_COLLATERAL', 'asset_type', 'Vàng (Gold)'),
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

-- ===== 28e. template_frame — Giai đoạn 60: giá trị khung cho 2 Block mới gán vào PT-001/003/005/006
-- (BLK_VALUEBASE/BLK_DISBURSEMENT, xem mục 24 pattern_block). decrease_method/principal_base chỉ có
-- đúng 1 giá trị enum đóng trong attribute_enum_value ("Giảm dần theo gốc"/"Gốc vay") — dùng thẳng,
-- không có lựa chọn nào khác kể cả cho PT-003 (Bullet), vì catalog thật của DB chỉ có 1 giá trị.
-- disb_method/disb_syntax/transfer_content lấy đúng giá trị đã dùng cho TPL-005 (block này TPL-005 đã
-- có sẵn từ trước) để nhất quán giữa các Template dùng chung block, không suy diễn giá trị mới. =====
INSERT INTO "template_frame" ("template_code", "block_id", "slot_code", "frame_value") VALUES
  -- TPL-001 (PT-001)
  ('TPL-001', 'BLK_VALUEBASE', 'decrease_method', 'Giảm dần theo gốc'),
  ('TPL-001', 'BLK_VALUEBASE', 'principal_base', 'Gốc vay'),
  ('TPL-001', 'BLK_DISBURSEMENT', 'disb_method', 'Chuyển khoản'),
  ('TPL-001', 'BLK_DISBURSEMENT', 'disb_syntax', 'F88 {contract}'),
  ('TPL-001', 'BLK_DISBURSEMENT', 'transfer_content', 'Giai ngan {contract} - F88'),
  -- TPL-002 (PT-001, doanh nghiệp)
  ('TPL-002', 'BLK_VALUEBASE', 'decrease_method', 'Giảm dần theo gốc'),
  ('TPL-002', 'BLK_VALUEBASE', 'principal_base', 'Gốc vay'),
  ('TPL-002', 'BLK_DISBURSEMENT', 'disb_method', 'Chuyển khoản'),
  ('TPL-002', 'BLK_DISBURSEMENT', 'disb_syntax', 'F88 {contract}'),
  ('TPL-002', 'BLK_DISBURSEMENT', 'transfer_content', 'Giai ngan {contract} - F88'),
  -- TPL-004 (PT-006)
  ('TPL-004', 'BLK_VALUEBASE', 'decrease_method', 'Giảm dần theo gốc'),
  ('TPL-004', 'BLK_VALUEBASE', 'principal_base', 'Gốc vay'),
  ('TPL-004', 'BLK_DISBURSEMENT', 'disb_method', 'Chuyển khoản'),
  ('TPL-004', 'BLK_DISBURSEMENT', 'disb_syntax', 'F88 {contract}'),
  ('TPL-004', 'BLK_DISBURSEMENT', 'transfer_content', 'Giai ngan {contract} - F88'),
  -- TPL-005 (PT-003) — BLK_DISBURSEMENT đã có sẵn từ trước, chỉ thiếu BLK_VALUEBASE
  ('TPL-005', 'BLK_VALUEBASE', 'decrease_method', 'Giảm dần theo gốc'),
  ('TPL-005', 'BLK_VALUEBASE', 'principal_base', 'Gốc vay'),
  -- TPL-006 (PT-005)
  ('TPL-006', 'BLK_VALUEBASE', 'decrease_method', 'Giảm dần theo gốc'),
  ('TPL-006', 'BLK_VALUEBASE', 'principal_base', 'Gốc vay'),
  ('TPL-006', 'BLK_DISBURSEMENT', 'disb_method', 'Chuyển khoản'),
  ('TPL-006', 'BLK_DISBURSEMENT', 'disb_syntax', 'F88 {contract}'),
  ('TPL-006', 'BLK_DISBURSEMENT', 'transfer_content', 'Giai ngan {contract} - F88');

-- ===== 28f. template_frame — Giai đoạn 61: giá trị khung cho 12 Answer Slot mới (mục 16b) trên cả 6
-- Template hiện có — mỗi Template chỉ nhận slot của Block nó thực có (theo pattern_block của Pattern
-- gốc). Giá trị chủ yếu dùng đúng default_value ở answer_slot, có chủ đích khác biệt vài chỗ cho hợp
-- bối cảnh thật của từng Template (không bịa số liệu định lượng, chỉ chọn đúng phương án enum có sẵn):
-- TPL-002 (doanh nghiệp) → dispute_resolution "Trọng tài thương mại" thay vì toà án cá nhân, fee_collection_time
-- "Hàng kỳ" khớp đúng fee_type "Phí quản lý" đã có sẵn (khác "Phí thẩm định" 1 lần của TPL-001/004);
-- TPL-002/004 (ô tô, giá trị cao) → insurance_required "Bật"; TPL-001/002/004/005 (cầm cố có tài sản
-- vật lý) → disb_timing "Sau thẩm định tài sản", riêng TPL-006 (tín chấp lương, không tài sản) →
-- "Ngay sau ký hợp đồng"; TPL-006 (vay lương cá nhân) → co_borrower_allowed "Bật", repay_channel
-- "Trích nợ tự động" (khớp đặc thù trả lương qua tài khoản). =====
INSERT INTO "template_frame" ("template_code", "block_id", "slot_code", "frame_value") VALUES
  -- TPL-001 (PT-001: COUNTERPARTY/REGULATORY/INTEREST/FEE/REPAYMENT/COLLATERAL/PENALTY/LIMIT/VALUEBASE/DISBURSEMENT)
  ('TPL-001', 'BLK_COUNTERPARTY', 'co_borrower_allowed', 'Tắt'),
  ('TPL-001', 'BLK_REGULATORY', 'dispute_resolution', 'Toà án nơi cư trú của Bên vay'),
  ('TPL-001', 'BLK_INTEREST', 'reference_index', 'Không áp dụng (lãi suất cố định)'),
  ('TPL-001', 'BLK_FEE', 'fee_collection_time', 'Khi giải ngân'),
  ('TPL-001', 'BLK_REPAYMENT', 'repay_channel', 'Chuyển khoản'),
  ('TPL-001', 'BLK_COLLATERAL', 'insurance_required', 'Tắt'),
  ('TPL-001', 'BLK_PENALTY', 'penalty_base', 'Trên số tiền chậm trả'),
  ('TPL-001', 'BLK_LIMIT', 'review_cycle', '12 tháng'),
  ('TPL-001', 'BLK_VALUEBASE', 'rounding_rule', 'Làm tròn đến nghìn đồng'),
  ('TPL-001', 'BLK_DISBURSEMENT', 'disb_timing', 'Sau thẩm định tài sản'),
  -- TPL-002 (PT-001, doanh nghiệp/ô tô)
  ('TPL-002', 'BLK_COUNTERPARTY', 'co_borrower_allowed', 'Tắt'),
  ('TPL-002', 'BLK_REGULATORY', 'dispute_resolution', 'Trọng tài thương mại'),
  ('TPL-002', 'BLK_INTEREST', 'reference_index', 'Không áp dụng (lãi suất cố định)'),
  ('TPL-002', 'BLK_FEE', 'fee_collection_time', 'Hàng kỳ'),
  ('TPL-002', 'BLK_REPAYMENT', 'repay_channel', 'Chuyển khoản'),
  ('TPL-002', 'BLK_COLLATERAL', 'insurance_required', 'Bật'),
  ('TPL-002', 'BLK_PENALTY', 'penalty_base', 'Trên số tiền chậm trả'),
  ('TPL-002', 'BLK_LIMIT', 'review_cycle', '12 tháng'),
  ('TPL-002', 'BLK_VALUEBASE', 'rounding_rule', 'Làm tròn đến nghìn đồng'),
  ('TPL-002', 'BLK_DISBURSEMENT', 'disb_timing', 'Sau thẩm định tài sản'),
  -- TPL-003 (PT-002: ELIGIBILITY/COUNTERPARTY/REGULATORY/LIMIT/INTEREST/REPAYMENT/COLLATERAL/PENALTY/BILLING)
  ('TPL-003', 'BLK_ELIGIBILITY', 'credit_history_required', 'Không nợ xấu nhóm 3-5'),
  ('TPL-003', 'BLK_COUNTERPARTY', 'co_borrower_allowed', 'Tắt'),
  ('TPL-003', 'BLK_REGULATORY', 'dispute_resolution', 'Toà án nơi cư trú của Bên vay'),
  ('TPL-003', 'BLK_LIMIT', 'review_cycle', '12 tháng'),
  ('TPL-003', 'BLK_INTEREST', 'reference_index', 'Không áp dụng (lãi suất cố định)'),
  ('TPL-003', 'BLK_REPAYMENT', 'repay_channel', 'Chuyển khoản'),
  ('TPL-003', 'BLK_COLLATERAL', 'insurance_required', 'Tắt'),
  ('TPL-003', 'BLK_PENALTY', 'penalty_base', 'Trên số tiền chậm trả'),
  ('TPL-003', 'BLK_BILLING', 'stmt_channel', 'SMS'),
  -- TPL-004 (PT-006: COUNTERPARTY/REGULATORY/INTEREST/FEE/REPAYMENT/COLLATERAL/PENALTY/VALUEBASE/DISBURSEMENT)
  ('TPL-004', 'BLK_COUNTERPARTY', 'co_borrower_allowed', 'Tắt'),
  ('TPL-004', 'BLK_REGULATORY', 'dispute_resolution', 'Toà án nơi cư trú của Bên vay'),
  ('TPL-004', 'BLK_INTEREST', 'reference_index', 'Không áp dụng (lãi suất cố định)'),
  ('TPL-004', 'BLK_FEE', 'fee_collection_time', 'Khi giải ngân'),
  ('TPL-004', 'BLK_REPAYMENT', 'repay_channel', 'Chuyển khoản'),
  ('TPL-004', 'BLK_COLLATERAL', 'insurance_required', 'Bật'),
  ('TPL-004', 'BLK_PENALTY', 'penalty_base', 'Trên số tiền chậm trả'),
  ('TPL-004', 'BLK_VALUEBASE', 'rounding_rule', 'Làm tròn đến nghìn đồng'),
  ('TPL-004', 'BLK_DISBURSEMENT', 'disb_timing', 'Sau thẩm định tài sản'),
  -- TPL-005 (PT-003: COUNTERPARTY/REGULATORY/DISBURSEMENT/INTEREST/COLLATERAL/PENALTY/VALUEBASE)
  ('TPL-005', 'BLK_COUNTERPARTY', 'co_borrower_allowed', 'Tắt'),
  ('TPL-005', 'BLK_REGULATORY', 'dispute_resolution', 'Toà án nơi cư trú của Bên vay'),
  ('TPL-005', 'BLK_DISBURSEMENT', 'disb_timing', 'Sau thẩm định tài sản'),
  ('TPL-005', 'BLK_INTEREST', 'reference_index', 'Không áp dụng (lãi suất cố định)'),
  ('TPL-005', 'BLK_COLLATERAL', 'insurance_required', 'Tắt'),
  ('TPL-005', 'BLK_PENALTY', 'penalty_base', 'Trên số tiền chậm trả'),
  ('TPL-005', 'BLK_VALUEBASE', 'rounding_rule', 'Làm tròn đến nghìn đồng'),
  -- TPL-006 (PT-005: ELIGIBILITY/COUNTERPARTY/INTEREST/REPAYMENT/PENALTY/VALUEBASE/DISBURSEMENT)
  ('TPL-006', 'BLK_ELIGIBILITY', 'credit_history_required', 'Không nợ xấu nhóm 3-5'),
  ('TPL-006', 'BLK_COUNTERPARTY', 'co_borrower_allowed', 'Bật'),
  ('TPL-006', 'BLK_INTEREST', 'reference_index', 'Không áp dụng (lãi suất cố định)'),
  ('TPL-006', 'BLK_REPAYMENT', 'repay_channel', 'Trích nợ tự động'),
  ('TPL-006', 'BLK_PENALTY', 'penalty_base', 'Trên số tiền chậm trả'),
  ('TPL-006', 'BLK_VALUEBASE', 'rounding_rule', 'Làm tròn đến nghìn đồng'),
  ('TPL-006', 'BLK_DISBURSEMENT', 'disb_timing', 'Ngay sau ký hợp đồng');

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
  -- Giai đoạn 48: khớp đúng product_variant.limit_range thật của VAR-106 ("2tr – 30tr").
  ('CFG-0021', 'BLK_LIMIT', 'limit_amount', 'default', NULL, '2.000.000đ – 30.000.000đ', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_LIMIT', 'capacity_range', 'default', NULL, 'Có quản trị', false, 'Hợp lệ'),
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
  -- Giai đoạn 48: khớp đúng product_variant.limit_range thật của VAR-103 ("3tr – 80tr").
  ('CFG-0040', 'BLK_LIMIT', 'limit_amount', 'default', NULL, '3.000.000đ – 80.000.000đ', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_LIMIT', 'capacity_range', 'default', NULL, 'Có quản trị', false, 'Hợp lệ'),
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

-- ===== 30b2. fragment — Giai đoạn 62: CFG-0041/CFG-0042 (cả 2 published, cùng ← TPL-003/PT-002)
-- thiếu Fragment cho 6 slot bắt buộc của 3 Block ELIGIBILITY/REGULATORY (age/min_income/compliance/
-- legal_form) + rate_type/schedule — cả 2 Config có `template_frame` đủ (kế thừa được ở màn builder)
-- nhưng chưa từng có Fragment thật nào cho các slot này (sót lại từ trước Giai đoạn 21c khi TPL-003
-- mới bổ sung 3 Block này) nên completeness báo thiếu dù giá trị "nhìn thấy" trên UI vẫn đủ. Giá trị
-- dùng đúng `template_frame` đã có sẵn của TPL-003 — không có căn cứ nào cho thấy 2 Config này cần
-- khác biệt so với khung Template (không bịa số liệu mới). =====
INSERT INTO "fragment" ("config_code", "block_id", "slot_code", "scope_code", "scope_value", "value", "is_warning", "validation_msg") VALUES
  ('CFG-0041', 'BLK_ELIGIBILITY', 'age', 'default', NULL, '18 – 60', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_ELIGIBILITY', 'min_income', 'default', NULL, '5.000.000đ', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_REGULATORY', 'compliance', 'default', NULL, 'Bật', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_REGULATORY', 'legal_form', 'default', NULL, 'Giấy nhận nợ', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0041', 'BLK_REPAYMENT', 'schedule', 'default', NULL, 'Hàng tháng', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_ELIGIBILITY', 'age', 'default', NULL, '18 – 60', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_ELIGIBILITY', 'min_income', 'default', NULL, '5.000.000đ', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_REGULATORY', 'compliance', 'default', NULL, 'Bật', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_REGULATORY', 'legal_form', 'default', NULL, 'Giấy nhận nợ', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_INTEREST', 'rate_type', 'default', NULL, 'Cố định', false, 'Hợp lệ'),
  ('CFG-0042', 'BLK_REPAYMENT', 'schedule', 'default', NULL, 'Hàng tháng', false, 'Hợp lệ');

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
  ('CFG-0043', 'BLK_PENALTY', 'penalty_rate', 'default', NULL, '150% lãi suất trong hạn', false, 'Hợp lệ'),
  -- Giai đoạn 48: khớp đúng product_variant.limit_range thật của VAR-108 ("3tr – 40tr").
  ('CFG-0043', 'BLK_LIMIT', 'limit_amount', 'default', NULL, '3.000.000đ – 40.000.000đ', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_LIMIT', 'capacity_range', 'default', NULL, 'Có quản trị', false, 'Hợp lệ');

-- ===== 30d. fragment — Giai đoạn 60: fragment scope=default cho 2 slot bắt buộc của 2 Block mới gán
-- vào PT-001/003/005/006 (BLK_VALUEBASE.decrease_method+principal_base, BLK_DISBURSEMENT.disb_method)
-- — hoàn thiện thân bất biến "mỗi (config, slot bắt buộc) phải có ≥1 fragment" (mục 30b) cho các Config
-- đang dùng 4 Pattern này, để completeness lên đúng 100% thay vì báo thiếu dù Template đã có khung.
-- CFG-0039 đã có sẵn disb_method từ trước (TPL-005/PT-003 vốn có BLK_DISBURSEMENT từ đầu) nên chỉ
-- thiếu BLK_VALUEBASE. decrease_method/principal_base dùng đúng giá trị enum đóng duy nhất trong DB
-- (không có lựa chọn khác); disb_method dùng "Chuyển khoản" khớp CFG-0039 đã có sẵn (Giai đoạn 41). =====
INSERT INTO "fragment" ("config_code", "block_id", "slot_code", "scope_code", "scope_value", "value", "is_warning", "validation_msg") VALUES
  -- CFG-0021 (retired) ← TPL-001/PT-001
  ('CFG-0021', 'BLK_VALUEBASE', 'decrease_method', 'default', NULL, 'Giảm dần theo gốc', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_VALUEBASE', 'principal_base', 'default', NULL, 'Gốc vay', false, 'Hợp lệ'),
  ('CFG-0021', 'BLK_DISBURSEMENT', 'disb_method', 'default', NULL, 'Chuyển khoản', false, 'Hợp lệ'),
  -- CFG-0037 (review) ← TPL-002/PT-001
  ('CFG-0037', 'BLK_VALUEBASE', 'decrease_method', 'default', NULL, 'Giảm dần theo gốc', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_VALUEBASE', 'principal_base', 'default', NULL, 'Gốc vay', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_DISBURSEMENT', 'disb_method', 'default', NULL, 'Chuyển khoản', false, 'Hợp lệ'),
  -- Giai đoạn 60: BLK_LIMIT có sẵn từ PT-001 (Giai đoạn 48) nhưng CFG-0037 chưa từng có fragment —
  -- khớp đúng product_variant.limit_range thật của VAR-107 ("100tr – 2 tỷ"), lỗ hổng sót từ Giai đoạn 48
  -- (đợt đó chỉ backfill 3 Config của TPL-001, bỏ sót CFG-0037 của TPL-002).
  ('CFG-0037', 'BLK_LIMIT', 'limit_amount', 'default', NULL, '100.000.000đ – 2.000.000.000đ', false, 'Hợp lệ'),
  ('CFG-0037', 'BLK_LIMIT', 'capacity_range', 'default', NULL, 'Có quản trị', false, 'Hợp lệ'),
  -- CFG-0038 (review) ← TPL-006/PT-005
  ('CFG-0038', 'BLK_VALUEBASE', 'decrease_method', 'default', NULL, 'Giảm dần theo gốc', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_VALUEBASE', 'principal_base', 'default', NULL, 'Gốc vay', false, 'Hợp lệ'),
  ('CFG-0038', 'BLK_DISBURSEMENT', 'disb_method', 'default', NULL, 'Chuyển khoản', false, 'Hợp lệ'),
  -- CFG-0039 (approved) ← TPL-005/PT-003 — disb_method đã có sẵn, chỉ thiếu BLK_VALUEBASE
  ('CFG-0039', 'BLK_VALUEBASE', 'decrease_method', 'default', NULL, 'Giảm dần theo gốc', false, 'Hợp lệ'),
  ('CFG-0039', 'BLK_VALUEBASE', 'principal_base', 'default', NULL, 'Gốc vay', false, 'Hợp lệ'),
  -- CFG-0040 (published) ← TPL-001/PT-001
  ('CFG-0040', 'BLK_VALUEBASE', 'decrease_method', 'default', NULL, 'Giảm dần theo gốc', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_VALUEBASE', 'principal_base', 'default', NULL, 'Gốc vay', false, 'Hợp lệ'),
  ('CFG-0040', 'BLK_DISBURSEMENT', 'disb_method', 'default', NULL, 'Chuyển khoản', false, 'Hợp lệ'),
  -- CFG-0043 (published) ← TPL-001/PT-001
  ('CFG-0043', 'BLK_VALUEBASE', 'decrease_method', 'default', NULL, 'Giảm dần theo gốc', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_VALUEBASE', 'principal_base', 'default', NULL, 'Gốc vay', false, 'Hợp lệ'),
  ('CFG-0043', 'BLK_DISBURSEMENT', 'disb_method', 'default', NULL, 'Chuyển khoản', false, 'Hợp lệ');

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

-- ===== 34-35. constraint_matrix / matrix_cell — Giai đoạn 58: BỎ HẲN, không còn dùng =====
-- Màn Ma trận giờ chỉ còn đúng 2 ma trận, cả 2 đều PHÁI SINH (không lưu bảng này):
--   "FOA × Obligation Element" (derived từ foa_element, từ Giai đoạn 51) và
--   "Obligation Element × Block" (derived từ block.governed_by_element_code, Giai đoạn 58).
-- 2 kind cũ ELEMENTTYPE_X_ELEMENTTYPE ("OET × OET") và OBLIGATIONTYPE_X_BLOCK ("OTF × Block") đã
-- bỏ khỏi màn Ma trận theo yêu cầu user; banner độ phủ ở Pattern builder (trước đọc từ
-- OBLIGATIONTYPE_X_BLOCK) cũng đổi sang đọc trực tiếp Obligation Element × Block — xem
-- ProductPatternService#detail. Bảng constraint_matrix/matrix_cell vẫn giữ trong schema (có thể
-- dùng lại cho ma trận thật khác sau này) nhưng seed để trống, không còn dữ liệu nào.

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
  (1, 2, 1, 'Điền OE cho 3 OT lõi Cốt lõi (Giải ngân / Hoàn trả gốc / Trả lãi)', true),
  (1, 2, 2, 'Bật/tắt OT lõi Phụ trợ theo bảng kích hoạt', true),
  (1, 2, 3, 'Điền OE cho OT lõi Phụ trợ đã bật để hoàn thành OTF', true),
  (1, 3, 1, 'Gán Obligation Type Family (OTF) cho khuôn', true),
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
