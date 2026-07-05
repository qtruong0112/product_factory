# NEXT_WORK.md — Kế hoạch bước tiếp theo (Product Factory 5.1)

> **Bổ trợ `PROJECT_STATUS.md`.** Ghi QUYẾT ĐỊNH về thứ tự ưu tiên + đặc tả màn kế. Đọc cùng `PROJECT_STATUS.md` (nguồn sự thật về convention, kiến trúc, ghi chú kỹ thuật).
> **Quy tắc:** Code là chuẩn. MD lệch code → tin code. Giải nén zip mới nhất, quét code trước khi làm.

---

## 0. QUYẾT ĐỊNH ĐÃ CHỐT (ưu tiên) — ĐÃ ĐỔI THỨ TỰ

**Quyết định mới (user chốt):** làm **THƯ VIỆN NỀN TẢNG trước, PIPELINE SẢN PHẨM sau.**

Lý do: các màn Pipeline (pattern/template/config/variant/catalog) *đọc dữ liệu từ* thư viện nền tảng (`block`, `answer_slot`, `attribute`, `data_type`, `constraint_matrix`, obligation, archetype…). Dựng nền tảng trước → khi tới Pipeline, mọi thứ **join API thật, KHÔNG fix cứng dòng nào**. Builder Pattern hiện tại giữ nguyên (hình đã đúng); khi backend nền tảng xong thì wire nó chỉ còn **đổi nguồn data** — không phí công đã làm.

1. **VIỆC KẾ TIẾP = Thư viện nền tảng.** Bắt đầu **Block & Answer Slot (+ data_type)** — vừa là màn thư viện, vừa cấp nguồn để gỡ fix cứng builder Pattern. Thứ tự + đặc tả ở **mục 2**.
2. **Khi backend nền tảng đủ → WIRE builder Pattern về API thật** (chỉ đổi nguồn data, mục 2.7) → rồi **Pipeline** (template → config → variant → catalog), đều DB-driven (mục 3).
3. **NỢ (Business Intent detail+KPI, ListScreen interactive) → vẫn để đợt polish cuối, KHÔNG xen giữa.** Mục 5.

---

## 1. TIẾN ĐỘ HIỆN TẠI (snapshot — đã quét code)

Đã xong pixel-perfect + verify:
- **dashboard** — Layout + Dashboard.
- **businessintent** — **chỉ màn LIST**. *Chưa* detail/KPI (không có `BusinessIntentKpi`, không có `BusinessIntentDetailPage`, không có endpoint detail). → nợ (5.1).
- **intent (Product Intent)** — **list + detail + backend** đầy đủ.
- **pattern (Product Pattern)** — **backend + BUILDER pixel-perfect** ("Trình dựng Product Pattern" 3 cột), **đã WIRE về DB thật (Giai đoạn 13, mục 2.7)** — `patternBuilderData.ts` đã xóa, không còn fix cứng.
- **block (Block & Answer Slot)** — ✅ **XONG (Giai đoạn 6).** Backend package `structure`: `Block`/`AnswerSlot`(+`AnswerSlotId`)/`DataType` + repos; `BlockController` `/api/blocks` (list làm giàu `slotCount`/`gov` + `/{id}/detail` join answer_slot+attribute+data_type) + `DataTypeController` `/api/data-types`. Frontend `BlockPage` list 6 cột pixel-perfect (bỏ footer giả, hiện đủ 12 block thật). Build + render verify OK. `/{id}/detail` đã sẵn nguồn cho việc wire builder Pattern (2.7).
- **matrix (Ma trận ràng buộc)** — ✅ **XONG (Giai đoạn 7).** Backend package `governance`: `ConstraintMatrix`/`MatrixCell`(+`MatrixCellId`) + repos; `ConstraintMatrixController` `/api/constraint-matrices` (list + `/{id}/detail` grid join nhãn theo kind + `/pattern-coverage` phái sinh từ pattern OT × ma trận 3). Frontend `MatrixPage` 4-tab pixel-perfect (grid verdict tô màu, stats, legend). Verdict khớp seed 100%; nhãn cột/hàng dùng name thật DB (khác nhẹ nhãn rút gọn prototype); tab 4 phái sinh hiện đủ 6 pattern. Logic coverage tính ở BE — dùng lại cho 2.7.
- **attribute (list 3-tab)** — ✅ **XONG (Giai đoạn 8) — CHỈ MÀN LIST** (user chốt phạm vi: bỏ màn "Attribute Usage" detail/lineage + modal tạo/sửa, vì cần dữ liệu Pipeline/`fragment`/`selector_scope` chưa có backend — xem mục 5.4 nợ mới). Backend package `attribute`: `Domain`/`AttributeGroup`/`AttributeConstraint` (entity mới, KHÔNG có `AttributeEnumValue`); `AttributeController`/`AttributeGroupController` (mới) + `structure/DataTypeController` chuyển sang tự viết Page<Map> join làm giàu (dataTypeName, usedInSlots từ answer_slot, constraintSummary từ attribute_constraint, domainName, attributeCount). Frontend `AttributePage` 3-tab (Attribute/Attribute Group/Data Type) dùng chung `ListScreen` + tab bar trích style `MatrixPage`. Cột "Mô tả"/"Ví dụ giá trị" bị bỏ ở tab Group/Data Type (bảng DB không có cột nguồn). Build + render verify OK (mock data từ seed thật: 31 attribute/12 group/9 data type).

