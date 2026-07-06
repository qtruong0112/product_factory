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
- **attribute (list 3-tab)** — ✅ **XONG (Giai đoạn 8).** Backend package `attribute`: `Domain`/`AttributeGroup`/`AttributeConstraint` (entity mới); `AttributeController`/`AttributeGroupController` (mới) + `structure/DataTypeController` chuyển sang tự viết Page<Map> join làm giàu (dataTypeName, usedInSlots từ answer_slot, constraintSummary từ attribute_constraint, domainName, attributeCount). Frontend `AttributePage` 3-tab (Attribute/Attribute Group/Data Type) dùng chung `ListScreen` + tab bar trích style `MatrixPage`. Cột "Mô tả"/"Ví dụ giá trị" bị bỏ ở tab Group/Data Type (bảng DB không có cột nguồn). Build + render verify OK (mock data từ seed thật: 31 attribute/12 group/9 data type). **Detail "Attribute Usage" (lineage) — ✅ XONG (Giai đoạn 29)**, xem mục 5.4.

Backend đã có sẵn (đừng làm trùng):
- **Lớp I Ontology (9 bảng): backend XONG** (Giai đoạn 1) — obligation_element_type, obligation_element, financial_obligation_archetype, foa_element, obligation_family, obligation_type, obligation_type_composition, lifecycle, lifecycle_state. **Chỉ thiếu frontend pixel-perfect** (đang dùng DataTable tạm).
- **`attribute`**: entity/repo/controller đã có (`/api/attributes`, đã join làm giàu ở Giai đoạn 8). `domain`/`attribute_group`/`attribute_constraint` cũng đã có (Giai đoạn 8).

`attribute_enum_value` nay đã có entity (Giai đoạn 29, mục 5.4); `selector_scope`/`fragment` đã có backend từ Giai đoạn 15/21.

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

### 3.2 Product Config — nav key `config` — ✅ XONG (Giai đoạn 15, list + detail) → **VIẾT LẠI (Giai đoạn 21)**
Bản Giai đoạn 15 ban đầu dựng list+detail đơn giản (trái: slot có fragment; phải: card theo bối cảnh) — nhưng đây là RÚT GỌN sai so với prototype thật: `isConfigForm` (bundler dòng 686-837) là builder 3 cột đầy đủ ("Cấu hình Product Config") gồm sidebar cây Block/Answer Slot theo tỉ lệ bắt buộc, 2 banner (Answer Slot bắt buộc thiếu + cảnh báo ràng buộc Attribute), card chi tiết slot, form "Thêm Config Fragment", bảng fragment, và panel **"Xem trước Resolution"** (chọn People/Place/Time → tính fragment thắng theo ưu tiên). User đối chiếu trực tiếp file prototype gốc và yêu cầu sửa giống 100% + backend map đúng — xem Giai đoạn 21 (mục 4 PROJECT_STATUS) để biết đầy đủ: sửa lỗi seed `from_template_code` CFG-0042 (TPL-001→TPL-003), bổ sung 3 fragment mặc định thiếu (interest_calc/capacity_range/asset_valuation, dùng đúng `default_value` có sẵn), viết lại toàn bộ `ProductConfigController#detail` + `ProductConfigDetailPage.tsx`. **Kế tiếp = mục 3.3, Product Variant** (không đổi, đã xong từ trước).

### 3.3 Product Variant — nav key `variant` — ✅ XONG (Giai đoạn 16, list only)
Khảo sát bundler JS xác nhận `variant` nằm trong `isList`, click dòng chỉ gọi `this.openCreate('variant')` chung (drawer tạo-mới tĩnh, không mang id) → chỉ dựng LIST, không có wizard/detail thật (giống Domain/Lifecycle/Obligation). Cột "Kênh" (App/Web/PGD) của prototype **không cần bỏ** — suy ra thật từ `catalog_listing.variant_code → product_catalog.channel` (distinct, join " · "; variant chưa niêm yết catalog nào hiện "—"). Backend package `pipeline`: `ProductVariant`(PK code, name, fromConfigCode, family/limitRange/displayRate/marketingContent nullable, status) + `ProductCatalog`(PK id auto, name, channel) + `CatalogListing`(+`CatalogListingId` composite `[catalog_id,variant_code]`, publishedDate nullable, status) — 2 entity sau tái dùng cho mục 3.4. `ProductVariantController` list `{code,name,fromConfigCode,configName,limitRange,displayRate,channels,status}`. Frontend `ProductVariantPage` (list đơn giản, mẫu `DomainPage`), không `onRowClick`. Verified Playwright (7 dòng variant thật, cột Kênh khớp tay tính từ seed `catalog_listing`). **Kế tiếp = mục 3.4, Product Catalog** (entity `ProductCatalog`/`CatalogListing` đã có sẵn).

### 3.4 Product Catalog — nav key `catalog` — ✅ XONG (Giai đoạn 17, card grid, HOÀN TẤT PIPELINE SẢN PHẨM)
Khảo sát bundler JS xác nhận `catalog` là **CARD GRID riêng** (`isCatalog`, KHÔNG nằm trong `isList`), không có wizard/detail nào (0 kết quả grep `catalogForm`/`openBuilder('catalog')`). Hàm `catalog()` tĩnh của prototype dựng 6 card từ field {name,variant,family,limit,rate,statusLabel,channels[]} — thực chất là join `product_variant` (family/limitRange/displayRate/status) với `catalog_listing→product_catalog.channel`, không phải cột riêng của `product_catalog`/`catalog_listing`. Không có "3 kệ App/Web/PGD" lồng nhau — chỉ 1 lưới phẳng, mỗi card = 1 variant đã niêm yết.

Không cần entity mới (`ProductCatalog`/`CatalogListing` đã dựng ở Giai đoạn 16 khi làm Variant). `ProductCatalogController` (`/api/product-catalogs`) lặp mọi `ProductVariant`, bỏ qua variant chưa niêm yết catalog nào (khớp đúng 6 card của prototype — VAR-106 không niêm yết nên không xuất hiện, không phải thiếu sót); mỗi card `{variantCode,name,family,limitRange,displayRate,channels,status}`.

Frontend `ProductCatalogPage.tsx` (card grid, mẫu `ArchetypePage`): header gradient cố định (chrome), 2 cột Hạn mức/Lãi suất, chip Family, dòng cuối Kênh + `StatusChip`. Không `onClick` (không có detail thật). Verified Playwright khớp verbatim 6 card thật từ seed.

**NHÓM PIPELINE SẢN PHẨM (mục 3) CHÍNH THỨC HOÀN TẤT.**

---

## 3B. CÔNG CỤ/HỆ THỐNG: Release + Activity Log — nav key `release`, `activity` — ✅ XONG (Giai đoạn 18)

Khảo sát bundler JS xác nhận:
- **`release`** (`isRelease`) — KHÔNG phải list, là **stepper 8 bước** (`releaseSteps()`/`releaseData()`) + view phụ **Sơ đồ Swimlane**. Dữ liệu 8 bước trong bundler là hardcode nhưng khớp gần như y hệt seed thật `maker_checker_process`(1 dòng, done_count=4)/`process_step`(8 dòng: title/role/step_status/input_desc/output_desc)/`process_step_checklist`(24 dòng, is_done thật). `desc`/`tip`/`icon` không có cột DB — giữ làm hằng số UI `STEP_META` ở backend vì là copy mô tả tĩnh của quy trình chuẩn công ty (không đổi theo instance), không phải dữ liệu nghiệp vụ.
- **`activity`** (`isList`) — list đơn giản, 8 dòng hardcode khớp y hệt seed thật `activity_log` (8 dòng). Cột "KÊNH" không có cột DB riêng nhưng **suy ra được thật** từ hậu tố `"· kênh X"` luôn có trong `detail` (regex, khớp đúng 8/8 dòng seed) — không bịa. Footer "trên 1.284 hoạt động" của prototype là số bịa → bỏ, dùng COUNT thật (8). Cột "HÀNH ĐỘNG" của prototype là câu diễn giải ghép động từ+đối tượng — map lại `action` code (`create/update/approve/submit_review/publish/retire/assign/sync`) sang động từ tiếng Việt qua `ACTION_LABEL`. Click dòng nào cũng mở modal export tĩnh giống nhau (`openCreate('activity')`) — không phải detail thật → không làm `onRowClick`.

Backend:
- Package `release` (Lớp IV — Governance): `MakerCheckerProcess`(PK id, variantCode nullable, productName, doneCount) + `ProcessStep`(+`ProcessStepId` composite `[process_id, step_no]`: title, role, stepStatus, inputDesc/outputDesc nullable) + `ProcessStepChecklist`(+`ProcessStepChecklistId` composite `[process_id, step_no, sort_order]`: item, done). `ReleaseProcessController` (`/api/release-processes`, `/{id}/detail`) trả process + 8 step (kèm STEP_META tĩnh desc/tip/icon/nav) + checklist thật.
- Package `activity`: `ActivityLog`(PK id, occurredAt, actor, action, entityType, entityCode nullable, detail nullable). `ActivityLogController` (`/api/activity-logs`) parse `channel` bằng regex `"kênh\s+(\S+)"` trên `detail`, map `actionLabel`, format `occurredAtLabel` (`dd/MM HH:mm`).