Backend đã có sẵn (đừng làm trùng):
- **Lớp I Ontology (9 bảng): backend XONG** (Giai đoạn 1) — obligation_element_type, obligation_element, financial_obligation_archetype, foa_element, obligation_family, obligation_type, obligation_type_composition, lifecycle, lifecycle_state. **Chỉ thiếu frontend pixel-perfect** (đang dùng DataTable tạm).
- **`attribute`**: entity/repo/controller đã có (`/api/attributes`, đã join làm giàu ở Giai đoạn 8). `domain`/`attribute_group`/`attribute_constraint` cũng đã có (Giai đoạn 8).

Chưa có backend: `attribute_enum_value`, `selector_scope`, `fragment` (Lớp II — chỉ cần khi làm màn Attribute Usage/Config, mục 5.4); và toàn bộ Pipeline sau pattern (`product_template`, `product_config`, `product_variant`, `product_catalog`...).

Zip mới nhất đã giao trước đó: `product-factory-phase7-matrix.zip` (từ giờ dùng git commit thay zip — xem CLAUDE.md).

nav key nhóm nền tảng (từ `nav.ts`): `obligation`, `ontology`, `sysmap`, `archetype`, `attribute`, `block`, `matrix`, `lifecycle`, `domain`.

---

## 2. VIỆC KẾ TIẾP: THƯ VIỆN NỀN TẢNG (thứ tự thực thi)

> Làm từng màn trọn vẹn (backend + frontend + build + render verify + zip). Xếp để đồng thời gỡ fix cứng builder Pattern sớm nhất.

### 2.1 Block & Answer Slot (+ data_type) — nav key `block` — ✅ XONG (Giai đoạn 6)
> Đã hoàn thành đúng đặc tả dưới đây. `Block`/`AnswerSlot`(+Id)/`DataType` package `structure`; `/api/blocks` (+`/{id}/detail`), `/api/data-types`; `BlockPage` list pixel-perfect. Backend `/{id}/detail` trả `{block, slots:[{code,name,type,required,def,rule,attrName,attrCode}]}` — nguồn thật để gỡ fix cứng builder ở 2.7. **Không có block detail page** (prototype click row = create no-op, không có màn chi tiết → không bịa). **Kế tiếp = 2.2 Ma trận ràng buộc.**