Frontend:
- `ReleasePage.tsx`: banner gradient (product từ `maker_checker_process`), progress bar thật (`doneCount/totalSteps`), 2 tab (Hướng dẫn từng bước / Sơ đồ Swimlane). Stepper: timeline trái (8 bước, status thật từ `step_status`) + panel chi tiết phải (desc/input/output/checklist thật/tip, nút "Mở màn liên quan →" điều hướng React Router tới nav key thật nếu có — vd `/config`,`/catalog`; nút "Hoàn thành bước"/"Mở lại bước" giữ giao diện, no-op, tooltip "read-only"). Swimlane: CSS Grid (lane=vai trò × cột=bước, không dùng absolute-position canvas như prototype nhưng giữ đúng ý đồ hình — không rút gọn thành list thường), click node quay lại stepper.
- `ActivityPage.tsx`: dùng `ListScreen` chung, 5 cột Thời gian/Actor/Hành động/Đối tượng/Kênh, filters `['Actor','Loại','Kênh']`, actionLabel "Xuất nhật ký". Không `onRowClick`.
- `main.tsx`: thêm `release`/`activity` vào `CUSTOM` map (không cần Route mới — không có `/:id` trong URL).

Verified Playwright (mock đúng shape từ seed thật): stepper hiện đúng 4/8 done + bước 5 current + checklist đúng is_done seed; swimlane đúng lane/cột/màu trạng thái; activity list đúng 8/8 dòng, kênh Web/API khớp seed. **Kế tiếp = mục 3C, Simulation Engine.**

---

## 3C. Simulation Engine — nav key `simulation` — ✅ XONG (Giai đoạn 19, phần 10% CÓ TÍNH TOÁN)

Khảo sát bundler JS xác nhận `isSimulation` là **form tham số (trái) + panel kết quả realtime (phải)**, KHÔNG phải list. Bundler tính bằng JS thuần `simData()`/`annuity()` (không gọi API) nhưng công thức khớp chính xác seed thật (`simulation_scenario` id=1 CFG-0042/VAR-101: 30tr/18 tháng/1.5%/tháng → PMT 1.914.173đ, khớp seed `monthly_payment`).

**Quyết định kiến trúc:** đây là phần 10% DUY NHẤT có tính toán thật (CLAUDE.md mục 2, PROJECT_STATUS mục 2.2) — nút "Chạy mô phỏng" gọi THẬT `POST /api/simulation/run` (khác mọi nút CUD khác trong dự án luôn no-op). Endpoint này **không ghi DB** — chỉ nhận tham số, tính, trả kết quả.

Backend package mới `simulation` (Lớp IV):
- `SimulationScenario`/`SimulationScheduleRow`(+Id) — entity read-only chỉ dùng để nạp state ban đầu từ kịch bản mẫu thật (`GET /api/simulation/default` — 1 dòng scenario + 18 dòng schedule seed).
- `SimulationRequest` (DTO): amount/months/baseRatePct/assetValue/segmentCode/startDate/appraisalFee/periodicFeePct/graceMonths + 3 bộ toggle tình huống (penalty/prepay/early — không có cột lưu trong `simulation_scenario`, chỉ ảnh hưởng runtime, đúng bản chất "mô phỏng").
- `SimulationEngine` (thuần Java, không phụ thuộc Spring/DB): cổng lại công thức annuity của bundler — PMT dư nợ giảm dần, ân hạn (grace: kỳ chỉ trả lãi+phí, PMT tính lại trên số kỳ còn lại), trả bớt gốc (tái tính PMT phần dư), tất toán sớm (trả hết dư nợ + % phạt, dừng lịch), phạt trễ hạn (`PMT×(số ngày trễ/30)×lãi×1.5`). Điều chỉnh lãi theo tier (`standard`=0/`loyalty`=−0.5/`vip`=−0.3, sàn 0.3%/tháng) — khớp đúng tên hiển thị thật `customer_segment.name` ("Thân thiết (−0,5%/tháng)"), không bịa. **Tổng phải trả = lịch trả nợ + phí thẩm định 1 lần** — khớp đúng seed `total_payment` (35.400.634 = 34.900.634 + 500.000 phí thẩm định, phát hiện qua verify số không khớp lúc đầu, đã sửa).
- `SimulationController` (`/api/simulation`): `GET /default` (thật, đọc seed) + `POST /run` (tính, không ghi DB). Tra `tier` qua `pipeline.CustomerSegmentRepository` (tái dùng, không tạo entity trùng).