Backend **package `structure`** (Lớp II):
- **`Block`** (PK `id` varchar(40)): `code` varchar(60) UNIQUE, `name` varchar(160), `biz_group` `biz_group_enum` (Khởi tạo/Giá trị/Kích hoạt/Vận hành/Thu hồi), `governed_by_element_code` varchar(60) NULL, `governed_by_aspect` varchar(80) NULL, `status`. + `BlockRepository` + `BlockController` `/api/blocks` (+ `/{id}/detail` join answer slots).
- **`AnswerSlot`** (+`AnswerSlotId` composite `[block_id, code]`): `name` varchar(160), `attribute_code` varchar(60), `is_required` bool, `default_value` varchar(255) NULL, `rule_text` varchar(255) NULL. + `AnswerSlotRepository.findByBlockId(String)` (giữ thứ tự seed; nếu cần thứ tự ổn định thì `OrderByCode`).
- **`DataType`** (PK `code` varchar(20)): `name` varchar(60). + `DataTypeRepository`. (Map: DT_MONEY→Money, DT_PERCENT→Percent, DT_INT→Integer, DT_ENUM→Enum, DT_RANGE→Range, DT_BOOL→Boolean, DT_FORMULA→Formula, DT_REF→Reference, DT_TEXT→Text.)

Frontend: **trích markup màn `block` từ prototype** trước khi code (list các block + panel answer slot — có thể giống builder right-panel). `pages/BlockPage.tsx` (+ detail nếu prototype có). Hiển thị: block (name/biz_group/gov/status) + answer slots (name/type=data_type.name/attribute/required/default/rule). nav key `block`.

Seed thật đã có: 12 block (BLK_ELIGIBILITY…BLK_BILLING) + answer_slot đầy đủ (vd `('BLK_ELIGIBILITY','age','Độ tuổi','age',true,'18 – 60','MIN 18')`). Dùng làm mock render verify.

### 2.2 Ma trận ràng buộc — nav key `matrix` — ✅ XONG (Giai đoạn 7)
> Đã hoàn thành. `ConstraintMatrix`/`MatrixCell`(+Id) package `governance`; `/api/constraint-matrices` (list + `/{id}/detail` grid + `/pattern-coverage`); `MatrixPage` 4-tab pixel-perfect. Nhãn hàng/cột join theo kind (element/archetype/OET/obligation_type/block name). Tab 4 "Pattern × Block" phái sinh từ DB (OT của pattern × ma trận 3, rank na<pos<req) — **logic coverage này dùng lại cho 2.7**. Verdict khớp seed 100%. **Kế tiếp = 2.3 Attribute.**

<details><summary>Đặc tả gốc (đã thực hiện)</summary>


Backend **package `governance`** (Lớp IV):
- **`ConstraintMatrix`** (PK `id`): `kind` `matrix_kind_enum`, `title`, `description`. + repo `findFirstByKind(String)` / `findAll`.
- **`MatrixCell`** (+`MatrixCellId` composite `[matrix_id, row_code, col_code]`): `verdict` `matrix_verdict_enum` (req|pos|na…), `is_override` bool. + repo `findByMatrixId(Long)`.
- Controller `/api/constraint-matrices` (+ `/{id}/cells` hoặc `/{id}/detail` trả matrix + cells dạng grid).

Seed: 3 ma trận — id=1 ARCHETYPE_X_ELEMENT, id=2 ELEMENTTYPE_X_ELEMENTTYPE, id=3 **OBLIGATIONTYPE_X_BLOCK** (row=OT code, col=block_id, verdict req/pos/na). Đây là nguồn ma trận cho builder Pattern (2.7).

Frontend: trích markup màn `matrix`, dựng lưới ma trận (row × col, ô verdict tô màu). nav key `matrix`.
</details>

### 2.3 Attribute — nav key `attribute` — ✅ XONG (Giai đoạn 8, CHỈ MÀN LIST)
Đã hoàn thành màn list 3-tab (Attribute/Attribute Group/Data Type), backend `Domain`/`AttributeGroup`/`AttributeConstraint` mới + `AttributeController`/`AttributeGroupController`/`structure.DataTypeController` join làm giàu. **Đã hoãn** màn "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant + Selector Scope + where-used) và modal tạo/sửa — cần dữ liệu từ Pipeline (`product_template`/`product_config`/`product_variant`) + `fragment`/`selector_scope` (Lớp II) chưa có backend. Ghi nợ ở mục 5.4. **Kế tiếp = 2.4 Obligation Library + Archetype.**