Frontend `pages/SimulationPage.tsx`: cột trái form (slider số tiền/kỳ hạn/lãi/tài sản/phí, chọn phân khúc, ngày giải ngân, 3 toggle tình huống có sub-input) + nút "Chạy mô phỏng" (gọi POST thật) + "Ghim phương án" (lưu snapshot local, tối đa 3, hiện bảng so sánh A/B/C/D); cột phải: 8 KPI card, khối "Kiểm tra ràng buộc" (verdict Hợp lệ/Không hợp lệ + 4 check), bảng lịch trả nợ chi tiết từng kỳ. Nút "Xuất CSV"/"Xuất PDF" giữ giao diện, no-op tooltip "read-only" (ngoài phạm vi tính toán cốt lõi).

Build 0 lỗi TS. Verified Playwright: mock JS annuity y hệt seed → khớp chính xác PMT 1.914.173đ/tổng lãi 4.455.122đ/tổng phải trả 35.400.634đ/LTV 66,67%/18 dòng lịch trả nợ; thử tăng số tiền vay lên 40tr → LTV nhảy lên 88,89% và verdict chuyển đúng "Không hợp lệ" (check LTV≤80% chuyển ✗). **Kế tiếp = đợt polish cuối (mục 5).**

---

## 4. QUY TRÌNH BẮT BUỘC (nhắc lại — mục 7 PROJECT_STATUS)

code → `cd frontend && npm run build` (0 lỗi TS) → render Playwright (mock API = seed thật, SPA fallback, dist tuyệt đối) → view PNG so khớp prototype → đóng **zip trọn vẹn** → cập nhật PROJECT_STATUS + NEXT_WORK. Backend không compile được ở sandbox → kiểm cú pháp/ngoặc/import thủ công. Dùng `ListScreen`, `StatusChip`, `Icon`, bảng màu chuẩn. **Màn builder/biểu đồ không rút gọn thành detail thường.**

---

## 5. HẠNG MỤC NỢ — LÀM SAU CÙNG (đợt polish, KHÔNG xen giữa)

### 5.1 Business Intent — detail + KPI — ✅ XONG (Giai đoạn 20)
Backend `BusinessIntentKpi`(+`BusinessIntentKpiId` composite `[business_intent_id, sort_order]`; cột `metric`,`target`,`unit`) + repo `findByBusinessIntentIdOrderBySortOrder` + `BusinessIntentController#/{id}/detail` trả `{intent, kpis}` (không extends thêm, chỉ thêm 1 `@GetMapping` cạnh `ReadOnlyController` sẵn có). Frontend `BusinessIntentDetailPage.tsx` (mẫu `ProductIntentDetailPage`, header gradient + info card + KPI card) + route `/businessintent/:id` (đăng ký trước `/:view`) + `BusinessIntentPage` thêm `onRowClick`. Không có markup prototype cho detail này (row click gốc chỉ mở modal "Tạo Business Intent" chung) — dựng mới theo đúng quyết định nợ đã chốt, dữ liệu 100% thật. Verified Playwright: BI-01 hiện đúng 3 KPI thật (Dư nợ giải ngân mới/Số hợp đồng/Tỷ lệ NPL, khớp seed).

### 5.2 ListScreen interactive — ✅ XONG (Giai đoạn 20)
`components/ListScreen.tsx` giờ tự lọc search + filter dropdown THẬT, hoàn toàn client-side, **không cần đổi signature `rows: ReactNode[][]` hay sửa bất kỳ page nào đang gọi nó** (khác phương án "đổi rows → {cells,raw,onClick}" từng cân nhắc — tránh phải sửa lại ~20 page). Cơ chế: `extractText(node)` đệ quy trích text từ cell React đã dựng (ưu tiên `props.children`; nếu là component tùy biến không có children — như `StatusChip`/chip label riêng — fallback đọc `props.status` (dịch qua `STATUS_LABELS` export từ `StatusChip.tsx`) hoặc `props.label`/`props.text`). Search: substring không phân biệt hoa/thường + bỏ dấu (NFD strip). Filter: `guessColumnIndex(filterLabel, columns)` đoán cột tương ứng bằng so khớp tên (label filter chứa/được chứa trong label cột) — không cần page khai báo thêm; dropdown liệt kê giá trị PHÂN BIỆT thật từ cột đó, chọn nhiều, có "Xóa lọc". Verified Playwright trên `BlockPage`: search "lãi" → còn đúng 1/4 dòng; filter "Trạng thái" chọn "Nháp" → còn đúng 1/4 dòng khớp.