### 2.4 Obligation Library + Financial Obligation Archetype — nav key `obligation`, `archetype`
- **`obligation`** — ✅ **XONG (Giai đoạn 9).** List 3-tab (Obligation Type/Obligation Element/Element Type), backend 3 controller (`ObligationTypeController`/`ObligationElementController`/`ObligationElementTypeController`) chuyển từ `ReadOnlyController` sang tự viết join làm giàu (familyName/archetypeName/elementCount/elementTypeName/isIdentify). Không có tab riêng cho `obligation_family` (chỉ 1 cột) hay `obligation_type_composition` (chỉ dùng đếm). Không có detail — giống prototype (row click mở modal generic no-op).
- **`archetype`** — ✅ **XONG (Giai đoạn 10).** Card grid (3 card Term Loan/Revolving/Conditional Obligation) + trang detail riêng thật sự (route `/archetype/:code`). Backend `FinancialObligationArchetypeController` join làm giàu: card có typeCount/elementCount/productCount (productCount = số pattern khác nhau qua `pattern_obligation_type`, join 2 chặng archetype→obligation_type→pattern_obligation_type). Detail có elementRows (foa_element+obligation_element+obligation_element_type, giữ đủ 3 trạng thái requirement req/pos/na) + typeRows (obligation_type theo archetype, kèm productCount riêng từng type). Bảng `financial_obligation_archetype` không có cột status — đã bỏ khỏi UI (không bịa).

### 2.5 Domain + Lifecycle & State — nav key `domain`, `lifecycle` — ✅ XONG (Giai đoạn 11)
Cả 2 đều là list đơn giản (không tab, không detail — prototype xác nhận `onClick` row chỉ mở modal generic). `lifecycle`: backend `LifecycleController` chuyển sang join làm giàu `stateCount` (đếm `lifecycle_state`). `domain`: `DomainController` mới, read-only thuần (entity `Domain` đã có từ Giai đoạn 8, cột `entity_count` là cột thật không cần đếm). Frontend `DomainPage`/`LifecyclePage` pixel-perfect. **Kế tiếp = 2.6 Ontology + Sysmap.**

### 2.6 Sơ đồ Ontology + Sơ đồ quan hệ tổng thể — nav key `ontology`, `sysmap` — ✅ XONG (Giai đoạn 12, HOÀN TẤT NHÓM NỀN TẢNG)
Khảo sát prototype xác nhận: KHÔNG nằm trong `isList` (cờ riêng `isOntology`/`isSysMap`) nhưng cũng KHÔNG phải SVG/canvas — cả hai là layout card/flex/grid tĩnh mô phỏng sơ đồ bằng box + icon mũi tên. Không cần backend mới, tổng hợp client-side từ API Lớp I đã có (obligation-types/families/compositions/elements/element-types cho `ontology`; cấu trúc/điều hướng tĩnh cho `sysmap`). Frontend `OntologyPage.tsx` (chuỗi ER 4 khái niệm + family/type selector + decomposition + vocab accordion) và `SysmapPage.tsx` (7 pipeline + 7 foundation + bảng 15 quan hệ FK thật). **Kế tiếp = 2.7 Wire builder Pattern về DB.**