### 5.3 Khác
Loading/error states nhất quán; đóng gói Docker cuối; (tùy chọn) kéo-thả THẬT trong builder — hiện read-only nên không cần.

### 5.4 Attribute Usage screen — ✅ XONG (Giai đoạn 29)
Màn chi tiết "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant, Selector Scope values theo People/Place/Time, bảng where-used) — route `/attribute/:code`. Backend `AttributeEnumValue` entity mới + `TemplateFrameRepository`/`FragmentRepository.findByBlockIdAndSlotCode` + `ProductVariantRepository.findByFromConfigCodeIn` + `AttributeUsageService`/`AttributeUsageController` (`GET /api/attributes/{code}/usage`). Modal tạo/sửa Attribute KHÔNG làm — nút CUD toàn dự án là no-op theo quy ước chung (mục 7 PROJECT_STATUS), không có lý do làm ngoại lệ riêng cho Attribute. Trigger: user yêu cầu rà toàn bộ list→detail so với prototype gốc (Giai đoạn 29) — xác nhận đây là 1 trong 2 detail thật duy nhất còn thiếu (cùng với archetype đã xong từ trước).

---

## 6. LỘ TRÌNH 18 MÀN (thứ tự thực thi MỚI)

Đã xong: dashboard, businessintent(list), intent(list+detail), **pattern(builder, đã WIRE về DB thật — Giai đoạn 13)**, **block(list + backend structure)**, **matrix(4-tab grid + backend governance)**, **attribute(list 3-tab + backend Domain/AttributeGroup/AttributeConstraint)**, **obligation(list 3-tab, join làm giàu ontology có sẵn)**, **archetype(card grid + detail)**, **domain(list)**, **lifecycle(list, join stateCount)**, **ontology(ER-chain+decomposition+vocab)**, **sysmap(pipeline+foundations+relations)**, **template(list + detail /template/:code, backend pipeline.ProductTemplate/CustomerSegment/TemplateSegment/TemplateFrame)**, **config(builder Fragment+Resolution pixel-perfect /config/:code, backend pipeline.ProductConfig/SelectorScope/Fragment — VIẾT LẠI Giai đoạn 21)**, **variant(list, backend pipeline.ProductVariant/ProductCatalog/CatalogListing)**, **catalog(card grid, backend pipeline.ProductCatalogController)**, **release(stepper 8 bước + swimlane, backend release.MakerCheckerProcess/ProcessStep/ProcessStepChecklist)**, **activity(list, backend activity.ActivityLog)**, **simulation(form + annuity engine thật, backend simulation.SimulationEngine, POST /api/simulation/run)**. **TẤT CẢ 18 MÀN + SIMULATION ENGINE ĐÃ HOÀN TẤT — chỉ còn ĐỢT POLISH CUỐI (mục 5).**

**NỀN TẢNG trước:**
1. ✅ **block** (Block & Answer Slot + data_type) — XONG (Giai đoạn 6)
2. ✅ **matrix** (constraint_matrix + matrix_cell) — XONG (Giai đoạn 7)
3. ✅ **attribute** (list 3-tab; backend Domain/AttributeGroup/AttributeConstraint) — XONG (Giai đoạn 8). Detail "Attribute Usage" (lineage) — XONG (Giai đoạn 29, mục 5.4)
4. ✅ **obligation** (list 3-tab) — XONG (Giai đoạn 9). ✅ **archetype** (card grid + detail riêng) — XONG (Giai đoạn 10)
5. ✅ **domain** + **lifecycle** (list đơn giản) — XONG (Giai đoạn 11)
6. ✅ **ontology** + **sysmap** (biểu đồ, không backend mới) — XONG (Giai đoạn 12)
7. ✅ **WIRE builder Pattern về DB** (mục 2.7) — XONG (Giai đoạn 13). `patternBuilderData.ts` đã xóa.

**PIPELINE sau:**
8. ✅ **template** (list + detail, backend `pipeline.ProductTemplate`/`CustomerSegment`/`TemplateSegment`/`TemplateFrame`) — XONG (Giai đoạn 14). → 9. ✅ **config** (list + detail, backend `pipeline.ProductConfig`/`SelectorScope`/`Fragment`) — XONG (Giai đoạn 15). → 10. ✅ **variant** (list, backend `pipeline.ProductVariant`/`ProductCatalog`/`CatalogListing`) — XONG (Giai đoạn 16). → 11. ✅ **catalog** (card grid, backend `pipeline.ProductCatalogController`) — XONG (Giai đoạn 17). **PIPELINE SẢN PHẨM ĐÃ HOÀN TẤT.**