### 2.7 WIRE builder Pattern về DB thật — ✅ XONG (Giai đoạn 13)
`ProductPatternController#GET /{code}/detail` mở rộng đúng shape đã đặc tả (assignedOTs kèm archetype, blocks join block+answer_slot+attribute+data_type, coverage tính ở BE tái dùng logic `ConstraintMatrixController#patternCoverage` thu hẹp về 1 pattern). Frontend `ProductPatternDetailPage` đọc thẳng field mới; **đã xóa hẳn `patternBuilderData.ts`** (không giữ lại phần nào — toàn bộ đều có nguồn DB thật). Coverage chỉ tính 1 nơi (BE); FE chỉ map verdict/inCanvas → nhãn/màu. Render verify bằng Playwright (mock đúng shape mới từ seed thật PT-001, cố ý thiếu 2 block để test nhánh "Tùy chọn"/"THIẾU") khớp bản cũ. **Kế tiếp = mục 3, Pipeline sản phẩm (Product Template).**

---

## 3. SAU NỀN TẢNG: PIPELINE SẢN PHẨM (DB-driven)

Thứ tự: **template → config → variant → catalog.** Mỗi màn: backend `pipeline/` + frontend pixel-perfect, **join hết vào thư viện nền tảng (API thật), không fix cứng.**

### 3.1 Product Template — nav key `template` — ✅ XONG (Giai đoạn 14)
Khảo sát prototype xác nhận **KHÔNG phải builder**: nav gọi `this.go('template')` (route list thường), khác `pattern` gọi `this.openBuilder('pattern')`. Click 1 dòng gọi `openTplWizard` nhưng hàm này luôn reset `tplStep:0` và không truyền id dòng nào — đây là wizard **TẠO MỚI chung** (state demo tĩnh `TPL_BLOCKS`/`tp.locked`/`tp.frames`), không phải xem chi tiết dòng đã click → cùng bản chất "modal generic no-op" như Obligation/Domain/Lifecycle. Quyết định: **chỉ dựng LIST**, không dựng wizard.

Backend package `pipeline`: `ProductTemplate` (PK `code`, `from_pattern_code`→product_pattern, `status`) + `CustomerSegment` (PK `code`, `name`, `audience`, `tier` nullable, `legal_requirement` nullable) + `TemplateSegment` (+`TemplateSegmentId` composite `[template_code, segment_code]`). `ProductTemplateController` (`/api/product-templates`, tự viết vì cần join) trả `{code,name,fromPatternCode,patternName,segmentCode,segmentName,status}`. Cột "CẬP NHẬT" của prototype **bỏ** (không có cột nguồn). Chưa tạo `TemplateFrame` entity (bảng `template_frame`) — không cần cho list, để dành nếu sau này cần.

Frontend `ProductTemplatePage.tsx` (list đơn giản, mẫu `DomainPage`): 5 cột Mã/Tên Template/Pattern nguồn/Đối tượng KH/Trạng thái, `filters=['Pattern nguồn','Đối tượng']`, không `onRowClick`.

Seed: TPL-001..006 (TPL-001/002←PT-001, TPL-003←PT-002, TPL-004←PT-006, TPL-005←PT-003, TPL-006←PT-005). Build + render verify OK (mock 6 dòng seed thật).

**Bổ sung — Product Template Detail (route `/template/:code`):** user chỉ ra prototype có wizard "Tạo Product Template" 3 bước (đối tượng KH → khóa Block → giá trị khung Answer Slot) và hỏi đã dựng chưa. Đọc lại bundler JS xác nhận `TPL_BLOCKS`/`state.tpl` là dữ liệu TĨNH 100% (không đổi theo dòng click) → quyết định (AskUserQuestion, chọn "Suy ra từ template_frame"): KHÔNG dựng wizard tạo-mới, mà dựng `/{code}/detail` = XEM 1 template thật, tái dùng layout 3 bước:
- Bước 1 (đối tượng KH): thật 100% (`template_segment`→`customer_segment`).
- Bước 2 (Block áp dụng): không có cột DB "khóa" theo template (đã kiểm cả `pattern_block.usage` — đó là field khác, ở cấp Pattern, seed toàn `'active'`) → suy ra active = block có ≥1 dòng `template_frame` cho template này.
- Bước 3 (giá trị khung): thật 100% từ `template_frame`, chỉ hiện block active; slot chưa có giá trị hiện "— chưa đặt —" (không dùng default tĩnh của prototype).