**CÔNG CỤ / HỆ THỐNG / CUỐI:**
12. ✅ **release** (stepper 8 bước + swimlane, backend `release.MakerCheckerProcess`/`ProcessStep`/`ProcessStepChecklist`) — XONG (Giai đoạn 18). ✅ **activity** (list, backend `activity.ActivityLog`) — XONG (Giai đoạn 18).
13. ✅ **simulation** (form tham số + annuity engine thật, backend `simulation.SimulationScenario`/`SimulationScheduleRow`/`SimulationEngine`, `POST /api/simulation/run`) — XONG (Giai đoạn 19). **TOÀN BỘ 18 MÀN + Simulation Engine ĐÃ HOÀN TẤT.**
14. **ĐỢT POLISH CUỐI:** ✅ **5.1 BI detail+KPI** — XONG (Giai đoạn 20). ✅ **5.2 ListScreen interactive** — XONG (Giai đoạn 20). ✅ **5.4 Attribute Usage** — XONG (Giai đoạn 29). Còn lại: **5.3 loading/error states + Docker (← ĐANG TỚI)**.

> Vì làm nền tảng trước: khi tới màn thư viện Block/Ma trận/Attribute là dựng luôn cả backend + frontend; tới Pipeline chỉ còn join API thật. Không còn fix cứng.

---

*Cập nhật: ✅ **Attribute Usage screen** (Giai đoạn 29, mục 5.4) theo yêu cầu user rà toàn bộ 20 nav key xem list→detail đã đủ chưa, so với `docs/Product Factory 5.1.html`. Khảo sát xác nhận bản gốc chỉ có đúng 2 detail thật theo bản ghi (`archetype`, `attribute`) — `attribute→attrUsage` là cái duy nhất còn thiếu (13 list khác không có detail trong bản gốc, giữ nguyên, không tự vẽ thêm). Backend mới: `AttributeEnumValue`(+Id), `TemplateFrameRepository`/`FragmentRepository.findByBlockIdAndSlotCode`, `ProductVariantRepository.findByFromConfigCodeIn`, `AttributeUsageService`/`AttributeUsageController` (`GET /api/attributes/{code}/usage`). Frontend: route `/attribute/:code` → `AttributeUsageDetailPage.tsx` (rail chọn attribute, 5-stage lineage, constraint, Selector Scope, where-used — trích đúng markup `attrUsageModel()` prototype, bỏ `desc` vì bảng `attribute` không có cột description). Verified curl `base_rate` (2 constraint/6 template/7 config đa scope có warning/7 variant) + `occupation` (case rỗng, không lỗi) + 404 case + Playwright 3 màn hình khớp bố cục gốc. Xem chi tiết PROJECT_STATUS.md Giai đoạn 29.*

*Cập nhật: ✅ **Audit toàn diện sample data** (Giai đoạn 22) theo yêu cầu user kiểm tra 7 khu vực (Business Intent, Product Intent, Product Pattern, Product Template, Product Config, Block & Answer Slot, Attribute) xem quan hệ nào thiếu dòng con. Query trực tiếp DB thật đếm theo FK (không chỉ đọc seed file) → phát hiện 5 lỗ hổng thật: `business_intent_kpi` 5/7 BI trống, `product_intent_element` 4/6 PI trống, `template_frame` 5/6 template trống, `fragment` 6/7 config trống (vi phạm bất biến DDL "mỗi config-slot phải có ≥1 fragment default"), `occupation` (DT_ENUM) 0 enum value. Bổ sung toàn bộ, dữ liệu suy diễn từ cấu trúc thật đã có (`obligation_type_composition`, `pattern_block`, `answer_slot.default_value`) — không bịa số. Verified `docker compose down -v && up --build` sạch + query lại DB xác nhận mọi FK có ≥1 dòng con + API `/product-configs/CFG-0021/detail` completeness từ 0%→100%. Xem chi tiết PROJECT_STATUS.md Giai đoạn 22.*

*Ghi chú lịch sử: ✅ **VIẾT LẠI Product Config** (Giai đoạn 21, mục 3.2) theo phản hồi trực tiếp của user (đối chiếu file prototype gốc, chỉ ra bản Giai đoạn 15 rút gọn sai). Trích đúng markup builder `isConfigForm` (3 cột: sidebar Block/Slot, 2 banner, card slot, form thêm fragment, bảng fragment, panel Resolution People/Place/Time). Sửa 1 lỗi seed thật (`product_config.from_template_code` CFG-0042: TPL-001→TPL-003, TPL-001 không có `template_frame` nào) + bổ sung 3 fragment mặc định thiếu (`interest_calc`/`capacity_range`/`asset_valuation`, dùng đúng `default_value` có sẵn — không bịa). Viết lại toàn bộ `ProductConfigController#detail` (block "đang áp dụng" suy từ chính `fragment` thật, không còn phụ thuộc `template_frame` một chiều) + `ProductConfigDetailPage.tsx`. Verified Playwright khớp gần như tuyệt đối ảnh chụp gốc user cung cấp (Resolution tính đúng người thắng theo ưu tiên People>Place>Time>Default). **Lưu ý: cần `docker compose down -v` trước khi `up --build` lại vì đã sửa `V2__seed.sql` sau khi Flyway đã chạy.** **Còn lại đợt polish cuối: 5.3 (loading/error, Docker) — mục 5.4 (Attribute Usage) vẫn hoãn theo quyết định gốc.*

*Ghi chú lịch sử: ✅ Hoàn thành **Business Intent detail+KPI + ListScreen interactive** (Giai đoạn 20, mục 5.1+5.2). BI detail: backend thêm `BusinessIntentKpi`(+Id) + `/business-intents/{id}/detail`, frontend `BusinessIntentDetailPage` (route `/businessintent/:id`, không có markup gốc trong prototype nên dựng mới theo mẫu `ProductIntentDetailPage`, dữ liệu KPI thật 100%). ListScreen interactive: search+filter chạy client-side qua `extractText()` (đệ quy cell React, fallback đọc `status`/`label` cho component tùy biến) — không cần sửa bất kỳ page nào khác, áp dụng ngay cho toàn bộ ~20 màn list hiện có.*

*Ghi chú lịch sử: ✅ Hoàn thành **Simulation Engine** (Giai đoạn 19, mục 3C) — **TOÀN BỘ 18 MÀN + phần 10% tính toán ĐÃ HOÀN TẤT.** Backend package mới `simulation` (`SimulationScenario`/`SimulationScheduleRow` đọc kịch bản mẫu thật + `SimulationEngine` thuần Java tính annuity dư nợ giảm dần, cổng lại công thức bundler: PMT, ân hạn, trả bớt gốc, tất toán sớm, phạt trễ hạn, điều chỉnh lãi theo tier). `POST /api/simulation/run` là nút DUY NHẤT trong dự án gọi tính toán thật (không no-op) — không ghi DB. Verified Playwright: khớp chính xác PMT/tổng lãi/tổng phải trả/LTV/18 dòng lịch trả nợ với seed thật (phát hiện+sửa 1 lỗi lúc verify: tổng phải trả thiếu phí thẩm định 1 lần); thử tăng số tiền vay → verdict "Không hợp lệ" đúng khi LTV vượt 80%. **Kế tiếp = đợt polish cuối (mục 5): Business Intent detail+KPI, ListScreen interactive, loading/error, Docker.***

*Ghi chú lịch sử: ✅ Hoàn thành **Release + Activity Log** (Giai đoạn 18, mục 3B). `release` là stepper 8 bước + swimlane (không phải list) — backend package mới `release` (`MakerCheckerProcess`/`ProcessStep`/`ProcessStepChecklist`) đọc thật `maker_checker_process`/`process_step`/`process_step_checklist` (khớp seed y hệt bundler hardcode: done=4/8, step_status/is_done thật). `activity` là list đơn giản — backend package mới `activity` (`ActivityLog`), cột KÊNH suy ra thật bằng regex trên `detail` (hậu tố "· kênh X", khớp 8/8 dòng), bỏ số bịa "1.284" dùng COUNT thật. Verified Playwright (stepper/swimlane/list đều khớp seed thật).*

*Ghi chú lịch sử: ✅ Hoàn thành **Product Catalog** (Giai đoạn 17, mục 3.4) — **HOÀN TẤT TOÀN BỘ NHÓM PIPELINE SẢN PHẨM.** `catalog` là card grid riêng (`isCatalog`, không phải `isList`/wizard), không cần entity mới (tái dùng `ProductCatalog`/`CatalogListing` từ Variant). `ProductCatalogController` join `product_variant`+`catalog_listing`→`product_catalog.channel`, chỉ hiện variant đã niêm yết ≥1 catalog. Verified Playwright khớp verbatim 6 card thật.*