Backend: `TemplateFrame`(+`TemplateFrameId`) entity mới + mở rộng `ProductTemplateController#GET /{code}/detail` join `pattern_block`+`structure.Block`/`AnswerSlot`+`TemplateFrame`. Frontend `ProductTemplateDetailPage.tsx` (route đăng ký trước `/:view`), `ProductTemplatePage` thêm `onRowClick`. Verified Playwright TPL-003 (6/9 block active, giá trị khung khớp seed thật).

### 3.2 Product Config — nav key `config` — ✅ XONG (Giai đoạn 15, list + detail)
Cùng bài học Template: view `configForm` của prototype (chọn dòng nào cũng gọi `this.go('configForm')` không mang id, luôn hiện `configBase()` tĩnh của "CFG-0042") → dựng `/{code}/detail` = XEM fragment thật của từng config, KHÔNG copy state tĩnh. Backend `SelectorScope`(PK code, name, priority 0-3)/`ProductConfig`(PK code, name, fromTemplateCode, status)/`Fragment`(PK id auto, configCode, blockId, slotCode, scopeCode, scopeValue nullable, value, isWarning, validationMsg nullable). `ProductConfigController` list `{code,name,fromTemplateCode,templateName,fragmentCount,status}` (bỏ cột "NGƯỜI DUYỆT" — không có nguồn); detail gom fragment theo (block,slot) THẬT SỰ tồn tại, sắp theo `selector_scope.priority` tăng dần. Frontend `ProductConfigPage`(list) + `ProductConfigDetailPage`(trái: slot có fragment; phải: card fragment theo bối cảnh, cảnh báo nếu `isWarning`). Chỉ CFG-0042 có 15 fragment seed thật; 6 config còn lại hiện "chưa có fragment nào" (đúng thực trạng). Verified Playwright (đúng thứ tự ưu tiên default→time→place→people, đúng cảnh báo "Gần trần"). **Kế tiếp = mục 3.3, Product Variant.**

### 3.3 → 3.4 Variant / Catalog
- `product_variant` — nav `variant`.
- `product_catalog` + `catalog_listing` — nav `catalog`.
Trích markup từng màn (kiểm state tĩnh như Template/Config trước khi quyết định list-only hay list+detail); join vào block/attribute/pattern/template/config thật.

---

## 4. QUY TRÌNH BẮT BUỘC (nhắc lại — mục 7 PROJECT_STATUS)

code → `cd frontend && npm run build` (0 lỗi TS) → render Playwright (mock API = seed thật, SPA fallback, dist tuyệt đối) → view PNG so khớp prototype → đóng **zip trọn vẹn** → cập nhật PROJECT_STATUS + NEXT_WORK. Backend không compile được ở sandbox → kiểm cú pháp/ngoặc/import thủ công. Dùng `ListScreen`, `StatusChip`, `Icon`, bảng màu chuẩn. **Màn builder/biểu đồ không rút gọn thành detail thường.**

---

## 5. HẠNG MỤC NỢ — LÀM SAU CÙNG (đợt polish, KHÔNG xen giữa)

### 5.1 Business Intent — detail + KPI
Backend `BusinessIntentKpi`(+`Id` composite `[business_intent_id, sort_order]`; cột `metric`,`target`,`unit`) + repo `findByBusinessIntentIdOrderBySortOrder` + `/business-intents/{id}/detail` `{intent, kpis}`. Frontend `BusinessIntentDetailPage` + route `/businessintent/:id` + wire `onRowClick`. Seed: BI id=1 (3 KPI), id=6 (1 KPI).

### 5.2 ListScreen interactive
Wire search (lọc text) + filter dropdown thật; áp cho mọi màn list. (Tùy chọn đổi `rows` → `{cells, raw, onClick}`; nếu đổi cập nhật tất cả page.)

### 5.3 Khác
Loading/error states nhất quán; đóng gói Docker cuối; (tùy chọn) kéo-thả THẬT trong builder — hiện read-only nên không cần.

### 5.4 Attribute Usage screen + Create/Edit modal (mới, từ Giai đoạn 8)
Màn chi tiết "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant, Selector Scope values theo People/Place/Time, bảng where-used với số Template/Config/Variant) + modal tạo/sửa Attribute (field đổi theo Data Type). Cần `AttributeEnumValue` (Lớp II, chưa tạo) + backend Pipeline (`product_template`/`product_config`/`product_variant`) + `selector_scope`/`fragment` (Lớp II). Làm sau khi các phần đó có backend, để không lặp lại tình huống fix cứng của Pattern builder.

---

## 6. LỘ TRÌNH 18 MÀN (thứ tự thực thi MỚI)

Đã xong: dashboard, businessintent(list), intent(list+detail), **pattern(builder, đã WIRE về DB thật — Giai đoạn 13)**, **block(list + backend structure)**, **matrix(4-tab grid + backend governance)**, **attribute(list 3-tab + backend Domain/AttributeGroup/AttributeConstraint)**, **obligation(list 3-tab, join làm giàu ontology có sẵn)**, **archetype(card grid + detail)**, **domain(list)**, **lifecycle(list, join stateCount)**, **ontology(ER-chain+decomposition+vocab)**, **sysmap(pipeline+foundations+relations)**, **template(list + detail /template/:code, backend pipeline.ProductTemplate/CustomerSegment/TemplateSegment/TemplateFrame)**, **config(list + detail /config/:code, backend pipeline.ProductConfig/SelectorScope/Fragment)**. **NHÓM THƯ VIỆN NỀN TẢNG ĐÃ HOÀN TẤT, BUILDER PATTERN ĐÃ HẾT FIX CỨNG, PIPELINE ĐANG TIẾP TỤC.**

**NỀN TẢNG trước:**
1. ✅ **block** (Block & Answer Slot + data_type) — XONG (Giai đoạn 6)
2. ✅ **matrix** (constraint_matrix + matrix_cell) — XONG (Giai đoạn 7)
3. ✅ **attribute** (list 3-tab; backend Domain/AttributeGroup/AttributeConstraint) — XONG (Giai đoạn 8, chỉ màn list — Usage screen+modal hoãn, mục 5.4)
4. ✅ **obligation** (list 3-tab) — XONG (Giai đoạn 9). ✅ **archetype** (card grid + detail riêng) — XONG (Giai đoạn 10)
5. ✅ **domain** + **lifecycle** (list đơn giản) — XONG (Giai đoạn 11)
6. ✅ **ontology** + **sysmap** (biểu đồ, không backend mới) — XONG (Giai đoạn 12)
7. ✅ **WIRE builder Pattern về DB** (mục 2.7) — XONG (Giai đoạn 13). `patternBuilderData.ts` đã xóa.

**PIPELINE sau:**
8. ✅ **template** (list + detail, backend `pipeline.ProductTemplate`/`CustomerSegment`/`TemplateSegment`/`TemplateFrame`) — XONG (Giai đoạn 14). → 9. ✅ **config** (list + detail, backend `pipeline.ProductConfig`/`SelectorScope`/`Fragment`) — XONG (Giai đoạn 15). → 10. **variant** ← ĐANG TỚI → 11. **catalog**

**CÔNG CỤ / HỆ THỐNG / CUỐI:**
12. **release** (Quy trình phát hành), **activity** (Nhật ký hoạt động)
13. **simulation** (gần cuối — backend annuity + `/api/simulation/run`)
14. **ĐỢT POLISH CUỐI:** mục 5 (BI detail+KPI, ListScreen interactive, loading/error, Docker).

> Vì làm nền tảng trước: khi tới màn thư viện Block/Ma trận/Attribute là dựng luôn cả backend + frontend; tới Pipeline chỉ còn join API thật. Không còn fix cứng.

---