*Ghi chú lịch sử: ✅ Hoàn thành **Product Variant** (Giai đoạn 16, mục 3.3) — màn LIST (xác nhận `variant` nằm trong `isList`, click dòng chỉ mở drawer tạo-mới chung). Phát hiện: cột "Kênh" của prototype suy ra được THẬT từ `catalog_listing→product_catalog.channel` (không cần bỏ, không fabricate). Backend 4 entity mới package `pipeline` (`ProductVariant`/`ProductCatalog`/`CatalogListing`+Id).*

*Ghi chú lịch sử: ✅ Hoàn thành **Product Config** (Giai đoạn 15, mục 3.2) — cả list VÀ detail (`/config/:code`). Cùng bài học Template: view `configForm` gốc của prototype dùng dữ liệu tĩnh (`configBase()`, không đổi theo dòng click) → dựng `/{code}/detail` là màn XEM fragment thật, gom theo Answer Slot, sắp theo `selector_scope.priority`. Backend 3 entity mới package `pipeline` (`SelectorScope`/`ProductConfig`/`Fragment`).*

*Ghi chú lịch sử: ✅ Hoàn thành **Product Template** (Giai đoạn 14, mục 3.1) — cả list VÀ detail (`/template/:code`). Wizard "Tạo Product Template" gốc của prototype là dữ liệu TĨNH 100% (không đổi theo dòng click) → dựng `/{code}/detail` là màn XEM 1 template thật (tái dùng layout 3 bước), suy ra "Block đang áp dụng" từ có/không có dòng `template_frame` thật. Backend 4 entity mới package `pipeline` (`ProductTemplate`/`CustomerSegment`/`TemplateSegment`/`TemplateFrame`).*

*Ghi chú lịch sử: ✅ Hoàn thành **WIRE builder Pattern về DB thật** (Giai đoạn 13, mục 2.7) — `ProductPatternController#/{code}/detail` mở rộng join thật `block`/`answer_slot`/`attribute`/`data_type`/`constraint_matrix`/`matrix_cell`; **`patternBuilderData.ts` đã xóa hoàn toàn**, không còn field/dòng nào fix cứng trong toàn bộ nhóm thư viện nền tảng + builder Pattern.*

*Ghi chú lịch sử: ✅ Hoàn thành **Ontology + Sysmap** (Giai đoạn 12, mục 2.6) — **HOÀN TẤT TOÀN BỘ NHÓM THƯ VIỆN NỀN TẢNG.** Cả 2 màn là card/flex/grid tĩnh (không SVG/canvas), không cần backend mới — tổng hợp client-side từ API Lớp I đã có.*

*Ghi chú lịch sử: ✅ Hoàn thành **Domain + Lifecycle & State** (Giai đoạn 11, mục 2.5) — backend `DomainController` (read-only thuần) + `LifecycleController` (join stateCount) + frontend `DomainPage`/`LifecyclePage` (list đơn giản, không tab/detail), verified.*

*Ghi chú lịch sử: ✅ Hoàn thành **Financial Obligation Archetype** (Giai đoạn 10, phần 2 mục 2.4 — hoàn tất mục 2.4) — backend `FinancialObligationArchetypeController` join làm giàu (typeCount/elementCount/productCount) + frontend `ArchetypePage` (card grid) + `ArchetypeDetailPage` (route `/archetype/:code`), verified.*

*Ghi chú lịch sử: ✅ Hoàn thành **Obligation Library** (Giai đoạn 9, phần 1 mục 2.4) — backend package `ontology` (3 controller chuyển sang tự viết join làm giàu) + frontend ObligationPage 3-tab pixel-perfect, verified.*

*Ghi chú lịch sử: ✅ Hoàn thành **Attribute** (Giai đoạn 8, CHỈ MÀN LIST) — backend package `attribute` (Domain/AttributeGroup/AttributeConstraint mới + AttributeController/AttributeGroupController/structure.DataTypeController join làm giàu) + frontend AttributePage 3-tab pixel-perfect, verified. Màn "Attribute Usage" (lineage) + modal tạo/sửa hoãn — ghi nợ mục 5.4 (chờ Pipeline + fragment/selector_scope).*

*Ghi chú lịch sử: ✅ Hoàn thành **Ma trận ràng buộc** (Giai đoạn 7) — backend package `governance` + frontend MatrixPage 4-tab pixel-perfect, verified. Zip `product-factory-phase7-matrix.zip`.*