*Cập nhật: ✅ Hoàn thành **Product Config** (Giai đoạn 15, mục 3.2) — cả list VÀ detail (`/config/:code`). Cùng bài học Template: view `configForm` gốc của prototype dùng dữ liệu tĩnh (`configBase()`, không đổi theo dòng click) → dựng `/{code}/detail` là màn XEM fragment thật, gom theo Answer Slot, sắp theo `selector_scope.priority`. Backend 3 entity mới package `pipeline` (`SelectorScope`/`ProductConfig`/`Fragment`). Verified Playwright (15 fragment thật CFG-0042, đúng thứ tự ưu tiên + cảnh báo). **Kế tiếp = mục 3.3, Product Variant.** Business Intent detail+KPI và ListScreen interactive vẫn để đợt polish cuối.*

*Ghi chú lịch sử: ✅ Hoàn thành **Product Template** (Giai đoạn 14, mục 3.1) — cả list VÀ detail (`/template/:code`). Wizard "Tạo Product Template" gốc của prototype là dữ liệu TĨNH 100% (không đổi theo dòng click) → dựng `/{code}/detail` là màn XEM 1 template thật (tái dùng layout 3 bước), suy ra "Block đang áp dụng" từ có/không có dòng `template_frame` thật. Backend 4 entity mới package `pipeline` (`ProductTemplate`/`CustomerSegment`/`TemplateSegment`/`TemplateFrame`).*

*Ghi chú lịch sử: ✅ Hoàn thành **WIRE builder Pattern về DB thật** (Giai đoạn 13, mục 2.7) — `ProductPatternController#/{code}/detail` mở rộng join thật `block`/`answer_slot`/`attribute`/`data_type`/`constraint_matrix`/`matrix_cell`; **`patternBuilderData.ts` đã xóa hoàn toàn**, không còn field/dòng nào fix cứng trong toàn bộ nhóm thư viện nền tảng + builder Pattern.*

*Ghi chú lịch sử: ✅ Hoàn thành **Ontology + Sysmap** (Giai đoạn 12, mục 2.6) — **HOÀN TẤT TOÀN BỘ NHÓM THƯ VIỆN NỀN TẢNG.** Cả 2 màn là card/flex/grid tĩnh (không SVG/canvas), không cần backend mới — tổng hợp client-side từ API Lớp I đã có.*

*Ghi chú lịch sử: ✅ Hoàn thành **Domain + Lifecycle & State** (Giai đoạn 11, mục 2.5) — backend `DomainController` (read-only thuần) + `LifecycleController` (join stateCount) + frontend `DomainPage`/`LifecyclePage` (list đơn giản, không tab/detail), verified.*

*Ghi chú lịch sử: ✅ Hoàn thành **Financial Obligation Archetype** (Giai đoạn 10, phần 2 mục 2.4 — hoàn tất mục 2.4) — backend `FinancialObligationArchetypeController` join làm giàu (typeCount/elementCount/productCount) + frontend `ArchetypePage` (card grid) + `ArchetypeDetailPage` (route `/archetype/:code`), verified.*

*Ghi chú lịch sử: ✅ Hoàn thành **Obligation Library** (Giai đoạn 9, phần 1 mục 2.4) — backend package `ontology` (3 controller chuyển sang tự viết join làm giàu) + frontend ObligationPage 3-tab pixel-perfect, verified.*

*Ghi chú lịch sử: ✅ Hoàn thành **Attribute** (Giai đoạn 8, CHỈ MÀN LIST) — backend package `attribute` (Domain/AttributeGroup/AttributeConstraint mới + AttributeController/AttributeGroupController/structure.DataTypeController join làm giàu) + frontend AttributePage 3-tab pixel-perfect, verified. Màn "Attribute Usage" (lineage) + modal tạo/sửa hoãn — ghi nợ mục 5.4 (chờ Pipeline + fragment/selector_scope).*

*Ghi chú lịch sử: ✅ Hoàn thành **Ma trận ràng buộc** (Giai đoạn 7) — backend package `governance` + frontend MatrixPage 4-tab pixel-perfect, verified. Zip `product-factory-phase7-matrix.zip`.*
