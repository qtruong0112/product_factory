# PROJECT_STATUS.md — Product Factory 5.1 Web

> **Mục đích file này:** Tài liệu bàn giao kỹ thuật. Một đoạn chat hoàn toàn mới (không có lịch sử) đọc file này là đủ để tiếp tục code chính xác, không cần hỏi lại hay đoán mò. Dán nguyên file này làm ngữ cảnh mở đầu.
>
> **QUY TẮC VÀNG:** Code là chuẩn. Nếu tài liệu (MD) lệch với code thật trong zip → tin code. Trước khi làm gì, giải nén zip mới nhất và quét code.

---

## 1. TỔNG QUAN DỰ ÁN

**Mục tiêu:** Dựng lại web app "Product Factory 5.1" — hệ thống cấu hình sản phẩm cho vay (Lending Product Factory, phong cách F88) — từ file prototype HTML tĩnh (`Product_Factory_5_1.html`, bundled React app) thành hệ thống thật có backend + frontend + database.

**Bản chất hệ thống:** 90% là **read-only data explorer** (chỉ xem dữ liệu, KHÔNG tạo/sửa/xóa), 10% còn lại là **Simulation Engine** (phần duy nhất có logic tính toán — annuity, LTV, so sánh phương án).

**Stack (đã chốt, không đổi):**
- **Backend:** Java 21 + Spring Boot 3.3.4 + Maven. Package gốc `com.f88.productfactory`.
- **Frontend:** React 18 + Vite + TypeScript. Font `Be Vietnam Pro`.
- **Database:** PostgreSQL 16, schema nạp bằng Flyway.
- **Đóng gói:** Docker Compose (db + backend + frontend), chạy `docker compose up --build`.

**Nguồn dữ liệu có sẵn (KHÔNG tự bịa):**
- `Product_Factory.sql` = DDL PostgreSQL **43 bảng, 50 FK, 14 ENUM**. Đây là `V1__schema.sql`.
- `Product_Factory_Sample_Data.sql` (a.k.a. seed) = seed thật trích từ prototype. Đây là `V2__seed.sql` (bỏ `BEGIN;`/`COMMIT;` — xem mục 8).
- `product_factory_canonical_v3_semantic.json` = canonical schema logical (nguồn sự thật cấu trúc 43 bảng). **Lấy tên cột chính xác từ đây hoặc từ DDL, không đoán.**
- `Product_Factory_5_1.html` = prototype UI gốc (bundled React; markup + data nằm trong chuỗi HTML đã render — xem mục 8.5).

**43 bảng chia 4 lớp (`x-layer`):**
- **Lớp I — Ontology (9):** obligation_element_type, obligation_element, financial_obligation_archetype, foa_element, obligation_family, obligation_type, obligation_type_composition, lifecycle, lifecycle_state.
- **Lớp II — Cấu trúc dữ liệu (10):** domain, data_type, attribute_group, attribute, attribute_constraint, attribute_enum_value, block, answer_slot, selector_scope, fragment.
- **Lớp III — Pipeline (15):** business_intent, business_intent_kpi, customer_segment, product_intent, product_intent_element, product_pattern, pattern_block, pattern_obligation_type, product_template, template_segment, template_frame, product_config, product_variant, product_catalog, catalog_listing.
- **Lớp IV — Quản trị (9):** constraint_matrix, matrix_cell, maker_checker_process, process_step, process_step_checklist, simulation_scenario, simulation_schedule_row, version_entry, activity_log.

---

## 2. PHẠM VI & QUYẾT ĐỊNH ĐÃ CHỐT (KHÔNG hỏi lại)

1. **Read-only 90%:** Web chỉ đọc. Không CUD. Backend chỉ `GET`. Nút "Tạo/Sửa/Xóa/Gửi duyệt/Lưu nháp…" trong UI **giữ nguyên giao diện** (để giống prototype) nhưng **không thao tác dữ liệu** — kèm tooltip "Hệ thống read-only". (Với nút "Tạo mới" ở list dùng kiểu mờ opacity .55; với các nút trong builder giữ full-opacity để pixel-perfect nhưng no-op.)
2. **Simulation Engine** = phần 10% có tính toán, logic ở **BACKEND**. `POST /api/simulation/run` nhận tham số, tính, trả kết quả — KHÔNG ghi DB. Để **gần cuối** (cần Config/Variant sẵn sàng). Công thức annuity đã verify khớp seed 18 kỳ.
3. **Frontend giống prototype 100% pixel-perfect** — dựng lại bằng React với **inline style trích nguyên** từ markup gốc, KHÔNG chế lại. **QUAN TRỌNG:** một số màn KHÔNG phải "trang chi tiết đơn giản" mà là **màn phức tạp riêng** trong prototype (vd Product Pattern = **"Trình dựng Product Pattern"** builder 3 cột). Phải trích đúng markup builder, không tự rút gọn. (Bài học: bản đầu của Pattern từng bị làm rút gọn thành detail thường → phải làm lại thành builder.)
4. **Triển khai theo pipeline, từng màn trọn vẹn** (vertical slice: backend API + frontend). Thứ tự: Business Intent → Product Intent → Pattern → Template → Config → Variant → Catalog → thư viện nền tảng → Lớp IV → Simulation.
5. **Data hiển thị là DATA THẬT từ DB qua API** (trừ Dashboard KPI/pipeline là số tổng hợp không map 1 bảng). **KHÔNG fix cứng** giá trị nghiệp vụ trong frontend nếu DB có nguồn. (Xem mục 8.6 — hiện builder Pattern còn 1 phần fix cứng cần wire, đã ghi rõ.)
6. **Quy trình mỗi màn:** code → `cd frontend && npm run build` (0 lỗi TS) → render Playwright → so khớp prototype → mới giao. KHÔNG giao code chưa render kiểm chứng.
7. **Mỗi lần giao = 1 zip TRỌN VẸN** (không phải bản vá). User giải nén đè thư mục cũ. Zip sau chứa toàn bộ zip trước + phần mới.

---

## 3. KIẾN TRÚC HỆ THỐNG

### Backend (Spring Boot)
- **Package theo lớp:** `com.f88.productfactory.{ontology|pipeline|attribute|structure|governance|common|config}`. Lớp I→`ontology`, Lớp III→`pipeline`. Lớp II hiện: `attribute` (từ Giai đoạn 0). **Khi làm block/answer_slot (Lớp II) → package `structure`; constraint_matrix/matrix_cell (Lớp IV) → package `governance`** (xem mục 6.A).
- **Pattern mỗi bảng = 3 file:** `<Entity>.java` (JPA entity read-only, chỉ getter), `<Entity>Repository.java` (extends `JpaRepository<Entity, IdType>`), `<Entity>Controller.java`.
- **Base `common/ReadOnlyController<T, ID>`:** sẵn `GET /` (list phân trang `Page<T>`) và `GET /{id}` (detail theo PK). Controller con override `repository()` + `@RequestMapping("/api/<kebab-plural>")`. Dùng cho bảng read-only **thuần**.
  - **Ngoại lệ có căn cứ:** khi list cần **làm giàu bằng join** (vd Product Pattern cần `blockCount` + tên OT Primary), controller **KHÔNG extends** base mà tự viết `@GetMapping` list trả `Page<Map<String,Object>>` + `@GetMapping("/{id}")` + `@GetMapping("/{id}/detail")`. (Tránh xung đột kiểu trả về generic khi override `list`.)
- **Khóa ghép:** `@IdClass(<Entity>Id.class)`; Id class `implements Serializable` + equals/hashCode. Đã có: `FoaElementId`, `ObligationTypeCompositionId`, `LifecycleStateId`, `ProductIntentElementId`, `PatternBlockId`, `PatternObligationTypeId`.
- **Endpoint detail mở rộng:** `@GetMapping("/{id}/detail")` trả `Map<String,Object>` gồm entity chính + list con + tên join. Ví dụ: ProductIntent `{intent, businessIntentName, archetypeName, elements}`; ProductPattern `{pattern, productIntentName, blocks, obligationTypes}`.
- **`common/GlobalExceptionHandler`** (`@RestControllerAdvice`) + **`config/WebConfig`** (CORS `/api/**`).

### Frontend (React + Vite + TS)
- **Entry `main.tsx`:** `BrowserRouter`. `CUSTOM: Record<string, ReactNode>` map view-key → page pixel-perfect. Route `/:view` → `GenericView` (CUSTOM → render; else fallback `DataTable`; else "chưa dựng"). **Route detail đặt TRƯỚC `/:view`.** Hiện có: `/intent/:id`, `/pattern/:code`.
- **`components/Layout.tsx`:** Sidebar (gradient `#0B3B2E→#082A20`) + Topbar. **Đã sửa:** `active = segment ĐẦU của path` (để trang detail vẫn highlight đúng nav + crumb). `title` = `DETAIL_TITLES[active]` nếu là trang detail (vd `pattern → 'Trình dựng Product Pattern'`), ngược lại `VIEW_TITLES[active][0]`.
- **`nav.ts`:** `NAV` (5 nhóm) + `VIEW_TITLES`. **nav key ≠ resource path** (xem 8.7).
- **`icons.ts` + `components/Icon.tsx`:** 35 icon. **Lưu ý: KHÔNG có icon `lock`/`history`/`grid`** — cần thì dùng icon khác hoặc thể hiện bằng màu/nhãn (đã làm với `usage=locked` → tô xám + nhãn "locked").
- **`components/ListScreen.tsx`:** MÀN DANH SÁCH CHUNG. **Trạng thái THẬT (đọc code!):** props `columns: ListColumn[]`, `rows: ReactNode[][]`, `searchPlaceholder`, `filters?: string[]`, `actionLabel`, `onRowClick`. **Search + filter hiện là TĨNH** (chỉ giao diện, chưa lọc). Row = `ReactNode[]` (mảng cell), CHƯA có `{cells, raw, onClick}`. → interactive là NỢ (mục 6.C).
- **`components/StatusChip.tsx`:** `<StatusChip status/>` + `STATUS_COLORS` + `STATUS_LABELS`. draft/review/approved/published/active/retired → Nháp/Chờ duyệt/Đã duyệt/Đã xuất bản/Hoạt động/Thu hồi.
- **`api/client.ts`:** `getList<T>(resource,page?,size?)→Page<T>`; `getById`; `getDetail<T>(resource,id,suffix='detail')`. Base `/api`. List page size dùng 200.
- **`patternBuilderData.ts`** (MỚI, phase 5): **catalog TĨNH** của builder (thư viện block + answer slots + attribute names + ma trận OT×Block) — trích nguyên từ prototype. ⚠ **Đây là fix cứng tạm thời, có nguồn thật trong DB, CẦN WIRE** (xem 8.6 + 6.A).

### Database
- Schema `V1__schema.sql` (43 bảng). Seed `V2__seed.sql`. Flyway auto-nạp. DB `product_factory`, user `pf_user`, pass `pf_pass`.

---

## 4. VIỆC ĐÃ HOÀN THÀNH

### Giai đoạn 0 — Khung dự án (verified)
Cấu trúc `product-factory/{backend,frontend}` + docker-compose + README. Backend base: `ProductFactoryApplication`, `application.yml` (Flyway + JPA validate + CORS), `WebConfig`, `ReadOnlyController`, `GlobalExceptionHandler`, `pom.xml`. Flyway V1+V2 nạp thật 43/43 bảng. Docker (backend maven→JRE, frontend node→nginx SPA fallback + proxy `/api`). Vertical slice mẫu `attribute/`.

### Giai đoạn 1 — Lớp I Ontology (9 bảng, backend API, verified)
Package `ontology/`: ObligationElementType, ObligationElement, FinancialObligationArchetype, FoaElement(+Id), ObligationFamily, ObligationType, ObligationTypeComposition(+Id), Lifecycle, LifecycleState(+Id). Frontend tạm dùng `DataTable`.

### Giai đoạn 2 — Layout + Dashboard (PIXEL-PERFECT, verified)
`Icon`+`icons.ts` (35), `nav.ts`, `Layout`, `DashboardPage` (5 KPI + pipeline 6 cột + feed + phân bố family; số tổng hợp trích prototype), `index.html` (font, animation).

### Giai đoạn 3 — Business Intent (list, PIXEL-PERFECT, verified)
Backend `pipeline/`: `BusinessIntent` (entity/repo/controller). `/api/business-intents` (list + detail chuẩn).
Frontend: `ListScreen`, `StatusChip`, `BusinessIntentPage` (danh sách 7 BI).
⚠ **ĐÍNH CHÍNH so với bản MD cũ:** BusinessIntent **CHƯA có** detail page + KPI. **KHÔNG tồn tại** `BusinessIntentKpi` (entity/repo), **không** có `BusinessIntentDetailPage`, **không** có endpoint `/business-intents/{id}/detail`. Đây là NỢ (mục 6.B). (Bản MD trước ghi nhầm là đã xong — code là chuẩn.)

### Giai đoạn 4 — Product Intent (list + detail + backend, verified)
Backend `pipeline/`: `ProductIntent` (entity/repo), `ProductIntentElement`(+`ProductIntentElementId`), `ProductIntentController` (`/api/product-intents` + `/{id}/detail` trả `{intent, businessIntentName, archetypeName, elements}`).
Frontend: `ProductIntentPage` (ListScreen, cột Mã/Tên/Archetype/Obligation nature/Trạng thái), `ProductIntentDetailPage` (header gradient + info card + element nền). Route `/intent/:id`. CUSTOM key `intent`.

### Giai đoạn 5 — Product Pattern (backend + **BUILDER pixel-perfect**, verified)
**Backend `pipeline/`:**
- `ProductPattern` (PK **String `code`**), `PatternBlock`(+`PatternBlockId`, có `usage` enum active/locked), `PatternObligationType`(+`PatternObligationTypeId`, có `role` enum Primary/Support).
- Repos: `ProductPatternRepository`; `PatternBlockRepository` (`findByPatternCodeOrderByPosition`, `countByPatternCode`); `PatternObligationTypeRepository` (`findByPatternCode`).
- `ProductPatternController` (`@RequestMapping("/api/product-patterns")`, **KHÔNG extends base** vì list làm giàu):
  - `GET /` → `Page<Map>`: mỗi row `{code,name,productIntentId,status,blockCount,primaryObligationTypeName}` (blockCount đếm thật; primaryObligationTypeName join `obligation_type.name` role=Primary).
  - `GET /{code}` → `ProductPattern`.
  - `GET /{code}/detail` → `{pattern, productIntentName, blocks:[{blockId,position,usage}], obligationTypes:[{code,name,role}]}`.

**Frontend:**
- `ProductPatternPage` (ListScreen): Mã / Tên Pattern / Obligation Type / Số Block (center) / Trạng thái. **Bỏ cột PHIÊN BẢN** (DB không có version). Cột Obligation Type hiển thị **tên thật** (join `obligation_type.name` Primary), không phải mã. onRowClick → `/pattern/:code`.
- `ProductPatternDetailPage` = **"Trình dựng Product Pattern"** pixel-perfect (trích từ builder gốc `openBuilder('pattern')`):
  - Header builder: back, tên khuôn + mã + status pill (dot màu), 4 nút Phiên bản/Xem trước/Lưu nháp/Gửi duyệt (no-op read-only), subtitle "Product Pattern · từ Product Intent PI-xxx · {tên}".
  - **Cột trái Palette:** tab Block / Obligation Type; ô tìm block (lọc thật, view-only); thư viện 12 block; tab OT liệt kê OT của pattern.
  - **Cột giữa Canvas:** "OBLIGATION TYPE ĐÃ GÁN" (chip + Gán thêm); **ma trận độ phủ OT×Block** (banner verdict + dòng "Bắt buộc·đã có / THIẾU / Tùy chọn" + "+ Thêm Block"); "CẤU TRÚC BLOCK · N block" — thẻ block theo `position` thật, click chọn → cột phải.
  - **Cột phải Thuộc tính Block:** block đang chọn + nhóm nghiệp vụ + "Chi phối bởi Obligation Element"; **Answer Slots** (mỗi slot: tên + Bắt buộc/Tùy chọn + type chip + code + Mặc định + Ràng buộc + "ĐỊNH NGHĨA BỞI ATTRIBUTE" + Mở →).
  - Tương tác VIEW hoạt động thật: chọn block, đổi tab palette, tìm block. Các nút CUD/kéo-thả: no-op (read-only), giữ pixel.
- `Layout` sửa (mục 3). `main.tsx`: CUSTOM.pattern + route `/pattern/:code`.

**⚠ NGUỒN DATA CỦA BUILDER (đọc kỹ — mục 8.6):**
- **Từ DB qua API `/{code}/detail` (THẬT):** pattern (code/name/status/intent), danh sách block của pattern (`pattern_block`: block_id/position/usage), obligation type của pattern (`pattern_obligation_type` + tên join).
- **Đang FIX CỨNG trong `patternBuilderData.ts` (CẦN WIRE — có nguồn thật trong DB):** tên/nhóm/gov của block, toàn bộ answer slots + default/rule/required/attribute, "type" của slot, **ma trận OT×Block**, tên hiển thị attribute, archetype của OT. → mục 6.A.

**Zip mới nhất đã giao (phase 5):** `product-factory-phase5-pattern-builder.zip`.

### Giai đoạn 6 — Block & Answer Slot (backend `structure` + frontend list, verified)
**Backend package `structure` (Lớp II) — MỚI:**
- `DataType` (PK `code`, `name`) + `DataTypeRepository` + `DataTypeController` (read-only thuần, `/api/data-types`).
- `Block` (PK `id`, có `code`/`name`/`bizGroup`/`governedByElementCode`/`governedByAspect`/`status`; helper `getGov()` = element ?? aspect) + `BlockRepository`.
- `AnswerSlot` (+`AnswerSlotId` composite `[blockId, code]`; `name`/`attributeCode`/`required`/`defaultValue`/`ruleText`) + `AnswerSlotRepository` (`findByBlockId`, `countByBlockId`).
- `BlockController` (`/api/blocks`, **KHÔNG extends base** vì list làm giàu):
  - `GET /` → `Page<Map>`: mỗi row `{id,code,name,bizGroup,gov,slotCount,status}` (slotCount đếm answer_slot; gov = governed_by_element_code ?? governed_by_aspect).
  - `GET /{id}` → `Block`.
  - `GET /{id}/detail` → `{block, slots:[{code,name,type,required,def,rule,attrName,attrCode}]}` (join answer_slot + attribute.name + data_type.name làm "type"). **Endpoint này đã sẵn nguồn để wire builder Pattern về DB (A0.7).**

**Frontend:**
- `pages/BlockPage.tsx` (ListScreen) — trích đúng config list `block` của prototype: cột **Mã / Tên Block / Nhóm / Answer Slot / Chi phối bởi / Trạng thái**. Chip "Nhóm" tone neutral (`#EEF1EF`/`#41524A`, radius 99). Mã + Chi phối bởi kiểu mono. Status = `<StatusChip>`. searchPlaceholder "Tìm Block…", filters `['Nhóm nghiệp vụ','Trạng thái']`, action "Tạo Block" (no-op read-only).
- **KHÔNG có block detail page** — prototype click row = `openCreate('block')` (drawer tạo mới, no-op read-only), không có màn chi tiết block. Không tự bịa detail. (Chi tiết answer-slot sẽ hiển thị trong builder Pattern sau khi wire — A0.7.)
- `main.tsx`: `CUSTOM.block = <BlockPage/>`. Không cần route detail.

**Điểm khác prototype (có chủ đích, đúng quy ước):** prototype cắt 8 dòng + footer giả "Hiển thị 1–8 trên 26 Block" (số 26 là badge giả — DB chỉ có 12 block). Bản này hiển thị **đủ 12 block THẬT từ DB, bỏ footer giả** — nhất quán decision #5 và các màn list đã verify (ProductPattern/BusinessIntent/ProductIntent đều bỏ footer, hiện toàn bộ dòng thật). Build 0 lỗi TS + render Playwright (mock `/api/blocks` = seed thật) so khớp prototype: OK.

**Zip mới nhất đã giao:** `product-factory-phase6-block.zip`.

### Giai đoạn 7 — Ma trận ràng buộc (backend `governance` + frontend 4-tab grid, verified)
**Backend package `governance` (Lớp IV) — MỚI:**
- `ConstraintMatrix` (PK `id` Long; `kind`/`title`/`description`) + `ConstraintMatrixRepository` (`findAllByOrderByIdAsc`).
- `MatrixCell` (+`MatrixCellId` composite `[matrixId,rowCode,colCode]`; `verdict` req|pos|na, `override`) + `MatrixCellRepository` (`findByMatrixId`).
- `ConstraintMatrixController` (`/api/constraint-matrices`):
  - `GET /` → `[{id,kind,title,description}]` theo id (tab bar).
  - `GET /{id}/detail` → grid: `{matrix, rowHead, legend, cols:[{code,label}], rows:[{code,label,cells:[verdict…]}]}`. **Nhãn hàng/cột join theo kind** (matrix_cell chỉ có code): ARCHETYPE_X_ELEMENT→row=obligation_element.name/col=financial_obligation_archetype.name; ELEMENTTYPE_X_ELEMENTTYPE→obligation_element_type.name; OBLIGATIONTYPE_X_BLOCK→row=obligation_type.name/col=block.name. `legend` = rpn|compat|block (FE map màu). Thứ tự hàng/cột giữ theo lần-xuất-hiện-đầu (LinkedHashSet).
  - `GET /pattern-coverage` → **tab 4 phái sinh từ DB thật:** mỗi product_pattern, 6 block cover, verdict = mức mạnh nhất (rank na<pos<req) trong ma trận 3 theo các obligation type của pattern (pattern_obligation_type). Cùng shape với /detail. **Đây cũng chính là logic coverage sẽ dùng lại khi wire builder Pattern (A0.7) — tính 1 nơi ở BE.**

**Frontend:**
- `pages/MatrixPage.tsx` — trích nguyên markup builder màn matrix của prototype (4 tab, 4 stats card, legend, lưới sticky-first-col, ô verdict tô màu). Bảng màu `LEG` (rpn/compat/block) + nhãn tab ngắn trích nguyên. Verdict DB `na` → key legend `no`. Stats req/pos/no + tổng tính client-side từ cells. Nút ô "Click ô để đổi" giữ pixel nhưng **no-op read-only** (không cycle verdict).
- Prefetch cả 4 grid khi mount (3 `/detail` + `/pattern-coverage`), chuyển tab client-side (khớp prototype). `main.tsx`: `CUSTOM.matrix`.
- **Ô verdict CLICK ĐƯỢC (view-only, giống prototype `cycleMatrix`):** click cycle Bắt buộc→Được phép→Không (req→pos→na) + stats cập nhật realtime. Lưu ở **state cục bộ `overrides`** (key `tab:row:col`), **KHÔNG gọi API, KHÔNG ghi DB** — reset khi tải lại. Đây là "tương tác view" thuần (như search filter / chọn block trong builder), vẫn nằm trong read-only 90%. (Prototype cũng chỉ toggle cục bộ, không lưu.)

**Điểm khác prototype (có chủ đích, đúng decision #5):**
1. **Nhãn cột/hàng dùng tên THẬT đầy đủ từ DB** (vd cột ma trận 1 = "Term Loan Obligation" thay vì "Term Loan"; cột ma trận 3 = "Lãi suất (Interest)" thay vì "Lãi suất") — prototype rút gọn tay, ta dùng name thật.
2. **Tab 4 (Pattern × Block) verdict phái sinh từ DB** (OT của pattern × ma trận 3), hiện **đủ 6 pattern** (prototype cắt 5 + mảng biên tập tay). Verdict có thể khác prototype ở vài ô — ưu tiên dữ liệu thật/nhất quán.
3. Verdict (req/pos/na) — **nội dung ma trận — khớp seed 100%** (đã đối chiếu từng ô ma trận 1/2/3).

Build 0 lỗi TS + render Playwright (mock 5 endpoint = seed thật) 4 tab: verdict + màu + tab bar + stats khớp prototype (đối chiếu pixel). OK.

**Zip mới nhất đã giao:** `product-factory-phase7-matrix.zip`.

### Giai đoạn 8 — Attribute (list 3-tab, verified) — CHỈ LÀM MÀN LIST

**Bối cảnh quyết định phạm vi:** khảo sát prototype cho thấy khu vực Attribute có 3 phần — (1) màn list 3-tab (Attribute/Attribute Group/Data Type), (2) màn chi tiết riêng "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant + Selector Scope values + where-used), (3) modal tạo/sửa Attribute (đổi field theo Data Type). Phần (2)+(3) cần dữ liệu từ `product_template`/`product_config`/`product_variant`/`fragment`/`selector_scope` — chưa có backend (đúng lý do đổi thứ tự "nền tảng trước, pipeline sau"). **User đã chọn "List only"** — phần (2)+(3) ghi nợ, hoãn tới khi Pipeline + fragment/selector_scope có backend (mục 6 NỢ MỚI).

**Backend package `attribute` — MỚI:**
- `Domain` (PK `code`; `name`/`description`/`entityCount`/`status`) + `DomainRepository`. Chưa có Controller riêng (chưa có màn Domain độc lập — mục 2.5).
- `AttributeGroup` (PK `code`; `name`/`domainCode`. **KHÔNG có cột description** — khác prototype UI, DDL không có nguồn, đã bỏ cột này khỏi UI thật) + `AttributeGroupRepository`.
- `AttributeConstraint` (PK `id` Long identity; `attributeCode`/`kind`/`minValue`/`maxValue`/`stepValue`/`expression`/`dependsOnAttributeCode`/`message`) + `AttributeConstraintRepository.findByAttributeCode`. **Chưa tạo `AttributeEnumValue`** — chỉ dùng cho màn Usage đã hoãn.
- `AttributeRepository`: thêm `countByGroupCode`, `countByDataTypeCode`. `structure/AnswerSlotRepository`: thêm `findByAttributeCode`.
- `AttributeController` (`/api/attributes`) chuyển từ `extends ReadOnlyController` sang tự viết (join làm giàu, theo mẫu `BlockController`): `GET /` trả `Page<Map>` gồm field phẳng cũ (`code,name,groupCode,dataTypeCode,required,unit` — giữ route generic `/attributes` số nhiều trong `tables.ts` không vỡ) + `dataTypeName` (join `data_type`), `usedInSlots` (join `answer_slot.attribute_code`), `constraintCount`+`constraintSummary` (join `attribute_constraint`, lấy `message` ?? `expression` ?? `kind` của ràng buộc đầu tiên).
- `structure/DataTypeController` (`/api/data-types`) cũng chuyển sang tự viết: `GET /` trả `Page<Map>{code,name,attributeCount}`.
- `AttributeGroupController` (mới, `/api/attribute-groups`): `GET /` trả `Page<Map>{code,name,domainCode,domainName,attributeCount}`.

**Frontend:**
- `pages/AttributePage.tsx` — 3 tab (Attribute/Attribute Group/Data Type) dùng chung `ListScreen`, tab bar tự dựng trích style nút tab của `MatrixPage` (không có prop tabs trong `ListScreen`). Prefetch cả 3 danh sách song song lúc mount, chuyển tab client-side.
  - Tab Attribute: Mã/Attribute/Data Type (chip info)/Dùng trong Answer Slot (chip mỗi slot, "—" nếu rỗng)/Ràng buộc (text ràng buộc đầu + "+N" nếu nhiều, "—" nếu không có)/Bắt buộc (chip gold/muted).
  - Tab Attribute Group: Mã/Attribute Group/Số Attribute/Domain (chip neutral). **Bỏ cột Mô tả** (không có nguồn DB).
  - Tab Data Type: Mã/Data Type/Số Attribute. **Bỏ cột Mô tả và Ví dụ giá trị** (không có nguồn DB, bảng `data_type` chỉ có `code`+`name`).
  - Không `onRowClick` (chưa có màn detail — tránh dead-link, giống `BlockPage` hiện tại).
- `main.tsx`: thêm `attribute: <AttributePage />` vào `CUSTOM`. Không cần Route mới.

Build 0 lỗi TS + render Playwright (mock 3 endpoint dựng từ data seed thật: 31 attribute/12 group/9 data type/15 constraint trên 10 attribute) cả 3 tab: cột đúng, join đúng số liệu (vd DT_ENUM = 12 attr, GRP_PRICING = 3 attr, base_rate hiện "Vượt trần 1,65%/tháng +1"), tab bar style khớp MatrixPage. OK.

### Giai đoạn 9 — Obligation Library (list 3-tab, verified) — phần 1 của mục 2.4

**Bối cảnh:** backend Lớp I (9 bảng ontology) đã có từ Giai đoạn 1 nhưng chỉ entity/repo/controller trần (extends `ReadOnlyController`), frontend dùng `DataTable` generic tạm. Khảo sát prototype xác nhận `obligation` là 1 màn **list thường** (nằm trong mảng `isList`, giống Attribute/Block), có 3 tab: **Obligation Type / Obligation Element / Element Type** (không có tab riêng cho `obligation_family` — chỉ là 1 cột trong tab Type; `obligation_type_composition` không hiển thị tường minh, chỉ dùng để đếm cột "Element"). `archetype` KHÔNG nằm trong `isList` — để ở Giai đoạn 10 riêng (card grid + detail).

**Backend package `ontology` — chuyển 3 controller từ `extends ReadOnlyController` sang tự viết (join làm giàu, theo mẫu `BlockController`):**
- `ObligationTypeController` (`/api/obligation-types`): `GET /` trả `Page<Map>{code,name,familyCode,archetypeCode,status,familyName,archetypeName,elementCount}` (`familyName`/`archetypeName` join; `elementCount` = đếm `obligation_type_composition` — thực tế luôn = 6 vì mỗi Obligation Type có đủ 6 Element Type, khác số liệu minh họa lệch nhau (6/7) của prototype — dùng số thật).
- `ObligationElementController` (`/api/obligation-elements`): `GET /` trả `Page<Map>{code,name,elementTypeCode,elementTypeName,isIdentify}` (`isIdentify` join từ `obligation_element_type.is_identify` qua `element_type_code`, vì cờ này KHÔNG nằm ở `obligation_element`). **Bỏ cột Trạng thái** — bảng `obligation_element` không có cột `status` (khác prototype UI, không bịa).
- `ObligationElementTypeController` (`/api/obligation-element-types`): `GET /` trả `Page<Map>{code,name,shortName,description,isIdentify,elementCount}` (`elementCount` = đếm `obligation_element` theo `element_type_code`).
- Repo mới: `ObligationTypeCompositionRepository.countByObligationTypeCode`, `ObligationElementRepository.countByElementTypeCode`.

**Frontend:**
- `pages/ObligationPage.tsx` — 3 tab dùng chung `ListScreen`, tab bar tự vẽ theo style `MatrixPage`/`AttributePage` (không tab prop trong `ListScreen`). Prefetch cả 3 danh sách song song, chuyển tab client-side.
  - Tab Obligation Type: Mã/Obligation Type/Archetype (chip — tông gold nếu tên chứa "Revolving", còn lại info)/Family (text)/Element (đếm thật)/Trạng thái (StatusChip).
  - Tab Obligation Element: Mã/Obligation Element/Element Type (chip neutral)/Is_identify (chip true/false). **Bỏ cột Trạng thái** (không có nguồn DB).
  - Tab Element Type: Mã/Element Type/Mô tả (cột thật)/Số Element (đếm thật).
  - Không `onRowClick` (prototype cũng chỉ mở modal generic no-op, không có detail riêng cho `obligation`).
- `main.tsx`: thêm `obligation: <ObligationPage />` vào `CUSTOM`.

Build 0 lỗi TS + render Playwright (mock 3 endpoint dựng từ seed thật: 9 obligation_type/18 element/7 element_type) cả 3 tab: family/archetype/element count đúng, is_identify đúng (chỉ 3 element thuộc OET_NATURE = true), số element theo element type đúng (3/3/3/4/2/3/0). OK.

### Giai đoạn 10 — Financial Obligation Archetype (card grid + detail, verified) — phần 2 của mục 2.4

**Bối cảnh:** khảo sát prototype xác nhận `archetype` KHÔNG nằm trong mảng `isList` — là **card grid** (3 card cứng trong prototype: Term Loan/Revolving/Conditional Obligation) + **trang detail thật** khi click card (`view:'archetypeDetail'`, không phải modal no-op như `obligation`/`attribute`/`block`). Bảng `financial_obligation_archetype` **không có cột `status`** (khác prototype UI vốn gắn published/approved cho mỗi card) — không bịa, bỏ khỏi UI thật.

**Backend package `ontology`:**
- `FinancialObligationArchetypeController` (`/api/archetypes`) chuyển từ `extends ReadOnlyController` sang tự viết (join làm giàu, giữ `Page<Map>` để không phá route generic `/archetypes` cũ trong `tables.ts`):
  - `GET /` → mỗi row `{code,name,nature,valueStructure,typeCount,elementCount,productCount}`. `typeCount`/`elementCount` đếm `obligation_type`/`foa_element` theo `archetype_code`. `productCount` = số **pattern khác nhau** đang dùng ít nhất 1 Obligation Type của archetype (join 2 chặng qua `pattern_obligation_type`, dùng `Set` để loại trùng).
  - `GET /{code}/detail` → `{archetype, typeCount, elementCount, productCount, elementRows:[{code,name,elementTypeName,requirement}], typeRows:[{code,name,status,productCount}]}` (elementRows join `foa_element`+`obligation_element`+`obligation_element_type`; typeRows join `obligation_type` theo archetype, mỗi type kèm productCount riêng qua `pattern_obligation_type`).
- Repo mới: `ObligationTypeRepository.findByArchetypeCode`/`countByArchetypeCode`, `FoaElementRepository.findByArchetypeCode`, `PatternObligationTypeRepository.findByObligationTypeCode` (tái dùng module `pipeline` đã có từ Giai đoạn 5 Pattern).

**Frontend:**
- `pages/ArchetypePage.tsx` — card grid (`grid-template-columns: repeat(auto-fill,minmax(300px,1fr))`), mỗi card: header gradient màu riêng theo code (thuần chrome, không có nguồn DB — giữ đúng tinh thần 3 màu gốc của prototype), tên/mã, Obligation Nature/Value Structure (text thật), 3 stat (Obligation Type/Element/Product — số thật). Click card → `navigate('/archetype/:code')`.
- `pages/ArchetypeDetailPage.tsx` (route `/archetype/:code`, đăng ký TRƯỚC `/:view`) — header gradient (back button + tên + mã), 3 stat card, 2 card Nature/Value (kèm mô tả dài `nature_desc`/`value_desc`), bảng Obligation Element (chip Bắt buộc/Possible/Không áp dụng theo `requirement` 3 trạng thái thật req/pos/na — KHÔNG rút gọn còn 2 trạng thái như prototype), bảng Obligation Type thuộc archetype (kèm `productCount` + `StatusChip`).
- `main.tsx`: thêm `archetype: <ArchetypePage />` vào `CUSTOM` + `<Route path="/archetype/:code" element={<ArchetypeDetailPage />} />` trước `/:view`.

Build 0 lỗi TS + render Playwright (mock endpoint dựng từ seed thật) cả card grid (3 card, element/type count đúng: 6/6/6 element, 5/2/2 type = 9 tổng khớp seed) và trang detail (element rows đúng requirement, type rows đúng status). OK.

### Giai đoạn 11 — Domain + Lifecycle & State (list đơn giản, verified) — mục 2.5

**Bối cảnh:** khảo sát prototype xác nhận cả `domain` và `lifecycle` đều là **list thường 1 bảng, không tab, không detail riêng** (`onClick` row chỉ mở lại modal generic `openCreate`, giống `obligation`/`attribute`/`block`) — đơn giản hơn hẳn `archetype`.

**Backend:**
- `attribute/DomainController` (mới, `/api/domains`) — **read-only thuần**, `extends ReadOnlyController<Domain,String>`. Không cần join: cột `entity_count` là cột thật lưu sẵn trong bảng `domain` (không phải số suy ra), entity `Domain` đã tạo sẵn từ Giai đoạn 8.
- `ontology/LifecycleController` (`/api/lifecycles`) chuyển từ `extends ReadOnlyController` sang tự viết join làm giàu: `GET /` trả `Page<Map>{code,name,governs,status,stateCount}` (`stateCount` = đếm `lifecycle_state` theo `lifecycle_code`, cột "SỐ STATE" prototype hiển thị số thật 7/6/5/5/6/4). Thêm `LifecycleStateRepository.countByLifecycleCode`.

**Frontend:**
- `pages/DomainPage.tsx` — list đơn giản (không tab, không filter — đúng prototype `filters:[]`): Mã/Domain/Mô tả/Thực thể/Trạng thái (StatusChip). Không `onRowClick`.
- `pages/LifecyclePage.tsx` — list đơn giản, 1 filter `['Đối tượng']` (đúng prototype): Mã/Lifecycle/Áp dụng cho (`governs`)/Số State (đếm thật)/Trạng thái. Không `onRowClick`.
- `main.tsx`: thêm `domain: <DomainPage />` và `lifecycle: <LifecyclePage />` vào `CUSTOM`.

Build 0 lỗi TS + render Playwright (mock 2 endpoint dựng từ seed thật: 5 domain, 6 lifecycle) khớp prototype: cột đúng, số state đúng 7/6/5/5/6/4, entity count đúng 142/98/37/54/29. OK.

### Giai đoạn 12 — Ontology + Sysmap (biểu đồ, verified) — mục 2.6, HOÀN TẤT NHÓM NỀN TẢNG

**Bối cảnh:** khảo sát prototype xác nhận `ontology` và `sysmap` **KHÔNG nằm trong `isList`** (có cờ riêng `isOntology`/`isSysMap`), nhưng cũng **KHÔNG phải SVG/canvas node-edge thật** — cả hai là layout card/flex/grid tĩnh mô phỏng sơ đồ bằng box + icon mũi tên (giống các khối info-card đã dùng ở Archetype detail), không có `<svg>`/`<line>`/`<circle>`/`<path>`/`position:absolute`.

**Không cần backend mới** — toàn bộ dữ liệu tổng hợp phía client từ các API đã có sẵn từ các giai đoạn trước:

- `pages/OntologyPage.tsx`: fetch song song `/api/obligation-types`, `/api/obligation-families`, `/api/obligation-type-compositions` (raw), `/api/obligation-elements`, `/api/obligation-element-types`.
  - **Khối 1 (chuỗi ER):** 4 card khái niệm (Element Type→Element→Type→Family) với số đếm thật + nhãn quan hệ/cardinality tĩnh (mô tả cấu trúc FK thật đã xác minh trong DDL — không phải data hàng, tương tự cách Dashboard KPI được phép tổng hợp).
  - **Khối 2:** cột trái chọn Obligation Type (nhóm theo Family, dữ liệu thật), cột phải hiển thị 6 dòng decomposition thật (join `obligation_type_composition` với tên Element Type/Element phía client, dòng `OET_NATURE` được highlight viền xanh).
  - **Khối 3:** accordion "từ vựng" theo Element Type → Element (thật), đánh dấu ✓ Element nào thực sự được dùng trong ít nhất 1 `obligation_type_composition` (tính từ dữ liệu thật, không bịa).
- `pages/SysmapPage.tsx`: không gọi API (toàn bộ nội dung là cấu trúc/điều hướng tĩnh, tương tự cách Dashboard hiển thị số tổng hợp).
  - **Khối 1:** 7 nút pipeline (Business Intent→...→Catalog), click điều hướng đúng route thật (`navigate('/${key}')` — các màn Pipeline chưa dựng sẽ tự rơi vào placeholder có sẵn của `GenericView`, không lỗi).
  - **Khối 2:** 7 thư viện nền tảng (đã dựng xong tất cả), mỗi cái ghi rõ "nuôi vào" tầng pipeline nào (quan hệ cấu trúc thật, click điều hướng đúng màn).
  - **Khối 3:** bảng 15 quan hệ thực thể (nguồn/quan hệ/đích/cardinality) — mô tả FK thật đã xác minh qua DDL của các bảng đã có backend, không phải data hàng tự bịa.
- `nav.ts`: bổ sung `VIEW_TITLES.ontology`/`VIEW_TITLES.sysmap` (thiếu từ trước, đúng breadcrumb prototype: `ontology`→"Thư viện", `sysmap`→"Tổng quan").
- `main.tsx`: thêm `ontology: <OntologyPage />`, `sysmap: <SysmapPage />` vào `CUSTOM`.

Build 0 lỗi TS + render Playwright (mock 5 endpoint dựng từ seed thật) — chuỗi ER hiện đúng số 7/18/9/3, chọn Obligation Type đổi decomposition đúng, accordion vocab mở/đóng đúng và tick ✓ Element đang dùng chính xác; Sysmap hiện đủ 7 pipeline + 7 foundation + 15 dòng quan hệ. OK.

**Nhóm "thư viện nền tảng" (A0, mục 2.1-2.6) chính thức HOÀN TẤT** sau giai đoạn này.

### Giai đoạn 13 — WIRE builder Product Pattern về DB thật (verified) — mục 2.7, XÓA `patternBuilderData.ts`

**Bối cảnh:** builder "Trình dựng Product Pattern" (Giai đoạn ban đầu) đã đúng markup pixel-perfect nhưng dùng `patternBuilderData.ts` — catalog block/OT/ma trận **fix cứng** trích từ prototype. Sau khi backend `structure` (Giai đoạn 6), `governance` (Giai đoạn 7) đã có, mục này thay toàn bộ nguồn tĩnh bằng API thật, không đổi 1 pixel giao diện.

**Backend** — mở rộng `ProductPatternController#GET /{code}/detail` (không đổi `/{code}` hay `list()`):
- Inject thêm `FinancialObligationArchetypeRepository`, `structure.BlockRepository`/`AnswerSlotRepository`/`AttributeRepository`/`DataTypeRepository`, `governance.ConstraintMatrixRepository`/`MatrixCellRepository`.
- Response đổi shape: `{ pattern, productIntentName, assignedOTs:[{code,name,role,archetype}], blocks:[{blockId,position,usage,name,bizGroup,gov,status,slots:[{code,name,type,required,def,rule,attrCode,attrName}]}], coverage:[{blockId,label,verdict,inCanvas}] }`.
  - `assignedOTs[].archetype` = join `obligation_type.archetype_code → financial_obligation_archetype.name`.
  - `blocks[]` join `pattern_block.block_id → block` (tên/bizGroup/gov/status) + `answer_slot` theo block (join `attribute` + `data_type` y hệt logic đã có ở `BlockController#/{id}/detail`, không lặp code khác cách nhưng tách controller nên viết lại tại chỗ).
  - `coverage[]` — tái dùng đúng logic `ConstraintMatrixController#patternCoverage` (matrix kind `OBLIGATIONTYPE_X_BLOCK`, rank na<pos<req) nhưng thu hẹp về **một pattern cụ thể** thay vì toàn bộ danh sách pattern; cùng 6 block "cover" (`COVER_BLOCKS` hằng số trùng cả hai controller).
- Xóa hẳn field `obligationTypes`/`blocks` (shape cũ, chỉ có blockId/position/usage) — không giữ song song 2 field vì FE chỉ dùng 1 nguồn.

**Frontend** — viết lại toàn bộ `ProductPatternDetailPage.tsx`:
- Xóa import `patternBuilderData` (`BLOCK_LIB`, `BLOCK_BY_ID`, `OT_ARCHETYPE`, `OT_BLOCK_MATRIX`, `COVER_COLS`, `attrLabel`) — **xóa hẳn file `patternBuilderData.ts`** (không còn nơi nào import).
- `canvas` = `data.blocks` dùng thẳng (đã enrich sẵn từ API, không cần map qua catalog tĩnh nữa).
- Palette trái tab "Block" (thư viện toàn bộ block, không chỉ block trong pattern): fetch thêm `getList('blocks', 0, 200)` (API thật `/api/blocks`, đã có từ Giai đoạn 6) thay vì `BLOCK_LIB` — dùng `slotCount` thay vì `slots.length` cho dòng phụ.
- `coverage` (FE) chỉ còn việc map `verdict`+`inCanvas` (đã tính sẵn ở BE) → nhãn/màu hiển thị (`covered`/`missing`/`covered-opt`/`suggest`), không tự tính rank nữa.
- "ĐỊNH NGHĨA BỞI ATTRIBUTE" dùng thẳng `s.attrName · s.attrCode` (join thật từ BE) thay vì `attrLabel()` tra bảng tĩnh.
- Archetype hiển thị ở tab OT và card "đã gán" dùng thẳng `o.archetype` (join thật) thay vì `OT_ARCHETYPE[code]` tra bảng tĩnh.

Build 0 lỗi TS. Render Playwright (mock `/api/blocks` + `/api/product-patterns/PT-001/detail` theo đúng shape mới, dựng từ seed thật PT-001/5 block/1 OT, cố ý thiếu `BLK_LIMIT`/`BLK_PENALTY` trong canvas để test nhánh coverage "Tùy chọn"/"+Thêm Block"): canvas 5 block đúng thứ tự, click đổi block chọn ở panel phải đúng (Điều kiện tham gia → Tài sản đảm bảo, đổi cả LTV/ASSET_PLEDGE), tab Obligation Type hiện đúng OT đã gán kèm archetype "Term Loan Obligation", coverage "Bắt buộc 4/4" + dòng "Hạn mức (Limit)" hiện đúng nhãn "Tùy chọn"/"+ Thêm Block". OK — không còn dòng fix cứng nào trong builder Pattern.

### Giai đoạn 14 — Product Template (list, verified) — mục 3.1, MỞ ĐẦU PIPELINE SẢN PHẨM

**Bối cảnh:** khảo sát prototype (`docs/Product Factory 5.1.html`, tìm `openTplWizard`/`isTplWizard`/`tplData()`) xác nhận **`template` KHÔNG phải builder** — nav item gọi `this.go('template')` (route list thường), khác hẳn Pattern gọi `this.openBuilder('pattern')`. Click 1 dòng bất kỳ trong list gọi `openTplWizard` — nhưng hàm này luôn `setState({tplStep:0})` **không truyền id dòng nào**, và `tplData()` dựng từ state demo tĩnh (`TPL_BLOCKS`, `tp.locked`, `tp.frames`) — nghĩa là đây là **wizard TẠO MỚI chung** (3 bước: chọn đối tượng KH → khóa Block kế thừa → đặt giá trị khung Answer Slot), không phải xem chi tiết một template cụ thể đã click. Cùng bản chất với các "modal generic no-op" khi click Obligation/Domain/Lifecycle. → Quyết định: **chỉ dựng màn LIST**, không dựng wizard (đúng luật read-only 90%, tránh dựng cả 1 form CUD 3 bước chỉ để rồi no-op).

**Backend** — 4 entity mới package `pipeline` (Lớp III):
- `CustomerSegment` (PK `code`): `name`, `audience`, `tier` (nullable), `legalRequirement` (nullable). + `CustomerSegmentRepository`.
- `ProductTemplate` (PK `code`): `name`, `fromPatternCode`, `status`. + `ProductTemplateRepository`.
- `TemplateSegment` (+`TemplateSegmentId` composite `[template_code, segment_code]`): junction Template×Segment. + `TemplateSegmentRepository.findByTemplateCode`.
- `TemplateFrame` (+`TemplateFrameId` composite `[template_code, block_id, slot_code]`): giá trị khung Answer Slot. + `TemplateFrameRepository.findByTemplateCode`.
- `ProductTemplateController` (`/api/product-templates`, tự viết `Page<Map>` vì cần join, không extends `ReadOnlyController`): `GET /` trả `{code,name,fromPatternCode,patternName,segmentCode,segmentName,status}` — `patternName` join `product_pattern.name`, `segmentCode`/`segmentName` join qua `template_segment`→`customer_segment` (lấy dòng đầu, seed mỗi template chỉ có 1 segment). Cột "CẬP NHẬT" của prototype **bỏ** — `product_template` không có cột `updated_at`/tương đương (quy tắc vàng, đúng tiền lệ Pattern/Block/Attribute).

**Frontend (list)** — `pages/ProductTemplatePage.tsx` (mẫu y hệt `DomainPage`/`ObligationPage` list đơn, không tab): 5 cột Mã(mono)/Tên Template(bold)/Pattern nguồn(dim)/Đối tượng KH/`StatusChip`; `filters={['Pattern nguồn','Đối tượng']}` (đúng prototype); `actionLabel="Tạo Template"`.

Build 0 lỗi TS. Render Playwright (mock `/api/product-templates` từ 6 dòng seed thật TPL-001..006, join tên pattern qua `from_pattern_code`): đủ 6 dòng, đúng 5 cột, không có cột "Cập nhật" giả, filter chip + nút "Tạo Template" hiện đúng vị trí prototype. OK.

**Bổ sung ngay sau đó — Product Template Detail (route `/template/:code`):** user cung cấp screenshot chính prototype's wizard "Tạo Product Template" (3 bước: chọn đối tượng KH → khóa Block không áp dụng → đặt giá trị khung Answer Slot) và hỏi có dựng chưa. Đọc lại trực tiếp bundler JS xác nhận **toàn bộ nội dung wizard là dữ liệu TĨNH** (`TPL_BLOCKS` — catalog 7 block cứng có field `required`/`def` không tồn tại trong DB ở cấp block; `state.tpl` khởi tạo cứng `name/fromPattern/audience/locked:['BLK_BILLING']/frames:{}` — luôn giống nhau mỗi lần mở, không đổi theo dòng click). Quyết định (hỏi user qua AskUserQuestion, chọn phương án "Suy ra từ template_frame"): dựng lại `/{code}/detail` là màn **XEM** (không sửa) 1 template thật, tái dùng đúng layout 3 bước nhưng đổ 100% dữ liệu thật:
- Bước 1 (đối tượng KH): thật hoàn toàn — `product_template.name` + `template_segment→customer_segment` (audience/tên hiển thị đúng, card còn lại hiện mờ để so sánh, không cho chọn).
- Bước 2 (Block áp dụng): **không có cột DB nào lưu trạng thái khóa theo từng template** (kiểm cả `pattern_block.usage` — cột này là `active`/`locked` nhưng ở cấp Pattern, seed toàn bộ luôn `'active'`, không phải khái niệm template) → suy ra "đang áp dụng" = block (từ `pattern_block` của `from_pattern_code`) có ít nhất 1 dòng `template_frame` cho template này. Bỏ nhãn "Bắt buộc (luôn áp dụng)" (không có cột `required` cấp block) — thay bằng "Đang áp dụng"/"Chưa có giá trị khung" trung tính, đúng sự thật.
- Bước 3 (giá trị khung Answer Slot): thật 100% từ `template_frame`, chỉ hiện block có ít nhất 1 giá trị (block rỗng ẩn khỏi bước 3, đã thấy ở bước 2). Slot chưa có `frame_value` hiện "— chưa đặt giá trị khung —" (không dùng `def` tĩnh của prototype).

Backend mở rộng `ProductTemplateController#GET /{code}/detail` (không đổi `list()`): join `pattern_block`(từ `from_pattern_code`) + `structure.Block`/`AnswerSlot` + `TemplateFrame`, trả `{template, patternName, segmentCode, segmentName, audience, blocks:[{blockId,name,bizGroup,active,slots:[{code,name,frameValue}]}]}`. Frontend `ProductTemplateDetailPage.tsx` (route `/template/:code`, đăng ký TRƯỚC `/:view`) — 3-panel layout (card "kế thừa từ Pattern" + step nav bên trái, nội dung bước bên phải), step nav chỉ đổi state hiển thị (không sửa dữ liệu), toggle switch bước 2 chỉ decorative theo `active` thật, không click được. `ProductTemplatePage` thêm `onRowClick` điều hướng `/template/{code}`.

Render Playwright (mock TPL-003 — pattern PT-002 có 9 block, 10 dòng `template_frame` thật khớp seed): bước 1 đúng audience "Khách hàng cá nhân" + segment SEG_INDIVIDUAL; bước 2 đúng "Đang áp dụng 6 · chưa thiết lập giá trị khung 3" (COUNTERPARTY/LIMIT/INTEREST/REPAYMENT/COLLATERAL/BILLING active, ELIGIBILITY/REGULATORY/PENALTY chưa); bước 3 đúng 6 block với giá trị khung khớp seed (F88, 3tr–50tr, 1,5%/tháng, Cố định, 1–18, Hàng tháng, Xe máy, 75%…). OK — không fabricate cột nào không tồn tại.

### Giai đoạn 15 — Product Config (list + detail, verified) — mục 3.2

**Bối cảnh:** khảo sát prototype (bundler JS) cho thấy `config` cũng có view riêng `configForm` — nhưng cùng bài học Template: click bất kỳ dòng nào trong list đều gọi `this.go('configForm')` **không mang id**, và `configForm` luôn hiển thị đúng 1 bộ dữ liệu cứng "CFG-0042" (`configBase()` + state khởi tạo tĩnh `cfgCtx`/`cfgSlot`/`cfgDraft`) — không phải per-row detail thật. Áp dụng lại đúng cách làm đã dùng cho Template: dựng `/{code}/detail` là màn XEM (không sửa) fragment thật của TỪNG config.

**Backend** — 3 entity mới package `pipeline` (Lớp III):
- `SelectorScope` (PK `code`): `name`, `priority` (0=default, 1=time, 2=place, 3=people — đúng seed).
- `ProductConfig` (PK `code`): `name`, `fromTemplateCode`, `status`.
- `Fragment` (PK `id` auto-increment): `configCode`, `blockId`, `slotCode`, `scopeCode`, `scopeValue` (nullable), `value`, `isWarning` (bool), `validationMsg` (nullable). + `FragmentRepository.findByConfigCode`/`countByConfigCode`.
- `ProductConfigController` (`/api/product-configs`): `GET /` trả `{code,name,fromTemplateCode,templateName,fragmentCount,status}` — `templateName` join `product_template.name`, `fragmentCount` = `countByConfigCode` (thật: CFG-0042 = 15, 6 config còn lại = 0, đúng seed — không có fragment giả). Cột "NGƯỜI DUYỆT" của prototype **bỏ** — `product_config` không có cột nguồn (quy tắc vàng).
- `GET /{code}/detail` trả `{config, templateName, slots:[{blockId,blockName,slotCode,slotName,fragments:[{scopeCode,scopeName,priority,scopeValue,value,isWarning,validationMsg}]}]}` — `slots` = các cặp (block,slot) THẬT SỰ có fragment (không lặp qua toàn bộ block của pattern như Template, vì fragment không nhất thiết phủ hết mọi slot); mỗi slot có danh sách fragment sắp theo `selector_scope.priority` tăng dần (default→time→place→people, đúng thứ tự ghi đè ngữ nghĩa).

**Frontend** — `pages/ProductConfigPage.tsx` (list, mẫu `ProductTemplatePage`): 5 cột Mã/Tên Config/Template/Fragment(số, giữa)/`StatusChip`; `filters=['Template','Trạng thái']`; `onRowClick` → `/config/{code}`. `pages/ProductConfigDetailPage.tsx` (route `/config/:code`, đăng ký TRƯỚC `/:view`): layout trái-phải — trái là danh sách Answer Slot có fragment (click chọn, có icon cảnh báo nếu slot có fragment `isWarning`), phải là các "card" fragment theo bối cảnh của slot đã chọn (chip tên scope + scope_value + giá trị + cảnh báo/`validationMsg` nếu có). Config chưa có fragment nào hiện thông báo trung thực "chưa có fragment nào" (không bịa).

Build 0 lỗi TS. Render Playwright (mock đúng 15 dòng `fragment` thật của CFG-0042 + 7 dòng `product_config` thật): list hiện đúng cột Fragment (15 vs 0), detail hiện đúng 9 answer-slot có fragment, chọn "Base Rate" (5 fragment: default/time/place/people×2) hiện đúng thứ tự ưu tiên và đúng dòng cảnh báo "Gần trần" ở scope Place HCM,HN. OK.

### Giai đoạn 16 — Product Variant (list, verified) — mục 3.3

**Bối cảnh:** khảo sát bundler JS xác nhận `variant` nằm trong `isList` (KHÔNG có view detail/wizard riêng) — click bất kỳ dòng nào đều gọi `this.openCreate('variant')`, cùng 1 hàm không truyền dữ liệu dòng, chỉ mở drawer "Đóng gói Product Variant" (form tạo mới tĩnh). → Chỉ dựng **LIST**, giống Domain/Lifecycle/Obligation (không có mẫu wizard cần xử lý như Template/Config).

**Phát hiện quan trọng:** cột "KÊNH" (vd "App · Web · PGD") của prototype list KHÔNG cần bỏ/fabricate — suy ra được THẬT từ `catalog_listing.variant_code → product_catalog.channel` (1 variant có thể niêm yết ở nhiều "kệ" catalog, mỗi kệ có 1 kênh cố định: App/Web/PGD). Đối chiếu seed: VAR-101 ở cả 3 catalog → "App · Web · PGD" khớp chính xác prototype; VAR-106 không có dòng `catalog_listing` nào → hiện "—" (khác prototype fabricate "PGD" — ưu tiên dữ liệu thật).

**Backend** — 4 entity mới package `pipeline` (Lớp III), 3 trong số đó (`ProductCatalog`/`CatalogListing`) sẽ tái dùng khi dựng màn Catalog (mục 3.4, tránh làm trùng):
- `ProductVariant` (PK `code`): `name`, `fromConfigCode`, `family` (nullable), `limitRange` (nullable), `displayRate` (nullable), `marketingContent` (nullable), `status`.
- `ProductCatalog` (PK `id` auto): `name`, `channel`.
- `CatalogListing` (+`CatalogListingId` composite `[catalog_id, variant_code]`): `publishedDate` (nullable), `status`. + `CatalogListingRepository.findByVariantCode`.
- `ProductVariantController` (`/api/product-variants`): `GET /` trả `{code,name,fromConfigCode,configName,limitRange,displayRate,channels,status}` — `configName` join `product_config.name`, `channels` = distinct `product_catalog.channel` qua `catalog_listing` (join `" · "`, `null` nếu chưa niêm yết catalog nào).

**Frontend** — `pages/ProductVariantPage.tsx` (list đơn giản, mẫu `DomainPage`): 6 cột Mã/Sản phẩm/Hạn mức/Lãi suất/Kênh/`StatusChip` (đúng cột prototype, `limitRange`/`displayRate` là cột thật của `product_variant`); `filters=['Family','Kênh','Trạng thái']`; `actionLabel="Đóng gói Variant"`; không `onRowClick` (tránh dẫn tới drawer tạo-mới không dựng).

Build 0 lỗi TS. Render Playwright (mock 7 dòng `product_variant` thật + kênh tính tay từ seed `catalog_listing`): đúng 7 dòng, cột Kênh khớp chính xác (VAR-101 "App · Web · PGD", VAR-106 "—" vì chưa niêm yết). OK.

### Giai đoạn 17 — Product Catalog (card grid, verified) — mục 3.4, HOÀN TẤT TOÀN BỘ PIPELINE SẢN PHẨM

**Bối cảnh:** khảo sát bundler JS xác nhận `catalog` là **CARD GRID riêng** (`isCatalog`, KHÔNG nằm trong `isList` như Template/Config/Variant), và KHÔNG có wizard/detail nào (`catalogForm`/`openBuilder('catalog')` — 0 kết quả grep). Hàm `catalog()` của prototype dựng tĩnh 6 card mẫu, mỗi card gồm field {name, variant, family, limit, rate, statusLabel, channels[]} — thực chất là **join `product_variant` (family/limitRange/displayRate/status) với `catalog_listing→product_catalog.channel`**, không phải cột riêng của `product_catalog`/`catalog_listing`. Không có "3 kệ App/Web/PGD" lồng nhau trong UI — chỉ 1 lưới phẳng, mỗi card = 1 variant đã niêm yết.

**Backend** — không cần entity mới (đã dựng `ProductCatalog`/`CatalogListing` ở Giai đoạn 16 khi làm Variant — tái dùng đúng như dự tính). `ProductCatalogController` (`/api/product-catalogs`, tự viết `Page<Map>`): lặp mọi `ProductVariant`, bỏ qua variant chưa có `catalog_listing` nào (khớp đúng prototype: VAR-106 không niêm yết catalog nào → không xuất hiện, đúng 6 card như prototype, không phải thiếu sót); mỗi card trả `{variantCode,name,family,limitRange,displayRate,channels,status}` — `channels` = distinct `product_catalog.channel` qua `catalog_listing`, join `" · "`.

**Frontend** — `pages/ProductCatalogPage.tsx` (card grid, mẫu `ArchetypePage`): header gradient xanh cố định (chrome, không nguồn DB — giống tiền lệ `HEAD_BG` của Archetype), 2 cột Hạn mức/Lãi suất, chip Family, dòng cuối Kênh + `StatusChip`. Không `onClick` (không có detail nào tồn tại thật — đúng bản chất "chỉ card tĩnh" của prototype).

Build 0 lỗi TS. Render Playwright (mock đúng 6 card từ seed thật, khớp verbatim 6 dòng tĩnh của prototype `catalog()` vì dữ liệu tĩnh đó thực ra đã đúng với DB): hiện đủ 6 card, đúng family/hạn mức/lãi suất/kênh/trạng thái từng variant. OK.

**Nhóm "Pipeline sản phẩm" (mục 3, Template→Config→Variant→Catalog) chính thức HOÀN TẤT** sau giai đoạn này.

### Giai đoạn 18 — Release (stepper + swimlane) + Activity Log (list), verified — mục 3B

**Bối cảnh:** khảo sát bundler JS xác nhận `release` (`isRelease`) KHÔNG phải list mà là **stepper 8 bước** (`releaseSteps()`/`releaseData()`) + view phụ **Sơ đồ Swimlane** (toggle bằng `setReleaseView`). Dữ liệu 8 bước hardcode trong bundler khớp gần như y hệt seed thật: `maker_checker_process`(1 dòng, `variant_code='VAR-101'`, `product_name` chứa cả tên+mã, `done_count=4`), `process_step`(8 dòng: title/role/step_status/input_desc/output_desc theo đúng thứ tự), `process_step_checklist`(24 dòng, `is_done` thật khớp logic "done nếu status=done, item đầu done nếu status=current"). `desc`/`tip`/`icon` không có cột DB nguồn — giữ làm hằng số UI tĩnh (`STEP_META` ở backend) vì đây là copy mô tả quy trình chuẩn công ty, không đổi theo instance (không phải dữ liệu nghiệp vụ có thể sai theo dòng).

`activity` (`isList`) là list đơn giản, 8 dòng hardcode khớp y hệt seed thật `activity_log` (8 dòng). Cột "KÊNH" không có cột DB riêng nhưng **suy ra được thật** bằng regex `"kênh\s+(\S+)"` trên `detail` — mọi dòng seed thật đều có hậu tố "· kênh Web"/"· kênh API", khớp đúng 8/8 giá trị Web/API của prototype (không bịa, tương tự bài học "Kênh" ở Variant). Footer "trên 1.284 hoạt động" của prototype là số bịa hoàn toàn → bỏ, COUNT thật = 8. Cột "HÀNH ĐỘNG" của prototype là câu diễn giải tự do (ghép động từ + loại đối tượng, vd "Gửi duyệt Config") không có cột riêng — map lại `action` (code chuẩn hoá: create/update/approve/submit_review/publish/retire/assign/sync) sang động từ tiếng Việt qua `ACTION_LABEL`. Click dòng nào của Activity Log cũng mở modal export tĩnh giống nhau (`openCreate('activity')`, không mang dữ liệu dòng) — giống bài học Template/Config ban đầu — nên KHÔNG làm `onRowClick`.

**Backend:**
- Package mới `release` (Lớp IV — Governance): `MakerCheckerProcess`(PK `id` auto, `variantCode` nullable, `productName`, `doneCount` Short) + `ProcessStep`(+`ProcessStepId` composite `[process_id, step_no]`: `title`, `role`, `stepStatus`, `inputDesc`/`outputDesc` nullable) + `ProcessStepChecklist`(+`ProcessStepChecklistId` composite `[process_id, step_no, sort_order]`: `item`, `done` — cột `is_done`). `ReleaseProcessController` (`/api/release-processes`): `GET /` trả `{id,productName,productCode,doneCount,totalSteps}`; `GET /{id}/detail` trả `{process, steps:[{stepNo,title,role,status,inputDesc,outputDesc,desc,tip,icon,nav,checklist:[{sortOrder,item,done}]}]}` — `desc`/`tip`/`icon` từ mảng hằng số tĩnh `STEP_META` (8 phần tử, giữ nguyên copy tiếng Việt của prototype); `nav` = nav key thật để điều hướng (vd bước 4 → `template`, bước 6 Simulation → `null` vì màn chưa dựng).
- Package mới `activity`: `ActivityLog`(PK `id` auto, `occurredAt`, `actor`, `action`, `entityType`, `entityCode` nullable, `detail` nullable). `ActivityLogController` (`/api/activity-logs`): `GET /` trả `{occurredAt,occurredAtLabel,actor,action,actionLabel,entityType,entityCode,channel,detail}`, sắp `occurredAt` giảm dần; `channel` parse regex từ `detail`; `occurredAtLabel` format `dd/MM HH:mm` (tránh nhãn tương đối "hôm nay/hôm qua" của prototype vì phụ thuộc ngày hệ thống, không ổn định).

**Frontend:**
- `pages/ReleasePage.tsx`: banner gradient tối `#0B3B2E→#0E5C44` (product từ `maker_checker_process` thật), progress bar `doneCount/totalSteps` thật, 2 tab "Hướng dẫn từng bước"/"Sơ đồ Swimlane". Stepper: timeline trái (8 bước, node tròn + connector, status màu thật từ `step_status`) + panel chi tiết phải (header gradient theo status, desc/input-output/checklist thật/tip, nút "Mở màn liên quan →" điều hướng React Router thật tới nav key nếu có, nút "Hoàn thành bước"/"Mở lại bước" giữ giao diện no-op tooltip "read-only"). Swimlane: dùng CSS Grid (lane=vai trò hàng × cột=bước) thay vì absolute-position canvas của prototype nhưng giữ đúng ý đồ hình (không rút gọn thành detail/list thường — tuân thủ luật cứng "màn builder/biểu đồ"), click node quay lại stepper.
- `pages/ActivityPage.tsx`: dùng chung `ListScreen`, 5 cột Thời gian/Actor/Hành động/Đối tượng(mono, `entityType · entityCode`)/Kênh(chip), `filters=['Actor','Loại','Kênh']`, `actionLabel="Xuất nhật ký"`. Không `onRowClick`.
- `main.tsx`: thêm `release`/`activity` vào `CUSTOM` (không cần Route mới — không có tham số `:id` trong URL của 2 màn này).

Build 0 lỗi TS. Render Playwright (mock đúng shape từ seed thật): stepper hiện đúng 4/8 hoàn thành, bước 5 "Cấu hình Product Config" đang làm (checklist 1/3 done khớp seed), banner "Vay nhanh Xe máy 18 tháng (CFG-0042 → VAR-101)" + "VAR-101" đúng; swimlane hiện đúng 5 lane vai trò × 8 cột bước, màu trạng thái đúng; Activity Log hiện đúng 8/8 dòng, kênh Web/API khớp verbatim seed. OK.

**Nhóm "Công cụ/Hệ thống" phần Release + Activity Log HOÀN TẤT** sau giai đoạn này.

### Giai đoạn 19 — Simulation Engine (form + annuity engine thật), verified — mục 3C, phần 10% CÓ TÍNH TOÁN

**Bối cảnh:** khảo sát bundler JS xác nhận `isSimulation` là form tham số (trái, ~15 field: số tiền/kỳ hạn/ngày giải ngân/lãi Base Rate/tài sản đảm bảo/phân khúc/2 loại phí/ân hạn + 3 khối tình huống Phạt trễ hạn/Trả bớt gốc/Tất toán sớm) + panel kết quả (phải: KPI card, kiểm tra ràng buộc, cashflow, lịch trả nợ, so sánh phương án ghim A/B/C/D). Bundler tính bằng JS thuần `simData()`/`annuity()` (không gọi API) nhưng công thức khớp CHÍNH XÁC seed thật `simulation_scenario` id=1 (CFG-0042/VAR-101, 30tr/18 tháng/1.5%/tháng → PMT tính tay = 1.914.173đ, khớp cột `monthly_payment` + `simulation_schedule_row` 18 dòng).

**Quyết định kiến trúc quan trọng:** đây là phần 10% DUY NHẤT của dự án có TÍNH TOÁN thật ở backend (PROJECT_STATUS mục 2.2, CLAUDE.md). Nút "Chạy mô phỏng" gọi THẬT `POST /api/simulation/run` — khác biệt với MỌI nút khác trong dự án (luôn no-op tooltip "read-only"). Endpoint này **không ghi DB**, chỉ nhận tham số tính và trả kết quả.

**Backend** — package mới `simulation` (Lớp IV):
- `SimulationScenario`/`SimulationScheduleRow`(+Id composite `[scenario_id, period_no]`) — entity read-only, chỉ dùng cho `GET /api/simulation/default` (đọc 1 scenario mẫu thật id=1 + 18 dòng schedule, nạp state ban đầu cho form).
- `SimulationRequest` (DTO POST body): amount/months/baseRatePct/assetValue/segmentCode/startDate/appraisalFee/periodicFeePct/graceMonths + 3 bộ cờ tình huống (`penaltyOn/penaltyPeriod/penaltyDays`, `prepayOn/prepayPeriod/prepayAmount`, `earlyOn/earlyPeriod/earlyPenaltyPct`) — các cờ tình huống **không có cột lưu** trong `simulation_scenario` (chỉ ảnh hưởng runtime, đúng bản chất "mô phỏng tuỳ ý" chứ không phải dữ liệu đã chốt).
- `SimulationEngine` (class tiện ích thuần Java, không phụ thuộc Spring/DB) — cổng lại `annuity()`/`simData()` của bundler: PMT dư nợ giảm dần `balance×r/(1-(1+r)^-k)`; ân hạn (kỳ ân hạn chỉ trả lãi+phí, PMT tính trên số kỳ còn lại sau ân hạn); trả bớt gốc (tái tính PMT phần dư nợ còn lại từ kỳ kế); tất toán sớm (trả hết dư nợ + % phạt tại kỳ chỉ định, dừng lịch sớm); phạt trễ hạn (`PMT×(số ngày trễ/30)×lãi×1.5`). Điều chỉnh lãi theo tier: `standard`=0/`loyalty`=−0.5/`vip`=−0.3 (sàn 0.3%/tháng) — khớp đúng tên hiển thị thật trong seed `customer_segment.name` ("Khách hàng thân thiết (−0,5%/tháng)"), không bịa số.
- **Lỗi bắt được lúc verify (đã sửa):** "Tổng phải trả" ban đầu tính thiếu — chỉ cộng lãi+gốc+phí quản lý theo kỳ (34.900.634đ), lệch với seed `total_payment`=35.400.634đ. Chênh lệch đúng bằng `appraisal_fee` (500.000đ, phí thẩm định 1 lần lúc giải ngân) — đã sửa công thức cộng thêm `appraisalFee` vào tổng.
- `SimulationController` (`/api/simulation`): `GET /default` (thật, đọc seed) + `POST /run` (tính, KHÔNG ghi DB). Tra `tier` của segment qua `pipeline.CustomerSegmentRepository` (tái dùng entity đã có từ Giai đoạn 14, không tạo trùng).

**Frontend** — `pages/SimulationPage.tsx`: layout 2 cột. Trái: card "Kịch bản mô phỏng" — slider số tiền (3tr-50tr)/kỳ hạn (3-36 tháng)/lãi Base Rate (0.5-2%)/tài sản đảm bảo, input ngày giải ngân, select phân khúc, slider 2 loại phí + ân hạn, 3 checkbox tình huống (mỗi cái mở thêm sub-input khi bật), nút "Chạy mô phỏng" (gọi POST thật) + "Ghim phương án" (lưu snapshot form+result vào state cục bộ, tối đa 3, không ghi DB — nhãn B/C/D). Phải: bảng so sánh phương án (nếu có ghim), 8 KPI card (trả góp/kỳ, tổng lãi, tổng phải trả, LTV, phí quản lý, phạt trễ hạn, đã trả bớt gốc, phạt tất toán sớm — đỏ nếu >0/vượt ngưỡng), khối "Kiểm tra ràng buộc" (verdict Hợp lệ/Không hợp lệ + 4 check: hạn mức/LTV≤80%/lãi≤1.65%/kỳ hạn≤36), bảng lịch trả nợ chi tiết từng kỳ (scroll ngang). Nút "Xuất CSV"/"Xuất PDF" giữ giao diện, no-op tooltip "read-only" (ngoài phạm vi tính toán cốt lõi).

Build 0 lỗi TS. Render Playwright (mock JS annuity y hệt Java engine, độc lập viết lại để kiểm chéo): kịch bản mặc định khớp CHÍNH XÁC PMT 1.914.173đ/tổng lãi 4.455.122đ/tổng phải trả 35.400.634đ/LTV 66,67%/toàn bộ 18 dòng lịch trả nợ với seed thật. Thử tăng số tiền vay lên 40tr (giữ nguyên tài sản 45tr) → LTV nhảy đúng lên 88,89%, verdict chuyển đúng "Không hợp lệ" (check LTV≤80% hiện ✗ đỏ), các số liệu khác tính lại chính xác theo công thức. OK.

**TOÀN BỘ 18 MÀN + Simulation Engine (phần 10% tính toán) CHÍNH THỨC HOÀN TẤT** sau giai đoạn này. Chỉ còn đợt polish cuối (mục 5).

### Giai đoạn 21 — Product Config: VIẾT LẠI theo đúng builder gốc (không phải rút gọn) — sửa lại Giai đoạn 15

**Bối cảnh:** user đối chiếu trực tiếp file prototype gốc (`Product_Factory_5_1.html`, mở bằng `file://`) với bản đã dựng ở Giai đoạn 15 và chỉ ra 2 màn khác nhau quá nhiều — yêu cầu sửa cho **giống 100%** + **backend phải map đúng với giao diện** + **tự bổ sung sample data nếu thiếu**. Trích lại đúng markup `isConfigForm` (bundler dòng 686-837, không phải bản rút gọn đã dựng trước) và logic `configModel()`/`configBase()`/`CFG_PRIORITY`/`CFG_SCOPE_META` (dòng 3767-4090): đây là builder 3 cột **"Cấu hình Product Config"** — sidebar cây Block/Answer Slot (tỉ lệ bắt buộc/tổng), 2 banner (Answer Slot bắt buộc thiếu + cảnh báo ràng buộc Attribute), card chi tiết slot (attribute/data type/ràng buộc/giá trị kế thừa từ Template), form "Thêm Config Fragment" (read-only), bảng fragment theo Selector Scope, và panel **"Xem trước Resolution"** bên phải (chọn People/Place/Time → tính fragment thắng theo độ ưu tiên, y hệt thuật toán `matches()`/`explain` của bundler) — hoàn toàn khác bản trái-phải đơn giản đã dựng trước.

**Đối chiếu dữ liệu bundler vs seed thật:** toàn bộ 15 dòng `configBase()` khớp CHÍNH XÁC 15 fragment thật của CFG-0042 (block/slot/scope/giá trị/`is_warning`/`validation_msg`) — không phải fabricate. Nhưng phát hiện 2 vấn đề dữ liệu mẫu thật:
1. **Lỗi seed:** `product_config.from_template_code` của CFG-0042 trỏ nhầm `TPL-001` (KHÔNG có `template_frame` nào → không suy ra được block nào áp dụng, vỡ toàn bộ builder). Đối chiếu `version_entry` lịch sử ("Khởi tạo Config từ Template TPL-003 v1.2") + cấu trúc block của 15 fragment (khớp đúng 6 block active của TPL-003) → sửa lại `from_template_code` thành `TPL-003` trong `V2__seed.sql`.
2. **Thiếu sample data:** `answer_slot` thật có thêm 3 slot bắt buộc mà bundler's `configBase()` không mô phỏng (`interest_calc` trong Lãi suất, `capacity_range` trong Hạn mức, `asset_valuation` trong Tài sản đảm bảo — bundler chỉ mô phỏng rút gọn 2/3 slot mỗi block này). Bổ sung 3 fragment `default` mới cho CFG-0042, dùng ĐÚNG `default_value` đã có sẵn trong `answer_slot`/`attribute` (không bịa giá trị mới) — nâng tổng fragment CFG-0042 từ 15 → 18.

**Backend** — viết lại hoàn toàn `ProductConfigController#detail` (giữ nguyên `list()`):
- Block "đang áp dụng": suy TRỰC TIẾP từ `fragment` thật của chính config (config đã cấu hình block nào thì hiện block đó) — khớp đúng 6 block của prototype (gồm `BLK_PENALTY` dù Template không framed nó; loại `BLK_BILLING` dù Template có framed nhưng config chưa cấu hình gì ở đó). Chỉ fallback về khung block của `template_frame` khi config hoàn toàn chưa có fragment nào (6 config trống còn lại).
- Trả đủ shape mới: `completeness{reqFilled,totalReq,pct}` (tính theo slot BẮT BUỘC đã điền/tổng bắt buộc mỗi block, không tính slot tùy chọn), `sidebar` (block+slot kèm trạng thái filled/required), `missingRequired`, `constraintIssues` (fragment có `is_warning=true`), `slots` (map theo slot code, đủ `attributeCode/attributeName/dataTypeName/constraintText/inheritedFrameValue/fragments`), `peopleOptions`/`placeOptions`/`timeOptions` (suy thật từ `fragment.scope_value` phân tách theo dấu phẩy cho Place, token nguyên cho Time; People cố định Standard/Loyalty/VIP khớp `customer_segment.tier`).
- `constraintText` lấy `attribute_constraint.expression` ưu tiên `kind='regulatory'` (khớp đúng prototype "≤ 1,65%/tháng (trần NHNN)", "≤ 80%") rồi mới tới constraint đầu tiên có expression.
- Bug tự bắt lúc code: khóa ghép `blockId+slotCode` ban đầu nối chuỗi không có ký tự phân cách (dễ đụng độ) — sửa dùng `'|'` làm separator tường minh; cũng tái lặp lỗi unboxing `Short→int` đã gặp ở Giai đoạn 15 (`scope.getPriority()` trong ternary) — sửa bằng biến `int priority` tường minh.

**Frontend** — viết lại hoàn toàn `ProductConfigDetailPage.tsx` theo đúng layout 3 cột trích từ markup: header (badge trạng thái, vòng tròn % hoàn thành, nút Phiên bản/Lưu nháp/Trình duyệt — no-op tooltip "read-only"); sidebar trái (cây block/slot, chấm màu theo trạng thái); giữa (2 banner, card slot đã chọn, form "Thêm Config Fragment" giữ giao diện disabled, bảng fragment theo Selector Scope); phải (panel Resolution — 3 dropdown People/Place/Time **tương tác thật client-side** vì đây là phép chọn xác định trên dữ liệu đã có, không phải tính toán cần backend — hiện giá trị resolve + lý do + danh sách "Cách resolve" với ★/✓/○, nút "Mô phỏng với cấu hình này →" điều hướng thật sang `/simulation`).

Build 0 lỗi TS. Render Playwright (mock đúng shape mới, tay tính từ seed đã sửa): sidebar hiện đúng 6 block theo đúng tỉ lệ bắt buộc (2/2, 2/2, 2/3, 2/3, 3/3, 1/1 — tổng 12/14 = 86%, khác số 82%/9-11 tĩnh của prototype do schema thật có nhiều slot bắt buộc hơn bản demo rút gọn, nhưng đúng 2 slot thiếu y hệt "Rate Type"/"Lịch trả"); chọn "Base Rate" → card chi tiết đúng attribute/data type/ràng buộc/giá trị kế thừa Template; đổi ngữ cảnh People=Loyalty/Place=HCM → panel Resolution tính đúng người thắng (People·Loyalty, ưu tiên 3), lý do đúng, danh sách 5 fragment đúng ★/✓/○ — khớp gần như tuyệt đối ảnh chụp gốc của prototype user cung cấp.

**Lưu ý vận hành quan trọng:** sửa `V2__seed.sql` sau khi Flyway đã chạy migration này trên DB đang có → lần `docker compose up` kế tiếp Flyway sẽ báo lỗi checksum mismatch. Cần `docker compose down -v` (xóa volume Postgres) rồi `up --build` lại để nạp seed mới — đã báo cho user.

---

### Giai đoạn 22 — Audit toàn diện sample data: lấp mọi lỗ hổng quan hệ N:1/N:M còn trống dòng

**Bối cảnh:** user yêu cầu kiểm tra chéo 7 khu vực (Business Intent, Product Intent, Product Pattern, Product Template, Product Config, Block & Answer Slot, Attribute) xem quan hệ nào còn thiếu dữ liệu con, tự động bổ sung — không fix cứng, không bịa số. Query trực tiếp DB thật (`docker compose exec db psql`) đếm số dòng con theo từng FK thay vì chỉ đọc seed file, phát hiện 5 lỗ hổng thật (Pattern + Block/AnswerSlot đã đầy đủ, không cần sửa):

1. **`business_intent_kpi`**: 5/7 Business Intent (BI-02,03,04,05,07) có 0 dòng KPI (chỉ BI-01 và BI-06 có). Bổ sung 3 KPI/BI, nội dung suy diễn thẳng từ cột `objective` đã có sẵn của từng BI (không bịa số liệu ngẫu nhiên — vd BI-02 "Chiếm thị phần vay nhanh tài sản" → KPI dư nợ/số HĐ/thời gian giải ngân cầm cố xe máy).
2. **`product_intent_element`**: 4/6 Product Intent (PI-001,002,004,006) có 0 dòng element nền. Bổ sung bằng cách lấy NGUYÊN VẸN bộ `obligation_type_composition` của Obligation Type mà Pattern gắn với Intent đó dùng (PI-001/006 ← OT_UNSECURED, PI-002 ← OT_FACILITY, PI-004 ← OT_AUTO_PLEDGE) — không tạo mã element mới, chỉ tái dùng element đã tồn tại trong ontology.
3. **`template_frame`**: 5/6 Product Template (TPL-001,002,004,005,006) có 0 dòng khung giá trị (chỉ TPL-003 có, từ Giai đoạn 21). Bổ sung 9-11 dòng/template, slot lấy từ `pattern_block` của Pattern gốc mỗi Template, giá trị suy từ `answer_slot.default_value`/`attribute.default_value` đã có, điều chỉnh hợp lý theo đối tượng KH (cá nhân/doanh nghiệp) và loại tài sản (xe máy/ô tô/vàng) từng template.
4. **`fragment`**: 6/7 Product Config (tất cả trừ CFG-0042) có 0 dòng fragment — **vi phạm trực tiếp bất biến đã ghi trong comment DDL bảng `fragment`**: "mỗi (config, slot) phải có ≥1 fragment scope=default". Bổ sung 11-16 fragment/config (default cho mọi slot bắt buộc của block đang active + vài scope override cho thực tế — vd CFG-0040 "KH thân thiết" có thêm fragment `people=Loyalty` ưu đãi lãi suất; CFG-0041 "ô tô hạn mức HCM" override `asset_type` từ khung "Xe máy" của TPL-003 thành "Ô tô" + thêm fragment `place=HCM`, minh họa đúng vai trò Config ghi đè Template).
5. **`attribute_enum_value`**: attribute `occupation` có `data_type_code='DT_ENUM'` nhưng 0 dòng enum value (enum rỗng vô nghĩa). Bổ sung 4 giá trị nghề nghiệp phổ biến trong hồ sơ vay KYC.

**Verify:** `docker compose down -v && up --build` chạy sạch (Flyway áp cả 2 migration không lỗi). Query lại DB thật xác nhận mọi FK đã có ≥1 dòng con: `business_intent_kpi` 7/7 BI có KPI, `product_intent_element` 6/6 PI có element, `template_frame` 6/6 template có khung, `fragment` 7/7 config có fragment (11-18 dòng/config), `occupation` có 4 enum value. Gọi thật `GET /api/product-configs/CFG-0021/detail` xác nhận completeness từ 0% (trước đây trống hoàn toàn) lên đúng 15/15 = 100%. `npm run build` frontend 0 lỗi TS (không đổi code frontend, chỉ đổi seed).

**Sửa tiếp (cùng phiên, theo 2 phản hồi trực tiếp của user đối chiếu ảnh chụp thật):**
1. Đợt bổ sung `template_frame` ở trên (mục 3) chỉ phủ 1 vài slot "tiêu đề" mỗi block — vẫn còn nhiều slot **bắt buộc** hiện "chưa đặt giá trị khung" (compliance, interest_calc, repay_method, asset_valuation…) và TPL-003 thiếu hẳn 3 block (ELIGIBILITY/REGULATORY/PENALTY) mà Pattern PT-002 (9 block) thực có. Bổ sung đủ mọi slot bắt buộc + 3 block thiếu.
2. User yêu cầu tiếp: **100% slot phải có giá trị khung, kể cả slot không bắt buộc** — bổ sung nốt 21 dòng còn lại (beneficiary/fee_amount/grace/disb_syntax/transfer_content/occupation/min_amount/billing_day) cho cả 6 template. Slot có `default_value` thật sẵn trong `answer_slot` (min_amount/grace/disb_syntax/billing_day) dùng đúng giá trị đó; slot không có default nào trong DB (beneficiary/fee_amount/transfer_content/occupation) dùng mô tả trung thực đúng ý nghĩa nghiệp vụ (vd occupation "Không giới hạn") — không bịa số liệu giả định. Verify bằng SQL đối chiếu `total_slots` (từ `pattern_block`+`answer_slot`) với `framed_slots` (từ `template_frame`) — cả 6 template đều khớp 100% (18/18, 18/18, 24/24, 18/18, 16/16, 14/14). Playwright chụp lại TPL-001 và TPL-003 xác nhận không còn ô "— chưa đặt giá trị khung —" nào.
3. Sửa layout `ProductTemplateDetailPage.tsx` bước 3 (Giá trị khung Answer Slot): bản dựng trước xếp nhãn phía trên ô hẹp, khác hẳn bundler gốc (dòng 1454-1457) dùng layout hàng ngang (nhãn cố định 200px trái + ô giá trị flex-1 rộng phải) khiến field nhìn nhỏ hơn hẳn — sửa đúng layout hàng ngang, cùng vài chỉnh sửa padding bước 1-2 để khớp pixel.

---

### Giai đoạn 23 — Version History Drawer (nút "Phiên bản" Pattern/Config) — wire thật, không còn no-op

**Bối cảnh:** user đối chiếu ảnh chụp prototype gốc (Pattern PT-002 và Config CFG-0042 đều có drawer "Lịch sử phiên bản" trượt từ phải, hiển thị danh sách version với badge trạng thái/HEAD/Đang hoạt động, danh sách thay đổi, nút So sánh/Xem/Khôi phục) — hỏi liệu cần dựng thêm DB sample. Trước đó nút "Phiên bản" ở cả 2 màn chỉ là no-op (đúng quy ước CUD read-only), nhưng đây thực chất là hành động ĐỌC (xem lịch sử), không phải ghi — nên quyết định wire thật thay vì giữ no-op.

**Backend** — package mới `com.f88.productfactory.version`: `VersionEntry` (entity read-only ánh xạ `version_entry`), `VersionEntryRepository` (native query `findByEntityTypeAndEntityCodeOrderByCreatedAtDesc` — bắt buộc `CAST(:entityType AS version_entity_type_enum)` tường minh vì cột `entity_type` là Postgres enum thật, không phải varchar như đa số bảng khác trong schema — derived query JPQL thường sẽ lỗi "operator does not exist: enum = varchar" nếu không cast), `VersionEntryController` (`GET /api/version-entries?entityType=&entityCode=`) tách cột `note` gộp ("tóm tắt | change1; change2") thành `title` + `changes[]` để khớp đúng cấu trúc card của bundler.

**Frontend** — component dùng chung mới `VersionHistoryDrawer.tsx` (trích đúng markup bundler dòng 2460-2518: overlay mờ, drawer 460px trượt phải, legend "Đang hoạt động"/"HEAD", timeline nút tròn nối đường dọc theo `nodeColor` suy từ active/head, card mỗi version với badge trạng thái + HEAD + Đang hoạt động, danh sách thay đổi dạng mono, nút So sánh/Xem luôn có, Khôi phục chỉ hiện khi `!active && !head` — đúng logic `restorable` gốc). Nút "Phiên bản" ở `ProductPatternDetailPage.tsx`/`ProductConfigDetailPage.tsx` đổi từ no-op sang `onClick` mở drawer thật (duy nhất 2 nút này không còn no-op trong toàn bộ dự án, vì đây là đọc dữ liệu thật chứ không phải CUD).

**Dữ liệu:** đúng như user dự đoán — trước đó CHỈ PT-002 và CFG-0042 có `version_entry` (từ các giai đoạn trước), 5 pattern + 6 config còn lại chưa có dòng nào → nút "Phiên bản" của chúng sẽ trống. Bổ sung 1-3 phiên bản mỗi entity còn thiếu (PT-001,003,004,005,006 và CFG-0021,0037,0038,0039,0040,0041), nội dung suy diễn nhất quán theo trạng thái/tên thật của từng entity (vd CFG-0021 retired có thêm version "Thu hồi sản phẩm laptop ngừng kinh doanh"). Quy tắc gán `is_active`: chỉ `true` cho version HEAD của entity đang ở status `published` thật (đang vận hành) — draft/review/approved/retired đều `is_active=false`, tránh đánh dấu tùy tiện.

**Verify:** `docker compose down -v && up --build` sạch (Java biên dịch entity/repository/controller mới không lỗi sau khi sửa cast enum). `npm run build` 0 lỗi TS. Query DB xác nhận đủ 6/6 pattern + 7/7 config có version_entry. Playwright chụp `/config/CFG-0021` và `/pattern/PT-002` xác nhận drawer mở đúng, dữ liệu khớp DB thật, badge/timeline/nút Khôi phục hiện đúng theo active/head.

---

### Giai đoạn 25 — Simulation Engine: VIẾT LẠI toàn diện theo đúng builder gốc + chọn Variant + real-time

**Bối cảnh:** user đối chiếu 3 ảnh chụp file prototype gốc (`isSimulation`, bundler dòng 1783-2110) với `/simulation` bản dựng trước và thấy khác biệt lớn: (1) bản cũ cố định 1 sản phẩm (CFG-0042/VAR-101), không chọn được Variant khác; (2) thiếu hẳn 2 hàng KPI phụ (phí/phạt/ân hạn/tất toán), panel "Dòng tiền (Cashflow)" với biểu đồ cột + đường thu hồi lũy kế + điểm hòa vốn, và cột Từ ngày/Đến ngày trong lịch trả nợ; (3) phải bấm "Chạy mô phỏng" thủ công thay vì tự tính lại real-time khi kéo thanh trượt. Yêu cầu: sửa cho giống 100% + chọn được sản phẩm + tình huống mô phỏng đầy đủ + real-time.

**Backend** — viết lại hoàn toàn `SimulationEngine.run()` (cổng đúng `simData()` bundler dòng 2787-2864): bổ sung `chart[]` (% chiều cao cột Gốc/Lãi/Phí+Phạt trên `maxBar=pmt*1.6`), `cumPoints` (polyline đường thu hồi lũy kế), `capitalLineY`/`breakevenX` (đường vốn giải ngân + điểm hòa vốn), tag/rowBg mỗi dòng lịch trả nợ (Ân hạn/Phạt/Trả bớt gốc/Tất toán sớm — đúng thứ tự ưu tiên gốc), `periodStart`/`periodEnd`. Sửa 1 lỗi: `totalFee` phải gồm phí thẩm định t0 (khớp `d.totalFee` bundler = apprFee + Σ phí kỳ) — trước chỉ có phí theo kỳ, sai KPI "TỔNG PHÍ"/"LÃI RÒNG".

`SimulationController` thêm `GET /api/simulation/variants` (danh sách 7 Product Variant thật) và `GET /api/simulation/default?variantCode=` suy tham số khởi tạo THẬT từ variant được chọn: parse `limit_range`/`display_rate` (variant) + fragment `ltv`/`installment_count` (config gốc) → amount/months lấy trung điểm khoảng thật, assetValue suy từ amount/LTV — không bịa số cho sản phẩm khác VAR-101. Kèm theo đó, ràng buộc "trong hạn mức"/"kỳ hạn hợp lệ" cũng phải lấy THEO ĐÚNG khoảng thật của từng sản phẩm (`amountMin/amountMax/termLimit`) thay vì hardcode 1 khoảng cố định của bundler (chỉ đúng cho 1 sản phẩm) — nếu không, sản phẩm hạn mức lớn hơn (vd VAR-102 tới 2 tỷ) sẽ luôn bị báo "không hợp lệ" sai.

Phát hiện lúc verify: CFG-0039 (Vay Bullet vàng) có `ltv=85%` (Giai đoạn 22 lỡ đặt) vượt trần 80% thật — sửa lại 80%. Ngược lại VAR-106 (laptop, đã retired) có `base_rate=1,8%/tháng` vượt trần 1,65% — GIỮ NGUYÊN vì đây là sản phẩm đã ngừng, hợp lý diễn giải là lý do bị thu hồi (không phải lỗi cần sửa).

**Frontend** — viết lại hoàn toàn `SimulationPage.tsx` theo đúng layout bundler: dropdown "Sản phẩm (Variant)" thật (đổi sản phẩm → gọi lại `/default?variantCode=` nạp toàn bộ tham số + slider bounds mới), Selector Scope dạng 3 thẻ bấm (không phải `<select>`), 4 khối tình huống (Phạt trễ hạn/Trả bớt gốc/Ân hạn/Tất toán sớm) dùng toggle switch thật + panel tham số ẩn/hiện đúng theo bundler, 3 hàng KPI (chính/phí-phạt/ân hạn-tất toán), panel Kiểm tra ràng buộc, panel Cashflow (4 KPI + biểu đồ cột SVG/CSS tự dựng — không cần thư viện chart, polyline đường thu hồi + mốc hòa vốn + đường vốn giải ngân), bảng lịch trả nợ đủ cột Từ ngày/Đến ngày + tô màu dòng theo tình huống. **Real-time**: mọi thay đổi form (kéo slider, gõ số, bật toggle) debounce 220ms rồi tự `POST /run` lại — không cần bấm nút (nút "Chạy mô phỏng" vẫn giữ để bấm ngay lập tức, không debounce).

**Verify:** số liệu mặc định VAR-101 khớp CHÍNH XÁC ảnh chụp user (1.166.074đ/4.255.330đ/925.533đ/35.196.785đ/15.922đ/8.000.000đ/hòa vốn kỳ 14). Test đổi Variant (VAR-104 Bullet vàng) load đúng tham số suy từ dữ liệu thật, LTV=80% sau khi sửa. Test real-time: kéo Số tiền vay 30tr→10tr, toàn bộ KPI/biểu đồ/bảng cập nhật ngay không cần bấm nút, kể cả phát hiện tất toán sớm tại kỳ 9 do trả bớt gốc tương đối lớn hơn dư nợ còn lại. `docker compose down -v && up --build` sạch, `npm run build` 0 lỗi TS, 6/7 variant hợp lệ (VAR-106 retired cố tình không hợp lệ, đúng lý do thu hồi).

---

### Giai đoạn 26 — Audit toàn dự án tìm dữ liệu fix cứng, sửa lại lấy DB thật

**Bối cảnh:** user yêu cầu duyệt lại toàn bộ dự án xem chỗ nào còn fix cứng (fabricated) thay vì lấy từ database thật. Dùng 2 subagent quét toàn bộ `frontend/src/pages`, `frontend/src/components`, backend Controller — phát hiện 2 lỗ hổng nghiêm trọng và 1 lỗ hổng trung bình.

1. **`DashboardPage.tsx` — 100% hardcode, KHÔNG gọi API nào.** Toàn bộ KPI (Catalog items/Pattern/Config chờ duyệt/Kênh phân phối/Obligation Types), Pipeline 6 bước, "Hoạt động gần đây" (tên người/hành động/sản phẩm/thời gian bịa), "Phân bố theo Obligation Family" đều là mảng hardcode trong source, không liên hệ gì tới DB. Viết lại hoàn toàn: `useEffect` gọi song song `product-intents/patterns/templates/configs/variants/catalogs/obligation-types/obligation-families/activity-logs` (size lớn để lấy hết, đủ nhỏ để không cần phân trang), tính toán mọi con số từ dữ liệu thật (đếm theo `status`, group theo `familyName`, parse chuỗi `channels` để đếm kênh phân phối distinct). "Hoạt động gần đây" dùng thẳng `actor/actionLabel/entityCode/detail/occurredAtLabel` thật từ `/api/activity-logs` (đã sort giảm dần theo `occurredAt`, có sẵn field dịch tiếng Việt).

2. **Sidebar (`nav.ts` + `Layout.tsx`) — mọi số đếm bên cạnh menu (Business Intent 7, Product Config 34, Attribute 64, Block 26, Ma trận 9...) đều là hằng số string hardcode, KHÔNG khớp số dòng thật trong DB** (vd Config thật chỉ có 7 dòng chứ không phải 34 — số cũ từ 1 lần seed trước, đã stale từ lâu không ai phát hiện vì không có gì gọi API để so sánh). Sửa: `nav.ts` đặt toàn bộ `count: null`, `Layout.tsx` thêm `NAV_COUNT_RESOURCES` (map nav key → 1 hoặc nhiều resource cần cộng `totalElements`, vd `obligation` = tổng `obligation-types + obligation-elements + obligation-element-types`, `attribute` = tổng `attributes + attribute-groups + data-types`), fetch lúc mount và merge đè vào `item.count` khi hiển thị. Riêng `matrix` gọi `/api/constraint-matrices` (trả mảng thô không phân trang) nên đếm `.length` client thay vì `totalElements`.

3. **`SimulationEngine.java` — 3 ngưỡng quy định (LTV ≤80%, lãi suất ≤1.65%/tháng, hệ số phạt trễ hạn ×1.5) bị hardcode literal trong code, dù DB đã có sẵn đúng 3 dòng thật trong `attribute_constraint` (kind='regulatory'): `ltv` max 80, `base_rate` max 1.65, `penalty_rate` max 150.** Sửa: thêm `ltvCapPct/rateCapPct/penaltyFactor` vào `SimulationRequest`, `SimulationController` thêm `regulatoryCap(attributeCode)` query `AttributeConstraintRepository.findByAttributeCode()` lọc `kind='regulatory'`, gắn vào request ở cả `/default` và `/run` trước khi gọi engine (`applyRegulatoryCaps()`). `SimulationEngine` dùng giá trị từ request, fallback về hằng số cũ chỉ khi request không kèm theo (gọi trực tiếp không qua Controller). Verify: số liệu VAR-101 sau khi wire DB thật vẫn khớp y hệt kết quả đã verify ở Giai đoạn 25 (1.166.074đ/4.255.330đ/925.533đ/35.196.785đ/hòa vốn kỳ 14) — chứng tỏ DB thật đúng bằng đúng hằng số cũ, chỉ là trước đây không query mà lặp lại thủ công.

**Các mục audit khác được xem xét nhưng QUYẾT ĐỊNH GIỮ NGUYÊN** (không phải data hiển thị bịa, chỉ là cấu trúc/copy UI cố định — chấp nhận được theo tiền lệ Sysmap/Ontology): `ReleaseProcessController` DESC/TIP/ICON/NAV gán theo `stepNo` index (mô tả tĩnh của quy trình chuẩn, không có cột DB tương ứng); `ConstraintMatrixController.COVER_BLOCKS` (danh sách 6 block cố định cho tab "độ phủ" — cấu trúc nghiệp vụ, không phải số liệu); `SimulationEngine.segmentAdjustment()` (−0.5%/−0.3% ưu đãi theo tier Loyalty/VIP — không có cột DB nào lưu mức này, `customer_segment` chỉ có tier/audience, không phải data hiển thị nhầm mà là công thức nghiệp vụ chưa có bảng cấu hình).

Verify: backend compile qua `docker compose up --build backend` (0 lỗi), `npm run build` frontend 0 lỗi TS, curl `/api/simulation/default` xác nhận số liệu không đổi sau khi wire DB thật, Playwright chụp `/dashboard` xác nhận toàn bộ số liệu + sidebar khớp đúng dữ liệu seed thật (Intent 6, Pattern 6, Template 6, Config 7, Variant 7, Catalog 6, Obligation Types 9 / 3 family, Attribute 52, Block 12, Matrix 3).

---

### Giai đoạn 27 — Chia lại cấu trúc thư mục backend theo Clean Architecture (layer-first, toàn bộ 151 file)

**Bối cảnh:** user yêu cầu tổ chức lại backend theo Clean Architecture. Trước đó backend tổ chức feature-first (`com.f88.productfactory.{ontology|pipeline|attribute|structure|governance|release|simulation|activity|version|common|config}`, 131 file). Đã hỏi rõ phạm vi trước khi làm (AskUserQuestion) — chọn phương án "toàn bộ backend, layer-first": gộp cả 11 feature vào 4 package layer gốc, mỗi layer chia sub-package theo feature bên trong.

**Cấu trúc mới:**
```
com.f88.productfactory
├── domain
│   ├── model.<feature>        — @Entity + @IdClass (composite key) — 57 entity + 15 Id-class, co-located
│   └── repository.<feature>   — Spring Data JpaRepository interfaces (port) — 42 file
├── application
│   ├── common                 — ReadOnlyService<T,ID> (mới) — bọc JpaRepository cho tài nguyên đọc-only thuần
│   ├── dto.simulation          — SimulationRequest (input DTO ranh giới POST /run)
│   └── service.<feature>       — business/join/enrichment logic TÁCH RA từ 19 controller cũ — 20 Service
├── infrastructure
│   └── config                  — WebConfig (CORS)
└── presentation
    ├── common                  — ReadOnlyController<T,ID> (sửa: qua ReadOnlyService thay vì JpaRepository trực tiếp), GlobalExceptionHandler
    └── controller.<feature>    — 26 REST controller, giờ THIN — chỉ ánh xạ HTTP, gọi Service
```

**Cách thực hiện (2 bước, tách rời mechanical move khỏi tái cấu trúc logic để giảm rủi ro):**

1. **Bước 1 — di chuyển cơ học 129/131 file** bằng script Node (`restructure.js`, chạy 1 lần, không commit vào repo): phân loại từng file theo nội dung thật (`@Entity`→domain.model, `extends JpaRepository`→domain.repository, `*Id.java implements Serializable`→domain.model cùng entity, `@RestController`→presentation.controller, `config`→infrastructure.config, `SimulationEngine`→application.service.simulation, `SimulationRequest`→application.dto.simulation), đổi `package` statement, rồi quét lại TOÀN BỘ cây để sửa import (cả import cũ trỏ sai lẫn tham chiếu cùng-package-cũ nay khác-package-mới cần import mới). File `ReadOnlyController.java` xử lý tay riêng (nội dung đổi thật, không chỉ đổi package).
   - **2 lỗi phát hiện & sửa lúc chạy script:** (a) regex thay FQCN không dùng word-boundary khiến tên ngắn là tiền tố tên dài bị ăn nhầm (vd `...ontology.FinancialObligationArchetype` là tiền tố của `...FinancialObligationArchetypeRepository` → bị thay nhầm giữa chuỗi) — sửa thêm `\b` hai đầu; (b) file dùng CRLF (Windows) nhưng regex chèn import mới giả định `\n` thuần nên **không chèn được import nào cả** — sửa dùng `\r?\n`. Cả 2 lần đều revert sạch bằng `git checkout -- backend/` (chưa commit gì) rồi chạy lại từ đầu, không vá file đã hỏng.
2. **Bước 2 — tách 19 controller có nghiệp vụ thật** (join/enrichment/tính toán — khác 7 controller "trivial" chỉ extends ReadOnlyController) thành cặp `XxxService` (giữ nguyên toàn bộ logic, method trả `Optional`/`Page`/`List` thay vì `ResponseEntity`) + `XxxController` thin (chỉ `@GetMapping`/`@PostMapping` gọi thẳng service). Controller lớn nhất: `ProductConfigController`/`SimulationController` (~250-340 dòng logic mỗi cái) tách nguyên vẹn sang Service, không rút gọn/đổi hành vi.

**Verify:** build qua `docker compose up --build backend` sạch ở MỌI bước trung gian (sau bước 1, sau mỗi nhóm controller tách ở bước 2) — không dồn lỗi. Sau khi xong, curl toàn bộ ~20 endpoint đại diện (activity-logs, attributes, attribute-groups, constraint-matrices + pattern-coverage, archetypes, lifecycles, obligation-elements/-types, product-configs/-patterns/-templates/-variants/-catalogs + các `/detail`, release-processes, blocks, version-entries, simulation/default) — số liệu giống hệt trước khi tái cấu trúc (vd Simulation VAR-101 vẫn 1.166.074đ/35.196.785đ, `product-configs/CFG-0042/detail` vẫn 12/14 slot bắt buộc). `npm run build` frontend 0 lỗi (frontend không phụ thuộc cấu trúc package Java, chỉ REST path — không đổi).

### Giai đoạn 28 — Chia lại cấu trúc thư mục frontend theo layer (infrastructure/presentation)

**Bối cảnh:** user yêu cầu kiến trúc lại frontend, đối xứng với backend (Giai đoạn 27). Đã hỏi rõ phạm vi trước khi làm — chọn phương án **chỉ dọn cấu trúc thư mục** (không tách logic fetch API ra khỏi từng trong số 26 page thành custom hook riêng — rủi ro cao hơn nhiều, cần verify lại từng màn bằng Playwright, không cần thiết cho mục tiêu "kiến trúc lại").

**Cấu trúc mới** (`frontend/src/`):
```
├── main.tsx                      — entry + router (giữ ở gốc)
├── infrastructure/
│   ├── api/{client.ts,types.ts}  — REST client mỏng
│   ├── icons.ts                  — ICONS map (35 icon)
│   ├── nav.ts                    — menu sidebar + tiêu đề view
│   └── tables.ts                 — cấu hình DataTable generic
└── presentation/
    ├── components/                — 6 component dùng chung (Layout, ListScreen, Icon, StatusChip, DataTable, VersionHistoryDrawer)
    └── pages/                     — 26 page (list + detail)
```

Di chuyển thuần cơ học bằng `mv` + sửa import bằng `sed` (không đổi 1 dòng logic nào trong bất kỳ page/component nào) — verify bằng cách so **hash bundle JS sau build giống hệt trước khi di chuyển** (`index-DQ8YBQ3i.js`), xác nhận 100% không đổi hành vi. `npm run build` 0 lỗi TS, Playwright chụp `/dashboard` sau khi rebuild Docker render y hệt.

### Giai đoạn 29 — Hoàn thiện click-through list→detail + màn Attribute Usage

**Bối cảnh:** user yêu cầu rà toàn bộ 20 nav key xem bấm vào 1 dòng list có sang detail không, và so với `docs/Product Factory 5.1.html` (prototype gốc) để biết đang thiếu detail nào — tránh tự vẽ thêm detail cho những màn mà bản gốc chưa từng thiết kế.

**Khảo sát (2 Explore agent chạy song song):**
- Code hiện tại trước khi làm: 6/20 nav key đã có `onRowClick` + route detail thật, dữ liệu DB thật (`businessintent`, `intent`, `pattern`, `template`, `config`, `archetype`).
- Prototype gốc: đọc `this.state.view`, mảng `isList` (13 nav chỉ là list thuần), và các setter mang theo id thật (`openArchDetail(code)=>setState({view:'archetypeDetail',archCode:code})`, `openAttrUsage(code)=>setState({view:'attrUsage',attrSel:code})`) — xác nhận **chỉ đúng 2 khu vực** có detail phân theo bản ghi trong bản gốc: `archetype→archetypeDetail` (đã có) và `attribute→attrUsage` (chưa có — chính là nợ 5.4 cũ). `pattern`/`template` có "builder", `config` có "configForm" nhưng `onClick` giống hệt nhau cho MỌI dòng (không truyền id qua state) → không phải detail thật theo định nghĩa của bản gốc. 13 nav còn lại (variant/catalog/obligation/block/matrix/lifecycle/domain/activity/dashboard/ontology/sysmap/release/simulation) không có bất kỳ khái niệm detail nào trong bản gốc.
- User chọn phạm vi (AskUserQuestion): **chỉ làm Attribute Usage**, giữ nguyên 13 list còn lại — đúng nguyên tắc "pixel-perfect từ prototype, không bịa thêm màn bản gốc không có".

**Backend (package `attribute`):**
- Entity mới `AttributeEnumValue`(+`AttributeEnumValueId` composite `attribute_code+sort_order`) + repo `findByAttributeCodeOrderBySortOrder`.
- Thêm method vào repo có sẵn: `TemplateFrameRepository.findByBlockIdAndSlotCode`, `FragmentRepository.findByBlockIdAndSlotCode`, `ProductVariantRepository.findByFromConfigCodeIn` — không có FK trực tiếp attribute→fragment/template_frame, phải bắc cầu qua `answer_slot(block_id,code)`.
- `AttributeUsageService` mới: join attribute→group→domain, constraint, enum values, và với mỗi answer_slot của attribute → template_frame (giá trị khung ở Template) + fragment (giá trị theo Selector Scope ở Config, kèm cờ `isWarning`) → suy ra `usedInVariants` từ tập config_code đã dùng. `AttributeUsageController` mới: `GET /api/attributes/{code}/usage` (404 nếu code không tồn tại).

**Frontend:**
- `AttributePage.tsx`: tab Attribute (tab 0) thêm `onRowClick` → `/attribute/{code}` (2 tab Attribute Group/Data Type giữ nguyên không click, đúng theo prototype).
- `AttributeUsageDetailPage.tsx` mới: trích đúng markup `attrUsageModel()`/`ATTR_USAGE()` từ prototype (mục 8.5, tìm marker `isAttrUsage`/`attrUsage`/`ATTR_USAGE`, unescape thủ công) — rail "CHỌN ATTRIBUTE" (điều hướng nhanh giữa các attribute, dùng danh sách thật từ `/api/attributes`), header định nghĩa, 5-stage lineage (Attribute→Answer Slot→Template→Config→Variant, đếm thật), khối Ràng buộc + khối Giá trị theo Selector Scope (2 cột), bảng Where-used. Bỏ phần `desc` (mô tả) của prototype vì bảng `attribute` không có cột description — không bịa. Route `/attribute/:code` đặt trước `/:view` trong `main.tsx`.

**Verify:** `docker compose build backend` 0 lỗi. Chạy thật, curl `/api/attributes/base_rate/usage`: đúng 2 constraint (regulatory+range), slot `BLK_INTEREST.base_rate`, 6 template (TPL-001..006), 7 config đa scope (default/people/place/time, có 1 case `isWarning:true` ở CFG-0042/HCM,HN), 7 variant. Test `/api/attributes/occupation/usage` (enum, không fragment/variant): trả `constraints:[]`, `enumValues` 4 giá trị, `usedInFragments:[]`, `usedInVariants:[]` — không lỗi, không mảng null. `curl .../does_not_exist/usage` → 404. `npm run build` 0 lỗi TS. Playwright chụp `/attribute` (xác nhận mũi tên click-through xuất hiện) + `/attribute/base_rate` + `/attribute/occupation` (trường hợp rỗng) — bố cục khớp prototype, dữ liệu 100% thật.

### Giai đoạn 30 — Popup xem nhanh Attribute Group / Data Type

**Bối cảnh:** sau Giai đoạn 29, user hỏi tiếp về 2 tab còn lại (Attribute Group, Data Type) trong màn Attribute — cũng so với prototype gốc. Đối chiếu markup gốc phát hiện CẢ 2 tab đều có `onClick`, nhưng là `openCreate('attribute')` — mở modal CUD "Tạo Attribute mới" dùng CHUNG với nút "+ Thêm Attribute" góc phải (không mang id riêng theo dòng click). Modal CUD này chưa từng được cài đặt cho bất kỳ nút "Tạo..." nào trong toàn bộ 18 màn (đúng luật cứng "Nút CUD: no-op"). Hỏi lại user có muốn dựng modal tạo/sửa thật không — user chọn **chỉ xem thông tin, không có tác động gì** (không phải CUD).

**Giải pháp:** thêm `InfoModal` (component popup dùng chung, không có nút "Lưu", chỉ "Đóng") trong `AttributePage.tsx`. Bấm dòng ở tab Attribute Group → popup hiện tên/domain/số attribute + danh sách attribute thuộc nhóm (lọc `attrs.content` theo `groupCode`, đã fetch sẵn cho tab Attribute — KHÔNG gọi thêm API). Bấm dòng ở tab Data Type → popup tương tự lọc theo `dataTypeCode`. Đây là UI hoàn toàn mới (prototype gốc không có khái niệm "xem-chỉ-đọc" này, chỉ có modal CUD) nhưng đúng yêu cầu rõ ràng của user, dữ liệu 100% thật (không thêm bảng/cột nào mới).

**Verify:** `npm run build` 0 lỗi TS. Playwright: bấm dòng "Pricing" (Attribute Group) → popup hiện đúng 3 attribute thật (Lãi suất cơ sở/Loại lãi suất/Công thức tính lãi, đúng chip Data Type); bấm dòng "Money" (Data Type) → popup hiện đúng 4 attribute thật (Hạn mức cấp/Số dư tối thiểu/Thu nhập tối thiểu/Số tiền phí, đúng chip Bắt buộc/Tùy chọn) — khớp số đếm hiển thị ở cột "SỐ ATTRIBUTE" ngoài list.

### Giai đoạn 30b — Drill-down xem chi tiết 1 attribute từ popup Group/Data Type

**Bối cảnh:** user muốn khi bấm 1 dòng attribute NGAY TRONG popup Group/Data Type (Giai đoạn 30) thì xem được thông tin chi tiết đầy đủ của attribute đó, không chỉ tên+chip. User cung cấp ảnh chụp trực tiếp từ file prototype gốc (modal "Tạo Attribute mới" — Thông tin cơ bản/Data Type buttons/Ràng buộc chung/Ràng buộc theo kiểu dữ liệu/Tuân thủ & Selector Scope) và đề nghị dùng ĐÚNG bố cục đó làm màn xem-chỉ-đọc.

**2 quyết định đã hỏi user:**
1. Drill-down thay nội dung popup hiện tại (có nút "← Quay lại"), KHÔNG mở popup thứ 2 chồng lên.
2. Bỏ HẲN các trường mockup không có cột DB thật (Số chữ số thập phân, Cho phép giá trị âm, Căn cứ pháp lý dạng text, Scope ưu tiên override riêng theo attribute) — đúng tiền lệ "không bịa dữ liệu" đã áp dụng cho Group/Data Type trước đây.

**Backend:** bổ sung 3 field còn thiếu vào `AttributeUsageService.usage()` (đã có endpoint `/api/attributes/{code}/usage` từ Giai đoạn 29, không tạo endpoint mới): `unique` (is_unique), `nullable` (is_nullable), `defaultValue` (default_value) — cả 3 cột đã có sẵn trong entity `Attribute`, chỉ chưa được đưa vào response trước đó.

**Frontend (`AttributePage.tsx`):** `AttrRefRow` trong popup Group/Data Type giờ có `onClick` gọi `openDrill(code)` — fetch `getDetail('attributes', code, 'usage')`, hiển thị `AttrDetailBody` thay nội dung popup (giữ header/footer/X đóng của `InfoModal`, đổi title/subtitle sang attribute đang xem). Bố cục theo đúng khung mockup: "Thông tin cơ bản" (Mã/Attribute Group/Domain/Đơn vị — `ReadField` dạng ô xám chỉ-đọc), "Data Type" (dãy nút NHƯ THẬT lấy từ `dataTypes` đã fetch — 9 kiểu thật trong DB, không dùng danh sách tĩnh của prototype vì prototype có "Number"/"Date" không tồn tại trong DB — highlight đúng kiểu thật), "Ràng buộc chung" (3 `BoolBadge` Bắt buộc/Duy nhất/Nullable phản ánh đúng boolean thật + Giá trị mặc định nếu có), "Ràng buộc theo kiểu dữ liệu" (tái dùng cách render kind/rule/message giống `AttributeUsageDetailPage`), "Giá trị Enum" (nếu có). Nút "← Quay lại danh sách nhóm/Data Type" chỉ reset state drill, không đóng popup.

**Verify:** `npm run build` 0 lỗi TS. `curl /api/attributes/base_rate/usage` xác nhận `unique:false, nullable:true, defaultValue:"1,5%/tháng"` đúng thật. Playwright: bấm "Lãi suất cơ sở" trong popup Pricing → hiện đúng: Data Type "Percent" highlight xanh giữa 9 nút thật, Bắt buộc=Có/Duy nhất=Không/Nullable=Có, Giá trị mặc định "1,5%/tháng", ràng buộc "Trần/Pháp lý ≤ 1,65%/tháng".

### Giai đoạn 31 — Gộp page list+detail liên quan vào subfolder theo feature

**Bối cảnh:** user yêu cầu "tổ chức lại cấu trúc frontend, đặt folder page rồi chia các file liên quan đến các page vào [feature folder]" — vd business intent, product intent, template. `presentation/pages/` lúc đó có 27 file phẳng; 7 cặp có cả list+detail liên quan chặt (BusinessIntentPage+BusinessIntentDetailPage, v.v.), 13 page chỉ 1 file. Đã hỏi phạm vi trước khi làm — chọn **chỉ gộp 7 cặp list+detail** vào subfolder cùng tên nav key, 13 page đơn lẻ giữ nguyên phẳng (không có gì để nhóm nếu chỉ 1 file).

**Kết quả (`frontend/src/presentation/pages/`):**
```
pages/
├── businessintent/{BusinessIntentPage,BusinessIntentDetailPage}.tsx
├── intent/{ProductIntentPage,ProductIntentDetailPage}.tsx
├── pattern/{ProductPatternPage,ProductPatternDetailPage}.tsx
├── template/{ProductTemplatePage,ProductTemplateDetailPage}.tsx
├── config/{ProductConfigPage,ProductConfigDetailPage}.tsx
├── attribute/{AttributePage,AttributeUsageDetailPage}.tsx
├── archetype/{ArchetypePage,ArchetypeDetailPage}.tsx
└── (13 file phẳng: Dashboard/Block/Matrix/Obligation/Domain/Lifecycle/Ontology/Sysmap/ProductVariant/ProductCatalog/Release/Activity/Simulation)
```
Tên folder = đúng nav key trong `nav.ts` (đối xứng với routing) — không phải PascalCase tên component.

**Cách làm:** `mv` cơ học + `sed` sửa import (`../../infrastructure/` → `../../../infrastructure/`, `../components/` → `../../components/` do sâu thêm 1 cấp) trong 14 file đã chuyển, và sửa 14 dòng import + không cần đổi route trong `main.tsx` (chỉ đổi path import, JSX/route giữ nguyên). Xác nhận trước khi chuyển: không có import chéo giữa các page (grep `from '\./` / `from '../pages'` trong `pages/*.tsx` → rỗng) nên di chuyển an toàn, không cần sửa logic.

**Verify:** `npm run build` 0 lỗi TS, **bundle hash giống hệt trước khi chuyển** (`index-B5Zxx0rS.js`) — xác nhận 100% không đổi hành vi (cùng phương pháp verify đã dùng ở Giai đoạn 28). `git add` xác nhận cả 14 file đều được Git nhận diện là **rename** (không phải xóa+tạo mới). Rebuild Docker frontend, curl smoke-test 7 route (list + detail) đều 200.

### Giai đoạn 32 — Liên kết Catalog ↔ Quy trình phát hành theo trạng thái sản phẩm

**Bối cảnh:** user muốn bấm 1 sản phẩm trong Catalog (status draft/review/approved/published) sẽ chuyển sang màn Quy trình phát hành, hiển thị đúng tiến độ 8 bước khớp trạng thái sản phẩm đó; mặc định vào từ sidebar (không qua Catalog) phải hiển thị done 8 bước.

**Bug thật phát hiện được:** `maker_checker_process` có FK `variant_code` (đúng ý định 1 process/1 variant) nhưng chỉ có **đúng 1 dòng seed** (`VAR-101`, `done_count=4`) — **lệch với trạng thái thật của VAR-101 là `published`** (đáng lẽ done 8/8). Đây là bằng chứng cho thấy lưu số liệu tiến độ tay theo từng variant rất dễ lệch khi status đổi mà quên sửa kèm.

**Quyết định (đã hỏi user, chọn phương án bền hơn):** KHÔNG seed thêm 5 dòng `maker_checker_process` cho các variant còn lại. Dùng đúng 1 dòng hiện có làm **process template** (8 bước title/role/input/output/checklist — mô tả quy trình chuẩn, không đổi theo sản phẩm) và **tính runtime** done/current/upcoming của từng bước từ `product_variant.status` thật — luôn đồng bộ 100% với Catalog, không bao giờ lệch như tình huống VAR-101 vừa phát hiện. Ánh xạ (bước 7 = "Phê duyệt (Maker–Checker)", bước 8 = "Đóng gói & Phát hành Catalog"): `draft→5/8` (bước 6 đang làm), `review→6/8` (bước 7 đang chờ), `approved→7/8` (bước 8 đang làm), `published`/`retired`→`8/8`.

**Backend:**
- `MakerCheckerProcessRepository`: thêm `findFirstByOrderById()` lấy process template, không hardcode id.
- `ReleaseProcessService`: xóa `list()` (không còn nơi gọi); thay `detail(Long id)` bằng `detailByVariant(String variantCode)` — join `ProductVariantRepository` lấy variant thật, tính `doneCount` qua hàm ánh xạ trạng thái, suy ra status từng bước (`stepNo<=doneCount?"done":stepNo==doneCount+1?"current":"upcoming"`), checklist mỗi bước `done = (status bước đó=="done")` — đơn giản hóa nhị phân theo bước (bỏ mức chi tiết "1/3 item" của seed gốc, có ghi rõ đây là đơn giản hóa có chủ đích).
- `ReleaseProcessController`: đổi `GET /{id}/detail` (Long) → `GET /{variantCode}/detail` (String), xóa `GET` list.

**Frontend:**
- `ProductCatalogPage.tsx`: mỗi card thêm `onClick` → `navigate('/release/'+variantCode)` + `cursor:pointer`.
- `main.tsx`: thêm route `/release/:variantCode` (trước `/:view`), giữ `release:<ReleasePage/>` trong `CUSTOM` cho `/release` từ sidebar.
- `ReleasePage.tsx`: bỏ bước `getList` lấy dòng đầu; gọi thẳng `getDetail('release-processes', variantCode ?? 'VAR-101')` (VAR-101 = variant published thật, tự nhiên cho done 8/8 khi không có variantCode trên URL).

**Verify:** curl 4 trạng thái xác nhận đúng số bước done/current/upcoming (`VAR-101` published→8/8 tất cả done; `VAR-104` approved→7/8, bước 8 current; `VAR-105` review→6/8, bước 7 current; `VAR-107` draft→5/8, bước 6 current); `VAR-999` không tồn tại→404. `npm run build` 0 lỗi TS. Playwright: `/release` mặc định→8/8; `/catalog` bấm từng card→điều hướng đúng `/release/{code}` với tiến độ khớp; card Catalog hiển thị đúng 6 trạng thái thật (3 published, 1 approved, 1 review, 1 draft).

---

### Giai đoạn 33 — Bổ sung seed `activity_log` cho đủ dày

**Bối cảnh:** user hỏi màn Nhật ký hoạt động có đang fix cứng data không. Audit đầy đủ (frontend `ActivityPage.tsx`, backend `ActivityLogController`/`ActivityLogService`, DDL, seed) xác nhận **không có gì fix cứng**: mọi field lấy từ `activity_log` thật; `channel` không có cột riêng nhưng suy ra bằng regex trên `detail` text thật (không bịa); nhãn hành động dịch từ `action` code thật qua map có fallback về code gốc nếu chưa map; tổng số dòng dùng `page.getTotalElements()` thật, số "1.284" giả của prototype đã bỏ từ Giai đoạn 18. Vấn đề duy nhất: seed gốc chỉ có **8 dòng** — list trông thưa.

**Giải pháp (user chọn):** bổ sung 20 dòng `activity_log` thật vào `V2__seed.sql` (tổng 28), KHÔNG đổi code. Mỗi dòng mới là 1 sự kiện tạo/gửi duyệt/phê duyệt/xuất bản/thu hồi gắn với **đúng entity + đúng trạng thái thật đã có sẵn trong DB** (vd `BI-04` đang `approved` → dòng log "Phê duyệt Business Intent — ... "; `CFG-0021` đang `retired` → dòng log "Thu hồi Config — ..."), trải trên business_intent/product_intent/product_pattern/product_template/product_config/product_variant — không tạo entity/trạng thái mới, không bịa số liệu.

**Verify:** `docker compose down -v && up --build` (bắt buộc vì sửa `V2__seed.sql` sau khi Flyway đã chạy — đúng lưu ý đã ghi từ Giai đoạn 21). `GET /api/activity-logs` trả `totalElements:28` (từ 8). Playwright chụp màn Nhật ký hoạt động xác nhận 28 dòng đa dạng actor (Trần Lan/Lê Minh/Phạm An/Hệ thống)/hành động/loại đối tượng/kênh (Web/API), tất cả đọc được từ DB thật.

---

### Giai đoạn 34 — Detail cho Lifecycle & State và Domain (UI mới ngoài prototype)

**Bối cảnh:** Giai đoạn 29 đã xác nhận prototype gốc KHÔNG có khái niệm detail cho `lifecycle`/`domain` (chỉ list). User hỏi có ý tưởng gì cho 2 màn này không; sau khi trao đổi ý tưởng (Lifecycle → stepper chuỗi state theo `sort_order`; Domain → danh sách Attribute Group thuộc domain kèm số attribute), user chốt làm cả 2 với yêu cầu rõ: "giao diện phải mượt mà và đẹp mắt".

**Backend:**
- `LifecycleStateRepository`: thêm `findByLifecycleCodeOrderBySortOrder(String)`.
- `LifecycleService`: thêm `detail(String code)` → `{lifecycle:{code,name,governs,status}, states:[{sortOrder,name}], stateCount}`.
- `LifecycleController`: thêm `GET /api/lifecycles/{code}/detail`.
- `AttributeGroupRepository`: thêm `findByDomainCodeOrderByName(String)`.
- `DomainService` (mới, `application.service.attribute`): `detail(String code)` join `AttributeGroup` theo `domain_code` + đếm attribute mỗi group qua `AttributeRepository.countByGroupCode` có sẵn → `{domain:{...}, groups:[{code,name,attributeCount}], groupCount, totalAttributeCount}`.
- `DomainController`: giữ nguyên `list`/`byId` (read-only thuần, kế thừa `ReadOnlyController`), thêm `GET /api/domains/{code}/detail` gọi `DomainService`.

**Frontend:**
- Chuyển `LifecyclePage.tsx` → `pages/lifecycle/`, `DomainPage.tsx` → `pages/domain/` (đúng convention Giai đoạn 31 — cặp list+detail có subfolder riêng); cả 2 thêm `onRowClick` điều hướng sang trang chi tiết.
- `LifecycleDetailPage.tsx` (mới): banner gradient giống `ArchetypeDetailPage`/`ReleasePage`, stat card (số state, "áp dụng cho"), và khối chính là **chuỗi state machine** — vòng tròn đánh số nối bằng mũi tên `Icon name="arrow"`, tô gradient xanh nhạt→đậm theo vị trí (`NODE_TONES`) để phân biệt thứ tự trực quan — **không mang nghĩa done/undone** vì đây là định nghĩa state machine dùng chung, không phải tiến độ của 1 thực thể cụ thể (khác hẳn stepper ở `ReleasePage` vốn tính runtime theo trạng thái 1 variant). Có animation `fadeUp` so le theo index (stagger) + hover scale nhẹ trên từng node cho mượt.
- `DomainDetailPage.tsx` (mới): banner tương tự, 3 stat card (Attribute Group, Tổng Attribute, Thực thể liên quan), khối mô tả, và danh sách Attribute Group dạng card có progress-bar theo tỉ lệ số attribute (so với group nhiều nhất trong domain) + `fadeUp` stagger + hover elevate.
- `main.tsx`: thêm route `/lifecycle/:code` và `/domain/:code` (đặt trước `/:view`), sửa import 4 file theo path mới.

**Verify:** `docker compose up -d --build backend frontend` (build sạch cả Java lẫn TS). Curl: `GET /api/lifecycles/LIFE_CYCLE_TERM_LOAN/detail` → 7 state Draft→Approved→Disbursed→Active→Overdue→Restructured→Closed đúng thứ tự thật; `GET /api/domains/DOM_PRICING/detail` → 2 group (Fee 2 attribute, Pricing 3 attribute) = 5 tổng, đúng thật; mã không tồn tại → 404 cho cả 2 endpoint. Playwright chụp cả 4 màn (2 list + 2 detail) xác nhận giao diện mượt, dữ liệu đúng thật, không bịa gì.

---

### Giai đoạn 35 — Detail cho Block & Answer Slot

**Bối cảnh:** sau Giai đoạn 34, user chỉ ra màn Block & Answer Slot cũng chưa có detail.

**Khác biệt so với Giai đoạn 34:** backend đã sẵn từ Giai đoạn 6 — `BlockService.detail(id)` + `BlockController GET /api/blocks/{id}/detail` được xây trước với chủ đích dự phòng (comment gốc: "cấp nguồn THẬT cho... việc gỡ fix cứng builder Product Pattern"), trả đúng `{block:{id,code,name,bizGroup,gov,status}, slots:[{code,name,required,def,rule,attrCode,attrName,type}]}` join `answer_slot`+`attribute`+`data_type`. **Không cần sửa backend** — chỉ thiếu frontend.

**Frontend:**
- Chuyển `BlockPage.tsx` → `pages/block/` (đúng convention Giai đoạn 31), thêm `onRowClick` điều hướng theo `id` (PK thật của bảng `block`, khác `code`).
- `BlockDetailPage.tsx` (mới): banner gradient giống các detail khác, chip nhóm nghiệp vụ (`bizGroup`) + `StatusChip`; 2 stat card (số Answer Slot, "chi phối bởi" = `gov`); danh sách Answer Slot dạng card — mỗi card có badge `type` (Range/Money/Enum...) + badge Bắt buộc/Tùy chọn, dòng mặc định/ràng buộc nếu có. `fadeUp` stagger theo index + hover elevate, đồng bộ phong cách với `LifecycleDetailPage`/`DomainDetailPage`.
- `main.tsx`: thêm route `/block/:id` trước `/:view`.

**Verify:** curl `GET /api/blocks/BLK_ELIGIBILITY/detail` → 3 slot (age: Range/Bắt buộc/"18–60"/"MIN 18"; min_income: Money/Bắt buộc; occupation: Enum/Tùy chọn) đúng thật. `npm run build` 0 lỗi TS. Docker rebuild frontend only (backend không đổi). Playwright chụp list + detail xác nhận giao diện đẹp, đúng dữ liệu.

---

### Giai đoạn 36 — Detail "thật chi tiết, đẹp, mượt, đầy đủ thông tin" cho Product Variant

**Bối cảnh:** sau Giai đoạn 34-35, user yêu cầu tiếp màn Product Variant, nhấn mạnh rõ mức đầu tư: "thật chi tiết và đẹp và mượt và đầy đủ thông tin" — cao hơn hẳn 2 giai đoạn trước.

**Khác Block (Giai đoạn 35):** backend chưa có sẵn detail nào — phải viết mới hoàn toàn, join nhiều bảng hơn để đạt độ "đầy đủ".

**Backend:**
- `ActivityLogRepository`: thêm `findByEntityTypeAndEntityCodeOrderByOccurredAtDesc(String,String)`.
- `ActivityLogService`: tách phần map 1 dòng `ActivityLog`→`Map` thành `toRow()` private dùng chung; thêm `forEntity(String entityType, String entityCode)` public — tái dùng đúng logic dịch nhãn hành động + suy kênh đã có ở Giai đoạn 33, không viết trùng.
- `ProductVariantService`: inject thêm `ProductTemplateRepository`, `ProductPatternRepository`, `ActivityLogService`. Thêm `detail(String code)`:
  - Lineage ngược: `config = configRepo.findById(fromConfigCode)` → `template = templateRepo.findById(config.fromTemplateCode)` → `pattern = patternRepo.findById(template.fromPatternCode)` (mỗi bước `Optional`, null-safe nếu đứt gãy dữ liệu).
  - `listings`: join `CatalogListingRepository.findByVariantCode` + `ProductCatalogRepository` → `{catalogId, catalogName, channel, publishedDate, status}`.
  - `activity`: `activityLogService.forEntity("ProductVariant", code)` — nhật ký riêng của đúng variant này.
- `ProductVariantController`: thêm `GET /api/product-variants/{code}/detail`.

**Frontend:**
- Chuyển `ProductVariantPage.tsx` → `pages/variant/`, thêm `onRowClick`.
- `ProductVariantDetailPage.tsx` (mới, giàu thông tin nhất từ trước đến nay):
  - Banner + chip family + `StatusChip`.
  - **"Nguồn gốc sản phẩm"**: 4 ô Pattern→Template→Config→Variant nối mũi tên (`LineageBox`); 3 ô đầu bấm được, điều hướng sang `/pattern/:code`, `/template/:code`, `/config/:code` đã có sẵn (tái dùng route, không xây lại màn); ô Variant hiện tại viền xanh highlight.
  - **"Thông tin sản phẩm"**: hạn mức, lãi suất niêm yết, nội dung marketing (ẩn nếu null — variant nào cũng có thể chưa có).
  - **"Quy trình phát hành"**: card CTA điều hướng `/release/{code}` — không lặp lại logic 8 bước, tái dùng thẳng màn Giai đoạn 32.
  - **"Niêm yết Catalog"** + **"Hoạt động gần đây"** (2 cột): card theo từng catalog (icon kênh, ngày niêm yết hoặc "Chưa có ngày niêm yết", `StatusChip`) và timeline chấm tròn (actor, hành động, chi tiết, thời gian, kênh).
  - `fadeUp` stagger theo index trên mọi card con, đồng bộ phong cách Giai đoạn 34-35.
- `main.tsx`: thêm route `/variant/:code` trước `/:view`.

**Verify:** curl `GET /api/product-variants/VAR-101/detail` (published — đủ lineage Pattern PT-002/Template TPL-003/Config CFG-0042, 3 catalog listing published, 1 activity "Xuất bản") và `VAR-107/detail` (draft — lineage khác, 2 catalog `status:draft` với `publishedDate:null`, 1 activity "Tạo"); 404 cho mã không tồn tại. `npm run build` 0 lỗi TS, Docker rebuild backend+frontend sạch. Playwright chụp cả 2 trạng thái xác nhận giao diện đẹp, mượt, đầy đủ, mọi trường đều thật.

---

### Giai đoạn 37 — Chia detail Product Variant thành 3 tab con

**Bối cảnh:** user phân vân nên xem "chi tiết" (toàn bộ FOA/Block/Attribute/giá trị) ở Catalog hay Variant. Được recommend (và đồng ý): Catalog giữ nguyên trỏ sang Release (đúng ý nghĩa của nó — tiến độ phát hành, chốt từ Giai đoạn 32); nhu cầu "xem toàn bộ" đào sâu ngay trong `ProductVariantDetailPage` vì Variant mới là entity gốc nắm `fromConfigCode`. Do nội dung quá dài nếu nhồi hết vào 1 trang, user chọn chia tab thay vì cuộn dài.

**Không thêm backend mới** — cả 2 tab mới đều gọi thẳng 2 API đã có sẵn từ trước, chỉ khác consumer:
- Tab **"Giá trị cấu hình"**: gọi `GET /api/product-configs/{configCode}/detail` (đã có từ Giai đoạn 21) — hiển thị completeness bar + từng block/slot kèm badge giá trị fragment đã resolve theo scope (vàng nếu `is_warning`), hoặc "Kế thừa Template: X" / "Chưa cấu hình giá trị" khi slot rỗng.
- Tab **"Nghĩa vụ tài chính"**: gọi `GET /api/product-patterns/{patternCode}/detail` (đã có từ Giai đoạn 13) — hiển thị danh sách Obligation Type gán cho Pattern nguồn, kèm tên archetype + vai trò.
- `configCode`/`patternCode` lấy từ chính response `/api/product-variants/{code}/detail` (field `config.code`/`pattern.code` đã có từ Giai đoạn 36) — không cần sửa `ProductVariantService`.

**Frontend:** `ProductVariantDetailPage.tsx` thêm tab bar (style giống toggle "Hướng dẫn từng bước/Swimlane" ở `ReleasePage`); nội dung Giai đoạn 36 giữ nguyên dưới tab "Tổng quan"; 2 component mới `ConfigValuesTab`/`ObligationsTab` tự fetch lazy khi tab được chọn lần đầu (không fetch trước khi cần).

**Lỗi phát hiện lúc verify:** đoán `role` là `primary`/`secondary` (thường gặp) nhưng DB thật lưu `Primary`/`Support` (viết hoa, khác chữ thứ 2) — sửa lại `ROLE_LABEL` map khớp đúng giá trị thật, không đoán mà không kiểm tra.

**Verify:** Playwright cả 3 tab với VAR-101 — "Giá trị cấu hình" hiện đúng 12/14 slot bắt buộc, đúng giá trị theo từng block (Bên tham gia/Hạn mức/Lãi suất...); "Nghĩa vụ tài chính" hiện đúng 2 Obligation Type (Facility/Primary→Chính, Pledge Installment/Support→Phụ) kèm archetype thật.

---

### Giai đoạn 38 — Hoàn thiện thanh tìm kiếm toàn cục (topbar)

**Bối cảnh:** user yêu cầu "trang nào có thanh tìm kiếm thì hoàn thiện nó". Rà soát toàn bộ frontend phát hiện 2 loại search khác nhau:
1. Search trong từng màn list (`ListScreen.tsx`) — **đã thật từ Giai đoạn 20**, chạy client-side (search + filter dropdown), không cần sửa gì.
2. Thanh search ở **topbar** (`Layout.tsx`) — input placeholder "Tìm mã, sản phẩm, obligation…" + chip "⌘K" — **hoàn toàn trang trí**: không `onChange`, không state, không logic, y nguyên từ lúc trích prototype. Đây là phần thật sự cần hoàn thiện, xuất hiện ở MỌI trang vì nằm trong `Layout`.

**Backend (mới hoàn toàn):**
- `GlobalSearchService` (`application.service.search`): quét trực tiếp 12 repo lõi đã có sẵn — `BusinessIntentRepository`, `ProductIntentRepository`, `ProductPatternRepository`, `ProductTemplateRepository`, `ProductConfigRepository`, `ProductVariantRepository`, `ObligationTypeRepository`, `FinancialObligationArchetypeRepository`, `BlockRepository`, `AttributeRepository`, `DomainRepository`, `LifecycleRepository`. Không thêm query method nào — vì mỗi bảng chỉ vài chục dòng seed, `findAll()` rồi lọc substring không phân biệt hoa/thường trên tên+mã trong Java là đủ hiệu năng, tránh phải viết 12 derived-query lặp lại.
- Guard: query rỗng/< 2 ký tự → trả rỗng ngay (tránh tính toán thừa mỗi phím gõ).
- Mỗi loại giới hạn tối đa 5 kết quả (constant `PER_TYPE_LIMIT`) để không loại nào át hết danh sách.
- `path` trong kết quả trỏ thẳng route chi tiết đã có sẵn của từng loại. Riêng **Obligation Type chưa có trang chi tiết riêng** (chỉ có list 3-tab) — trỏ qua trang Archetype cha (`archetype_code`, cột NOT NULL nên luôn có giá trị) vì đó là nơi thật gần nhất chứa thông tin obligation type, không bịa route giả.
- `GlobalSearchController`: `GET /api/search?q=`.

**Frontend:** `GlobalSearch.tsx` (component mới, thay thế input tĩnh trong `Layout.tsx`): debounce 250ms qua `setTimeout`, dropdown kết quả (icon theo loại tra từ `nav.ts`, tên, mã, `StatusChip`), bấm kết quả → `navigate(path)` + tự đóng + tự xóa query. Phím tắt `⌘K`/`Ctrl+K` focus ô search (khớp chip gợi ý đã có sẵn trong prototype nhưng trước đây không có tác dụng); `Escape` đóng dropdown + blur; click ra ngoài đóng dropdown (event listener `mousedown` trên `document`).

**Sự cố lúc verify (không phải bug code):** test qua `curl` trong Git Bash trên Windows với tiếng Việt có dấu ("xe may"/"lãi suất") trả về rỗng dù dữ liệu có thật — nghi ngờ do Git Bash không encode UTF-8 đúng khi truyền tham số qua shell. Xác nhận bằng cách percent-encode thủ công (`%78%65%20m%C3%A1y`) → trả đúng 6 kết quả — chứng minh backend đúng, lỗi nằm ở công cụ test (`curl`/shell), không phải code. Verify cuối cùng dùng Playwright gõ trực tiếp (encode UTF-8 chuẩn qua trình duyệt).

**Verify:** Playwright gõ "xe máy" ở `/dashboard` → đúng 6 kết quả thật, đa loại (Business Intent BI-02, Product Intent PI-005, 2 Product Config, 2 Product Variant), đều kèm `StatusChip` đúng trạng thái. Bấm kết quả đầu → điều hướng đúng `/businessintent/2`, hiển thị đúng dữ liệu KPI thật.

---

### Giai đoạn 39 — Làm thật nút "Xem trước" ở builder Product Pattern

**Bối cảnh:** nút "Xem trước" trong builder Product Pattern trước đây no-op (`title=READONLY`) như mọi nút CUD khác trong dự án. User hỏi ý tưởng cho nút này trước khi làm. Nhận định: "Xem trước" bản chất là hành động **XEM**, không phải Create/Update/Delete — nên không bắt buộc phải no-op theo luật "Nút CUD: no-op"; đúng tiền lệ nút "Phiên bản" (cũng là hành động xem) đã được làm thật từ trước. Đã lên plan rồi hỏi user 2 quyết định UI qua `AskUserQuestion`:
1. Overlay toàn màn hình (chọn, thay vì drawer trượt) — vì nội dung Pattern có thể dài (nhiều block/slot).
2. KHÔNG thêm nút "In/Xuất PDF" (chọn) — tránh thêm 1 nút no-op mới gây hiểu lầm là làm được.

**Không cần API mới** — toàn bộ dữ liệu Preview cần (`blocks[]` kèm `slots[]` đầy đủ, `assignedOTs[]`, `coverage`) đã có sẵn trong state của trang builder từ `GET /api/product-patterns/{code}/detail` (và `coverage` đã được tính sẵn client-side ở `ProductPatternDetailPage` từ Giai đoạn 13). Preview chỉ là 1 cách trình bày khác của đúng dữ liệu đó — component `PatternPreviewModal.tsx` (mới) thuần render prop, không tự fetch gì.

**Nội dung Preview:**
- Header gradient: tên/mã/status Pattern + nguồn Product Intent.
- 3 stat card: số Block, tổng Answer Slot, số Obligation Type đã gán.
- Khối "Nghĩa vụ tài chính": danh sách Obligation Type (tên, vai trò Chính/Phụ, archetype).
- Khối "Độ phủ theo ma trận": badge theo verdict đã tính sẵn (`coverage.rows`).
- Khối chính "Cấu trúc theo thứ tự lắp ráp": từng Block theo đúng `position`, liệt kê toàn bộ Answer Slot (tên, attribute, kiểu dữ liệu, bắt buộc/tùy chọn, giá trị mặc định).

**Frontend:** `ProductPatternDetailPage.tsx` thêm state `previewOpen`, nút "Xem trước" đổi từ no-op sang `onClick={() => setPreviewOpen(true)}`; render `<PatternPreviewModal>` (overlay `position:fixed; inset:0`) khi `previewOpen`, truyền thẳng `pt`/`data.assignedOTs`/`canvas`/`coverage.rows` đã có sẵn trong component cha — không tính toán lại.

**Verify:** Playwright bấm "Xem trước" ở PT-002 → đúng 9 Block/24 Answer Slot/2 Obligation Type, đúng 6 badge độ phủ (5 "Bắt buộc · đã có" xanh + 1 "Tùy chọn · đã có" lam cho Phạt & Quá hạn), đúng cấu trúc từng block (Điều kiện tham gia: age/Range/Bắt buộc, min_income/Money/Bắt buộc, occupation/Enum/Tùy chọn...).

---

### Giai đoạn 40 — Sửa lệch lifecycle Config↔Variant + thêm cột audit/CDC/governance vào 43 bảng

**Bối cảnh:** user chỉ ra qua UI: màn Product Config `CFG-0042` "Chờ duyệt" nhưng màn Product Variant `VAR-101` đóng gói từ nó lại "Đã xuất bản". Verify bằng SQL join thật theo `from_config_code` (không phải trùng tên) xác nhận đây là lỗi seed data thật (frontend/backend hiển thị đúng những gì DB lưu) — vi phạm thứ tự lifecycle Pattern→Template→**Config→Variant**: Variant là đóng gói TỪ Config nên không thể tiến xa hơn Config nguồn.

**Sửa lệch (chỉ sửa `V2__seed.sql`, không đổi Variant vì nhiều màn khác — Release/Simulation/Catalog — dùng VAR-101 published làm mốc ổn định):**
- `CFG-0042` review→published, `CFG-0041` approved→published, `CFG-0038` draft→review — khớp/vượt status Variant tương ứng.
- Bổ sung `version_entry` (approve/publish/submit_review) + `activity_log` cho từng bước — không đổi trơ 1 cột status.

**Thêm cột audit/governance (theo file DDL mới user cung cấp — đã tự sửa lỗi double-encode UTF-8 trong enum `biz_group_enum` của file gốc trước khi áp dụng, không copy nguyên mojibake):**
- 9 cột audit/soft-delete/CDC (`created_user`, `created_date`, `updated_user`, `updated_date`, `is_deleted`, `deleted_user`, `deleted_date`, `cdc_version`, `cdc_timestamp`) cho **TẤT CẢ 43 bảng**.
- Enum mới `data_sensitivity_enum` + 4 cột governance (`data_owner`, `data_steward`, `sensitivity`, `retention_policy`) cho 8 bảng nghiệp vụ chính (business_intent, customer_segment, product_intent, product_pattern, product_template, product_config, product_variant, product_catalog).
- Cột `status` mới cho `customer_segment`/`product_catalog` (2 bảng trước đây chưa có).
- Toàn bộ cột mới nullable/có DEFAULT nên không phá insert của `V2__seed.sql` (mọi INSERT chỉ định tên cột rõ ràng).

**Verify:** `docker compose down -v && up --build`; SQL join xác nhận mọi `Variant.status` ≤ `Config.status` nguồn; `\d business_intent` xác nhận đủ cột audit/governance với default đúng; API `/api/blocks` trả `bizGroup` tiếng Việt đúng (không mojibake); Playwright UI hiển thị đúng "Đã xuất bản"/"Chờ duyệt" khớp nhau giữa Config/Variant.

---

### Giai đoạn 41 — Sample data "Vay xe máy mùa tựu trường" (sản phẩm đầy đủ, đã duyệt)

**Bối cảnh:** user yêu cầu tạo 1 sản phẩm vay hoàn chỉnh, đi đủ các bước, đã được duyệt qua kiểm duyệt — dùng làm ví dụ mẫu đầy đủ nhất trong hệ thống.

**Quyết định:** tái dùng khuôn `PT-001`/`TPL-001` (published có sẵn, cùng khuôn mà `CFG-0040`/`VAR-103` "xe máy KH thân thiết" đang dùng) thay vì tạo mới Business Intent/Product Intent/Pattern — đúng bản chất kiến trúc Pattern/Template dùng chung, chỉ Config/Variant khác nhau theo mùa/phân khúc.

**Mới:**
- `CFG-0043` 'Vay xe máy mùa tựu trường' ← TPL-001, 17 fragment đủ 15/15 slot bắt buộc (completeness 100%), 2 fragment ưu đãi thời vụ: `base_rate` scope `people`='Học sinh, sinh viên' 0,99%/tháng và scope `time`='Mùa tựu trường (01/08–30/09)' 0,89%/tháng (default 1,3%/tháng).
- `VAR-108` ← CFG-0043, hạn mức 3tr–40tr, niêm yết Catalog App+Web (07/07/2026), `marketing_content` nêu rõ ưu đãi, status `published`.
- `version_entry` CFG-0043 đủ 5 version (draft×2→review→approved→published) + 8 dòng `activity_log` (create/submit_review/approve/publish cho cả CFG-0043 và VAR-108) — dấu vết duyệt đầy đủ, không set thẳng status.

**Verify:** API `/product-configs/CFG-0043/detail` completeness 15/15; `/product-variants/VAR-108/detail` đúng lineage Pattern→Template→Config→Variant + 2 listing + 4 activity; `/release-processes/VAR-108/detail` tự tính đúng done 8/8 (runtime từ status, không cần seed thêm `maker_checker_process`); `GET /api/search?q=tựu+trường` ra đúng cả Config và Variant; Playwright xác nhận UI `ProductVariantDetailPage` hiển thị đúng, đẹp.

---

### Giai đoạn 42 — Nhật ký hoạt động theo audit thật + Menu theo Role người dùng

**Bối cảnh:** user hỏi "nhật ký hoạt động có lưu ai duyệt, ai làm gì cho từng sản phẩm không — ví dụ từ bước tạo mới cần gửi duyệt thì ai gửi, đã duyệt thì ai duyệt", rồi muốn xử lý theo cột audit/governance (Giai đoạn 40 đã thêm `created_user`/`updated_user` nhưng seed chưa từng populate — toàn NULL), đồng ý thêm bảng user thật nếu cần. Kế đó bổ sung thêm yêu cầu: menu sidebar phải lọc theo role người dùng — mỗi role chỉ thấy tab liên quan việc của mình, có 1 role Admin thấy toàn bộ. Do phạm vi lớn (DB + backend + frontend, ảnh hưởng toàn bộ điều hướng) đã dùng `EnterPlanMode` trước khi code.

**Audit hiện trạng (trước khi code):** `ActivityLogService.forEntity()` đã tồn tại (dùng cho "Hoạt động gần đây" ở Variant detail từ Giai đoạn 36) nhưng **chưa có REST endpoint** để Config/Pattern/Template gọi được. `version_entry.author` hiển thị ở "Phiên bản" nhưng chỉ áp dụng pattern/template/config (đúng theo `version_entity_type_enum`, Variant dùng activity_log thay thế — không phải thiếu sót). Sidebar (`Layout.tsx`) đang hiển thị avatar/tên/role **hoàn toàn hardcode** ("PD"/"Phạm Designer"/"Product Owner" — literal string, không lấy từ đâu cả) — không có bất kỳ khái niệm user/role/auth nào trong toàn bộ code.

**Quyết định kiến trúc (đã nói rõ với user):**
- Bộ chọn "đổi vai trò" ở sidebar là **demo kiểu chuyển đổi user** (dropdown, không mật khẩu/session/JWT), lọc menu **thuần phía frontend** — KHÔNG phải hệ thống đăng nhập/bảo mật thật, khớp bản chất "read-only 90%, CUD no-op" của toàn app.
- `activity_log.actor`/`version_entry.author` **giữ nguyên `varchar`** (không đổi thành FK) — cách audit-trail phổ biến (snapshot tên tại thời điểm ghi log), tránh viết lại ~70 dòng INSERT có sẵn.
- Role riêng `user_role_enum` (Product Owner/Product Designer/Checker · Approver/Operations/Admin) — tách khỏi `release_role_enum` cũ (đang dùng cho `process_step.role`, không đụng tới).

**Backend:**
- `V1__schema.sql`: enum `user_role_enum` + bảng `app_user` (id/code/name/role/status + đủ 9 cột audit).
- `V2__seed.sql`: 6 dòng `app_user` — 5 tên đã dùng thật nhất quán trong `activity_log`/`version_entry` từ trước (Phạm An→Product Designer, Trần Lan→Product Owner, Lê Minh→Checker/Approver, Phạm Designer→Product Designer, Hệ thống→Operations), chỉ 1 dòng `Quản trị viên`/Admin là nhân vật mới. Populate `created_user`/`updated_user` cho 6 loại entity (business_intent/product_intent/pattern/template/config/variant) suy **trực tiếp** từ `activity_log` đã có (actor hành động `create`→`created_user`; actor hành động muộn nhất theo `occurred_at`→`updated_user`) — chỉ update dòng có ≥1 activity_log thật; các dòng chưa từng xuất hiện trong activity_log giữ NULL, **kể cả `product_catalog`** (dự tính ban đầu nằm trong nhóm "6 entity chính" nhưng audit lại activity_log xác nhận không có dòng nào nhắc tới catalog → bỏ qua, không suy đoán).
- `AppUser`/`AppUserRepository`/`AppUserController` (`GET /api/users`, thuần đọc, không phân trang — chỉ 6 dòng).
- `ActivityLogController` thêm `GET /api/activity-logs/entity?type=&code=` gọi thẳng `forEntity()` có sẵn.

**Frontend:**
- `infrastructure/user/UserContext.tsx` (mới): Context, fetch `/api/users` 1 lần, lưu lựa chọn vào `localStorage`, mặc định lần đầu = user role Admin (không ai bị ẩn menu khi mới vào).
- `nav.ts`: thêm `roles?: UserRole[]` mỗi `NavItem` (undefined = mọi role thấy — dashboard/activity); gán role cho 17 mục còn lại theo nhóm nghiệp vụ (Product Owner→BI/PI; Product Designer→Pattern/Template/Config/thư viện nền tảng; Operations→Variant/Catalog/Release; Checker/Approver→Pattern/Template/Config/Variant/Matrix để duyệt; Simulation→Designer+Operations).
- `Layout.tsx`: thay khối user hardcode bằng dropdown thật (avatar initials tính từ tên, click mở danh sách `app_user`, chọn → `setCurrentUser`); lọc `NAV` groups/items theo `currentUser.role` trước khi render (Admin bỏ qua lọc, group lọc hết item thì ẩn cả group).
- `components/ApprovalHistory.tsx` (mới, dùng chung): tái dùng đúng style timeline chấm tròn của "Hoạt động gần đây" (Variant detail), gọi endpoint `/api/activity-logs/entity`. Thêm vào `ProductConfigDetailPage`/`ProductPatternDetailPage`/`ProductTemplateDetailPage` (mỗi trang 1 vị trí phù hợp bố cục riêng — cột trái với Config/Template, cuối canvas với Pattern).

**Verify:** curl `/api/users` (đủ 6 user đúng role) + `/api/activity-logs/entity?type=ProductConfig&code=CFG-0043` (đúng 4 dòng create/submit_review/approve/publish); `npm run build` 0 lỗi TS; Playwright: mặc định Admin thấy đủ 20 mục nav; chuyển Trần Lan (Product Owner) → chỉ còn 4 mục (Bảng điều khiển/Business Intent/Product Intent/Nhật ký hoạt động); reload → role giữ nguyên (localStorage); chuyển Lê Minh (Checker/Approver) → đúng 7 mục (Pattern/Template/Config/Variant/Matrix + Dashboard/Activity); vào `/config/CFG-0043` → khối "Lịch sử duyệt" hiện đúng Phạm An tạo (04/07 09:00) → Trần Lan gửi duyệt (05/07 09:15) → Lê Minh phê duyệt (05/07 16:00) → Hệ thống xuất bản (06/07 09:00).

---

### Giai đoạn 43 — Vá lỗ hổng "Lịch sử duyệt" trống trơn trên toàn Pipeline

**Bối cảnh:** user phát hiện qua UI: Template `TPL-001` ("Vay cầm cố trả góp · KH cá nhân") status "Đã xuất bản" nhưng khối "Lịch sử duyệt" (Giai đoạn 42) trống trơn, hỏi "đây là lỗi data hay lỗi do code" và yêu cầu mọi phần thuộc Pipeline sản phẩm phải có lịch sử duyệt khớp cả nhật ký hoạt động lẫn trạng thái sản phẩm.

**Chẩn đoán:** lỗi **data**, không phải code — `ApprovalHistory.tsx`/`GET /api/activity-logs/entity` hoạt động đúng, chỉ là DB thật sự thiếu dòng `activity_log`. Audit mở rộng ra toàn bộ 28 entity Pattern(6)/Template(6)/Config(8)/Variant(8) — không chỉ TPL-001 — bằng cách đối chiếu 3 nguồn: `status` cột thật, `activity_log` (hành động muộn nhất), `version_entry` (head version, nơi đã có). Kết quả: 22/28 entity thiếu 1-4 bước trong chuỗi create→submit_review→approve→publish/retire so với status thật. Đồng thời phát hiện thêm 1 bug tương tự Giai đoạn 40 (Config↔Variant) nhưng ở cấp khác: `product_template` TPL-003 có `status='review'` trong khi `version_entry` head thật (v1.2, is_head=true) đã `published` từ 2026-06-30, và cả 2 Config đóng gói từ nó (CFG-0042/CFG-0041) đều đã published — Template nguồn không thể đứng sau Config trong lifecycle.

**Sửa (`V2__seed.sql`):**
- `product_template`: sửa `TPL-003.status` `review` → `published` (khớp version_entry head + downstream Config).
- Thêm 61 dòng `activity_log` mới (tổng 101, từ 40) — đủ chuỗi khớp ĐÚNG status hiện có của từng entity, tái dùng actor/mốc thời gian từ `version_entry` khi entity đã có sẵn (PT-001/003/005/006, CFG-0021/037/039/040/041, TPL-003) để 2 nguồn không lệch nhau.
- Viết lại toàn bộ khối `UPDATE ... created_user/updated_user` (Giai đoạn 42) cho khớp chuỗi activity_log mới — không còn dòng NULL nào trong 4 loại entity (Pattern/Template/Config/Variant).

**Ngoài phạm vi (đã báo cho user, chưa sửa vì không phải bug được báo cáo lần này):** Business Intent/Product Intent vẫn còn vài dòng thiếu activity_log (không có khối "Lịch sử duyệt" trên 2 màn này nên không hiện lỗi); 5/6 Template (trừ TPL-003) chưa có `version_entry` riêng — nút "Phiên bản" sẽ trống cho TPL-001/002/004/005/006.

**Verify:** SQL đối chiếu `status` thật ↔ hành động `activity_log` MUỘN NHẤT cho toàn bộ 28 entity — khớp 100% (query kiểm chứng, xem log phiên làm việc); Playwright xác nhận `TPL-001`/`TPL-003` hiện đủ 4 bước "Lịch sử duyệt" đúng actor/thời gian.

---

### Giai đoạn 44 — "Lịch sử duyệt" cho Business Intent & Product Intent + filter Hành động ở Nhật ký hoạt động

**Bối cảnh:** ngay sau Giai đoạn 43, user yêu cầu 2 việc: (1) mở rộng "Lịch sử duyệt" lên Business Intent và Product Intent — 2 tầng đầu Pipeline chưa có khối này; (2) đổi filter "Loại" ở màn Nhật ký hoạt động thành filter theo Hành động (Xuất bản, Phê duyệt, ...).

**(1) Lịch sử duyệt cho BI/PI:** cùng phương pháp Giai đoạn 43 — audit 13 entity (Business Intent ×7, Product Intent ×6), đối chiếu status thật ↔ activity_log. Kết quả 8/13 entity thiếu 1-4 bước trong chuỗi create→submit_review→approve→publish so với status thật (BI-01/02/06, PI-001/002/005 thiếu cả 4 bước; BI-03/04/07, PI-003/004 thiếu 1-2 bước). Thêm 32 dòng `activity_log` mới (tổng 133, từ 101); viết lại toàn bộ `UPDATE ... created_user/updated_user` cho `business_intent`/`product_intent` — hết NULL. Frontend: thêm `<ApprovalHistory entityType="BusinessIntent" entityCode={code} />` cuối `BusinessIntentDetailPage.tsx` và `entityType="ProductIntent"` cuối `ProductIntentDetailPage.tsx` — tái dùng nguyên component có sẵn từ Giai đoạn 42, không sửa gì trong component, không API mới.

**(2) Filter Hành động ở Nhật ký hoạt động:** audit `ActivityPage.tsx` phát hiện `filters={['Actor', 'Loại', 'Kênh']}` — nhãn "Loại" **không khớp bất kỳ cột nào** trong `ListScreen.guessColumnIndex()` (so khớp label filter với label cột thật: Thời gian/Actor/Hành động/Đối tượng/Kênh) nên dropdown "Loại" luôn rỗng ("Không có giá trị để lọc") — filter chết hoàn toàn từ khi màn này được dựng, không ai để ý vì trông vẫn có nút bấm được. Đổi `'Loại'` → `'Hành động'` khớp đúng cột "HÀNH ĐỘNG" đã có sẵn dữ liệu (actionLabel dịch từ `action` qua `ACTION_LABEL` ở backend) — `ListScreen` tự suy option filter từ giá trị cột thật nên không cần sửa gì khác, ra ngay đủ 8 giá trị (Tạo/Gửi duyệt/Phê duyệt/Xuất bản/Thu hồi/Gán/Đồng bộ/Cập nhật).

**Verify:** SQL đối chiếu status↔activity_log muộn nhất cho 13 entity BI/PI khớp 100%; Playwright xác nhận BI-01 hiện đủ 4 bước "Lịch sử duyệt" (Trần Lan tạo → Phạm An gửi duyệt → Lê Minh phê duyệt → Hệ thống xuất bản), PI-005 tương tự; filter "Hành động" trên Nhật ký hoạt động mở ra đúng 8 option, lọc được theo từng loại.

---

### Giai đoạn 45 — Màn detail cho Nhật ký hoạt động

**Bối cảnh:** user yêu cầu "làm màn detail cho nhật ký hoạt động". Prototype gốc không có detail cho màn này (xác nhận lại từ audit Giai đoạn 29 — activity chỉ list, không state/setter mang id) nên đây là UI mới, thiết kế theo đúng ngôn ngữ đã dùng cho các detail "ngoài prototype" khác (Lifecycle/Domain/Block — Giai đoạn 34-35): banner gradient, badge màu, `fadeUp`, back-button.

**Backend:** `ActivityLogService.toRow()` bổ sung field `id` (trước đây thiếu — cần để list row biết điều hướng sang đâu). `ActivityLogService.detail(id)` mới, trả thẳng `toRow()` (không bọc thêm object lồng vì chỉ có 1 entity, không có join phụ). `ActivityLogController` thêm `GET /api/activity-logs/{id}/detail`.

**Frontend:**
- Chuyển `ActivityPage.tsx` vào `pages/activity/` (đúng convention Giai đoạn 31 — khi 1 nav key có thêm detail thì gộp subfolder), thêm `onRowClick` điều hướng `/activity/{id}` (cần thêm `id` vào interface `ActivityRow`).
- `ActivityDetailPage.tsx` (mới): banner có badge hành động **tái dùng thẳng `STATUS_COLORS`** (từ `StatusChip.tsx`) qua bảng alias `create~draft, submit_review~review, approve~approved, publish~published, retire~retired` — không bịa màu mới, giữ đúng ngữ nghĩa màu đã có trong app; 4 info card (Actor/Thời gian/Kênh/Đối tượng liên quan); nút "Xem chi tiết" ở card "Đối tượng liên quan" điều hướng đúng route entity nguồn nếu route đó tồn tại — hàm `entityPath()` map `entityType` sang route thật (BusinessIntent/ProductIntent quy đổi code `BI-03`/`PI-003` → id số vì 2 route này dùng `:id` không phải `:code`; Pattern/Template/Config/Variant dùng thẳng `:code`); `AnswerSlot`/`ConstraintMatrix` (không có màn detail riêng) trả `null` → không hiện nút, tránh link chết.
- Khối "Hoạt động liên quan của đối tượng này" **tái dùng THẲNG** component `ApprovalHistory` (Giai đoạn 42) — chỉ thêm 1 prop tùy chọn `title` (mặc định `'Lịch sử duyệt'`) để đổi nhãn phù hợp ngữ cảnh (không phải mọi entity trong hoạt động này đều đang "chờ duyệt" — có thể là AnswerSlot bị `update`), không viết component mới, không thêm API mới (endpoint `GET /api/activity-logs/entity` đã có sẵn từ trước).
- Route `/activity/:id` đặt trước `/:view` trong `main.tsx`.

**Verify:** curl `GET /api/activity-logs/{id}/detail` đúng dữ liệu (`id`, `occurredAt`, `actor`, `action`, `actionLabel`, `entityType`, `entityCode`, `channel`, `detail`) + 404 khi id không tồn tại. Playwright: bấm dòng đầu ở list Nhật ký hoạt động → sang `/activity/1` đúng badge "Xuất bản" (màu published) + info card + khối "Hoạt động liên quan" hiện đủ 4 bước của VAR-108; bấm "Xem chi tiết" nhảy đúng sang `/variant/VAR-108`; test 2 case entity không có detail riêng (`AnswerSlot`, `ConstraintMatrix`) xác nhận không hiện nút "Xem chi tiết", trang vẫn render đầy đủ không lỗi.

---

### Giai đoạn 46 — Tab "Giá trị cấu hình" ở Variant hiện ĐỦ mọi Answer Slot

**Bối cảnh:** user mô tả lại đúng bản chất luồng resolve giá trị: Pattern định nghĩa Block → Template (`template_frame`) cấp giá trị **default** mỗi block+slot → Config (`fragment`) **ghi đè** theo scope → Variant đóng gói từ 1 Config. User muốn tab "Giá trị cấu hình" ở Variant detail hiện **đủ mọi Answer Slot của Pattern** — slot có fragment thì lấy giá trị ghi đè, slot không có thì lấy default Template, hỏi database hiện có phục vụ được không.

**Audit xác nhận lỗ hổng thật:** tab này tái dùng thẳng `GET /api/product-configs/{code}/detail` — API của màn **builder** Config, không phải API riêng cho Variant. Dòng `ProductConfigService.java` (cũ): `Set<String> activeBlocks = fragBlocks.isEmpty() ? frameBlocks : fragBlocks;` khiến **toàn bộ block chưa từng có fragment bị loại khỏi kết quả ngay khi config có fragment ở block khác** — dù block đó có sẵn default từ Template. Đây là quyết định **cố ý** từ Giai đoạn 21 (ghi rõ trong comment) để khớp pixel-perfect 1 ảnh chụp prototype cụ thể (CFG-0042), không phải bug ngẫu nhiên. Kiểm chứng thật: CFG-0042 (pattern 9 block/24 slot) API cũ chỉ trả 6 block/17 slot — mất hẳn `BLK_BILLING`/`BLK_ELIGIBILITY`/`BLK_REGULATORY` (7 slot) dù có default Template. Hệ quả phụ: `completeness.pct` cũng tính thiếu vì chỉ đếm slot trong các block "active". Phát hiện thêm: cột `answer_slot.default_value` (tầng fallback thứ 3 — default riêng của slot) có sẵn trong DB nhưng chưa từng được dùng ở luồng resolve giá trị Config/Variant.

**Quyết định kiến trúc (hỏi user qua `AskUserQuestion`, chọn phương án tách):** KHÔNG sửa `detail()` hiện có — màn builder Config giữ nguyên hành vi cũ (tránh regression 1 màn đã build/verify kỹ). Thêm 1 method + endpoint MỚI riêng cho nhu cầu "xem đủ" của Variant.

**Backend (`ProductConfigService.java`):** tách phần thân vòng lặp block/slot của `detail()` thành private method dùng chung `buildBody(cfg, tpl, patternCode, frameByKey, fragsByKey, blockFilter)` (`blockFilter=null` = không lọc, lấy hết `PatternBlock` của pattern); `detail()` gọi lại với `blockFilter=activeBlocks` y hệt cũ (không đổi hành vi/output). Thêm method mới `resolved(code)` gọi `buildBody` với `blockFilter=null`. Bổ sung field `slotDefaultValue` (= `slot.getDefaultValue()`) vào `slotDetail` — áp dụng cho CẢ 2 method (chỉ thêm field mới, an toàn). `ProductConfigController.java` thêm `GET /api/product-configs/{code}/resolved`.

**Frontend (`ProductVariantDetailPage.tsx` — `ConfigValuesTab`):** đổi fetch từ `getDetail('product-configs', configCode)` sang `getDetail('product-configs', configCode, 'resolved')`. Chuỗi fallback hiển thị mỗi slot mở rộng: fragment (chip ghi đè, giữ nguyên) → `inheritedFrameValue` ("Kế thừa Template: X", giữ nguyên) → **mới:** `slotDefaultValue` ("Mặc định Answer Slot: X") → "Chưa cấu hình giá trị" (giữ nguyên). Không đổi gì `ProductConfigDetailPage.tsx` (builder).

**Verify:** curl `GET /api/product-configs/CFG-0042/detail` (cũ) xác nhận **không đổi** — vẫn 6 block/17 slot, completeness 86% (12/14) y hệt trước khi sửa (không regression builder). Curl `GET /api/product-configs/CFG-0042/resolved` (mới) trả đủ **9 block/24 slot**, completeness đổi thành 67% (12/18 — con số đúng thật, trước đây tính thiếu). Playwright: `/variant/VAR-101` (đóng gói từ CFG-0042) tab "Giá trị cấu hình" hiện đủ 9 block kể cả "Sao kê & Hóa đơn" (BLK_BILLING) trước đây bị ẩn, đúng giá trị "Kế thừa Template" từng slot; `/config/CFG-0042` (builder) không đổi, vẫn đúng 6 block như trước.

---

### Giai đoạn 47 — Simulation Engine bỏ hardcode, tính từ dữ liệu thật của sản phẩm

**Bối cảnh:** sau Giai đoạn 46, user hỏi Simulation Engine (`SimulationService`/`SimulationEngine`) có đang tính từ dữ liệu thật của sản phẩm vay không hay đang hardcode.

**Audit `deriveFromVariant()`** đối chiếu toàn bộ Answer Slot/Fragment/Template Frame thật trong `V2__seed.sql`, chia 3 nhóm:
- **A — đã thật, không sửa:** amount/months/baseRate/LTV (đọc từ `product_variant.limit_range`/`display_rate` + `fragment` thật).
- **B — DB có dữ liệu thật per-product nhưng code hardcode bỏ qua (sửa trong đợt này, theo yêu cầu user):**
  - `appraisalFee` — hardcode `500.000đ` mọi sản phẩm, trong khi `template_frame`/`fragment` slot `fee_amount` (BLK_FEE) có giá trị khác nhau thật (TPL-001=300k, TPL-002=800k, TPL-004=400k...).
  - `segmentCode` — hardcode luôn `SEG_STANDARD`, trong khi `template_segment` cho biết đúng phân khúc thật mỗi Template (TPL-002=`SEG_BUSINESS`, còn lại=`SEG_INDIVIDUAL`).
  - `penaltyFactor` — lấy **trần quy định** `attribute_constraint('penalty_rate').max` làm luôn giá trị áp dụng, chưa đọc chính sách thật của sản phẩm ở slot `penalty_rate` (BLK_PENALTY).
  - `grace` (số ngày trễ hạn được miễn phạt, slot `BLK_PENALTY.grace`) — hoàn toàn chưa đọc ở đâu. Đã hỏi user qua `AskUserQuestion` xác nhận: đây KHÔNG cùng khái niệm với `graceMonths`/`graceOn` có sẵn (ân hạn gốc đầu kỳ vay — nhóm C, người dùng tự bật, không có nguồn DB) — user chọn đưa vào công thức phạt: `billableDays = max(0, penaltyDays nhập − graceDays thật)`.
- **C — genuinely không có nguồn DB, KHÔNG làm trong đợt này (theo yêu cầu user):** `periodicFeePct`, `startDate`, toàn bộ toggle kịch bản penalty/prepay/early/`graceOn`.

**Backend (`SimulationService.java`):** inject thêm `TemplateFrameRepository`/`TemplateSegmentRepository`/`AnswerSlotRepository`. Thêm private method `resolveSlotValue(configCode, templateCode, blockId, slotCode)` — 3 tầng fallback giống Giai đoạn 46 (fragment scope="default" → `template_frame` → `answer_slot.default_value`), cùng 2 parser mới `parseVndAmount` ("300.000đ"→300000) và `parseFirstInt` ("5 ngày"→5). `deriveFromVariant()` giờ resolve `appraisalFee` (slot `fee_amount`) và `segmentCode` (`template_segment` theo Template nguồn) thật, fallback hardcode CHỈ khi cả 3 tầng đều thiếu (giữ tinh thần cũ). `applyRegulatoryCaps()` resolve thêm `penaltyFactor` thật (slot `penalty_rate`) và field mới `graceDays` (slot `grace`) theo `req.getConfigCode()` — áp dụng cho CẢ `getDefault()` và `run()` vì đây là chính sách sản phẩm cố định (khác `appraisalFee`/`segmentCode` — vẫn là input người dùng chỉnh tay trên form, chỉ initial value đổi cho đúng thật). `SimulationRequest` thêm field `graceDays`.

**`SimulationEngine.run()`:** công thức phạt đổi từ `pmt*(penaltyDays/30)*r*penaltyFactor` thành trừ ân hạn trước: `billableDays = Math.max(0, penaltyDays - graceDays)`. Kết quả trả thêm `graceDaysApplied` để minh bạch.

**Frontend (`SimulationPage.tsx`):** thêm `graceDaysApplied` vào interface `RunResult`; card "TỔNG PHẠT TRỄ HẠN" hiện thêm dòng "miễn N ngày đầu (chính sách sản phẩm)" khi `graceDaysApplied>0`.

**Verify:** VAR-101 (CFG-0042←TPL-003, không có `fee_amount`/`penalty_rate` ở cả 3 tầng) đúng fallback `500.000đ` (không phải bug — dữ liệu thật sự không có). VAR-103 (CFG-0040←TPL-001, có `fee_amount`=300.000đ thật) trả đúng `300.000đ` + `segmentCode=SEG_INDIVIDUAL` (không còn `SEG_STANDARD` hardcode). Test phạt trễ hạn 10 ngày với configCode có `graceDays=5`: tổng phạt = 11.086đ; cùng request nhưng bỏ `configCode` (graceDays=0, phạt tính đủ 10 ngày) = 22.172đ ≈ đúng gấp đôi — xác nhận công thức trừ ân hạn hoạt động đúng. Playwright: chọn VAR-103, bật "Tình huống phạt trễ hạn" → card hiện đúng "Kỳ 3 · trễ 10 ngày · miễn 5 ngày đầu (chính sách sản phẩm)".

---

### Giai đoạn 48 — Bổ sung Block "Hạn mức" (BLK_LIMIT) vào Pattern PT-001

**Bối cảnh:** user hỏi tại sao Template TPL-001 có "hạn mức" mà Config/Variant đóng gói từ nó ("Vay xe máy mùa tựu trường" CFG-0043/VAR-108) lại thiếu, yêu cầu thêm cho đủ.

**Audit xác nhận nguyên nhân:** Pattern PT-001 (nguồn của TPL-001 → CFG-0021/CFG-0040/CFG-0043 → VAR-106/VAR-103/VAR-108) **chưa từng gán Block `BLK_LIMIT` vào `pattern_block` ngay từ đầu** — chỉ có 7 Block (Bên tham gia/Tuân thủ/Lãi suất/Phí/Trả nợ/Tài sản ĐB/Phạt trễ hạn). Không phải bug ngẫu nhiên — Pattern gốc thiếu sót từ lúc seed. Phát hiện thêm 1 điểm kiến trúc: `limit_range` hiển thị ở Variant (list, slider Simulation) đọc từ 1 cột riêng `product_variant.limit_range` (text tự do, độc lập hoàn toàn khỏi chuỗi Pattern→Block→Answer Slot) — nên Variant vẫn "có vẻ" đủ hạn mức dù chuỗi Answer Slot hoàn toàn trống, gây cảm giác lệch dữ liệu giữa 2 màn dù bản chất là 2 nguồn khác nhau.

**Sửa (chỉ seed data, không đổi code):** `V2__seed.sql` — thêm `('PT-001','BLK_LIMIT',8,'active')` vào `pattern_block`; thêm `template_frame` default cho TPL-001 (`3tr – 80tr`) và TPL-002 (`50tr – 2 tỷ`, cùng dùng PT-001 nhưng chưa có Config nào nên không ảnh hưởng UI, chỉ để đủ dữ liệu); thêm fragment `limit_amount` (scope `default`) cho CẢ 3 Config đang dùng TPL-001 — khớp ĐÚNG giá trị thật đã có sẵn ở `product_variant.limit_range` của từng Variant tương ứng (VAR-106="2tr–30tr", VAR-103="3tr–80tr", VAR-108="3tr–40tr", quy đổi sang định dạng VND đầy đủ, vd `2.000.000đ – 30.000.000đ`) — không bịa số mới, tái dùng số đã có trong DB. Cũng thêm fragment `capacity_range` (slot bắt buộc thứ 2 của `BLK_LIMIT`) = "Có quản trị" cho cả 3 Config (giá trị đã có tiền lệ ở CFG-0042) để hoàn thiện đủ 100%, tránh vừa thêm Block mới lại vừa tạo ra slot bắt buộc còn thiếu.

**Verify:** `GET /api/product-configs/CFG-0043/detail` (builder) và `/resolved` (Variant tab, Giai đoạn 46) đều lên đúng **17/17 slot bắt buộc = 100%** (trước đó 15/15, +2 do `BLK_LIMIT` có 2 slot bắt buộc, cả 2 đều đã điền). `GET /api/product-patterns/PT-001/detail` trả đủ 8 block, không lỗi. Playwright: `/config/CFG-0043` (builder) hiện đúng nhóm "Hạn mức" trong sidebar Answer Slot; `/variant/VAR-108` tab "Giá trị cấu hình" hiện đúng "Hạn mức cấp: 3.000.000đ – 40.000.000đ".

---

### Giai đoạn 49 — Sửa lệch ưu đãi lãi suất VIP < Thân thiết trong Simulation Engine

**Bối cảnh:** user so sánh 2 phân khúc trong Simulation Engine, phát hiện tổng phải trả của VIP lại LỚN HƠN Thân thiết — ngược trực giác thông thường (VIP phải được ưu đãi bằng hoặc hơn Thân thiết), hỏi đây là lỗi logic hay gì.

**Kiểm chứng bằng test cô lập** (giữ nguyên amount/months/rate/mọi tham số, chỉ đổi `segmentCode`): **logic tính hoàn toàn đúng** theo đúng số đang khai báo — không phải bug code. Nguyên nhân thật nằm ở dữ liệu: bảng `customer_segment` seed gốc lỡ đặt Thân thiết ưu đãi `−0,5%/tháng` CAO HƠN VIP `−0,3%/tháng` (ngược thứ tự thông thường), khiến VIP chịu lãi suất cao hơn Thân thiết → tổng phải trả cao hơn — đúng như tính toán, chỉ là số ưu đãi đặt ngược nhau.

**Quyết định (hỏi user qua AskUserQuestion):** đổi lại đúng thứ tự thông thường (VIP ưu đãi ≥ Thân thiết) thay vì giữ nguyên.

**Sửa:** `V2__seed.sql` đổi `customer_segment.name` (SEG_LOYALTY → `−0,3%/tháng`, SEG_VIP → `−0,5%/tháng`); `SimulationEngine.segmentAdjustment()` đổi `case "loyalty" -> -0.3` / `case "vip" -> -0.5` (trước đó ngược lại); `SimulationPage.tsx` đổi nhãn hiển thị `SEGMENTS` khớp theo.

**Verify:** test cô lập VAR-108 xác nhận VIP giờ đúng 0,8%/th (thấp hơn Thân thiết 1,0%/th) → tổng phải trả VIP (23.249.242đ) thấp hơn Thân thiết (23.451.715đ) — đúng thứ tự mong muốn; Playwright xác nhận UI hiện đúng nhãn "Ưu đãi −0,3%/tháng" (Thân thiết) và "−0,5%/tháng" (VIP).

---

### Giai đoạn 50 — Sửa bug EMI trôi dần khi có phí quản lý + đổi sang tính lãi/phí theo ngày thật (actual/365)

**Bối cảnh:** user gửi file Excel tham chiếu (`docs/Simulation Engine Tính Lịch.xlsx`, mô tả đúng cách công ty tính lịch trả nợ thật), hỏi lịch thanh toán của Simulation Engine có đang tính sai không.

**Kiểm chứng xác nhận bug thật:** khi bật `periodicFeePct > 0`, số tiền trả mỗi kỳ (`payment`) không cố định dù đây phải là khoản vay "trả góp đều" — trôi dần từ 3.001.299đ (kỳ 1) xuống 2.924.802đ (kỳ 8) cho cùng 1 khoản vay 22tr/8 tháng/1,3%/th + phí 0,4%/kỳ. Nguyên nhân: PMT (`annuity(balance, r, months-grace)`) chỉ tính trên lãi suất `r`, sau đó cộng `fee = opening × periodicFeePct` riêng lẻ — vì phí giảm dần theo dư nợ còn gốc+lãi cố định, tổng cộng lại trôi thay vì cố định.

File Excel làm đúng: gộp Lãi + Phí quản lý thành 1 "CPV" (Chi phí vay) theo 1 tỷ lệ tổng, tính EMI cố định trên CPV này, mỗi kỳ tách CPV thực tế trở lại thành Lãi/Phí theo đúng tỷ lệ cấu thành. Ngoài ra còn tính CPV theo SỐ NGÀY THẬT trong tháng lịch (28-31 ngày) chia 365, không cố định "1 kỳ = 1 tháng chẵn"; kỳ cuối có 1 khoản "plug" bù sai số dồn để dư nợ về đúng 0.

**Quyết định (EnterPlanMode do đổi lõi công thức, hỏi user 2 quyết định qua AskUserQuestion, cả 2 chọn "Có"):** (1) sửa PMT tính trên rate gộp lãi+phí; (2) đổi hẳn sang tính CPV theo ngày thật/365.

**Sửa `SimulationEngine.java`:** thêm `rTotal = r + feeMonth`, `dailyRateTotal = rTotal×12/365`; `pmt = annuity(balance, rTotal, months-grace)` (thay vì chỉ `r`); mỗi kỳ tính `daysInPeriod` thật (`ChronoUnit.DAYS.between` 2 mốc `periodStart`/`periodEnd` đã có sẵn trong vòng lặp), `cpv = opening × dailyRateTotal × daysInPeriod`, tách `interest = cpv×(r/rTotal)`, `fee = cpv×(feeMonth/rTotal)`; thêm plug kỳ cuối (kỳ cuối lịch gốc hoặc dư nợ gần 0 → `principal = opening` thay vì đúng PMT, `payment` kỳ đó tự nhiên khác các kỳ trước — khớp hành vi Excel); 2 chỗ tái tính `pmt` giữa vòng lặp (grace kết thúc, có prepay) đổi từ `r` sang `rTotal`. Không đổi `SimulationRequest`/API contract, không đổi công thức `penalty` (không liên quan bug này), không đổi frontend.

**Verify:** dựng lại đúng input Excel (30tr/12th/lãi 1,6%/phí 0,4%) qua `/api/simulation/run` trực tiếp — EMI giờ CỐ ĐỊNH (gần khớp Excel 2.832.000đ, lệch nhỏ do khác giả định làm tròn EMI ban đầu — đã báo trước với user, không cần khớp bit-for-bit), kỳ cuối "plug" đúng đưa dư nợ về 0. VAR-108 (case gây bug ban đầu, phí 0,4%) giờ payment cố định mọi kỳ (trước đây trôi 3.001.299→2.924.802đ). Regression: test penalty/graceDays (Giai đoạn 47) vẫn đúng tỷ lệ 2x giữa graceDays=5 và graceDays=0; test VIP/Thân thiết (Giai đoạn 49) vẫn đúng thứ tự ưu đãi. Playwright xác nhận UI "Lịch trả nợ" hiện đúng "Kỳ trả" cố định mọi kỳ.

**Bổ sung ngay sau đó:** thử đổi EMI ban đầu sang giải lặp (bisection, `solveEmiByDays()`) theo đúng lịch ngày thật để cố khớp sát hơn Excel — nhưng đối chiếu kỹ dữ liệu Excel phát hiện **giả thiết sai**: bản thân Excel cũng KHÔNG giải lặp theo ngày thật (bằng chứng: Excel vẫn "plug" toàn bộ dư nợ còn lại ở kỳ 12 dù EMI cố định — nếu giải lặp đúng theo ngày thật thì tự động về 0, không cần plug). Excel dùng 1 EMI cố định từ công thức riêng (chưa xác định chính xác) + luôn plug kỳ cuối. Đã giữ code `solveEmiByDays()` (kết quả gần tương đương công thức annuity đóng, không tệ hơn) theo yêu cầu user, nhưng ghi nhận đây KHÔNG phải hướng đúng để khớp Excel — nếu cần khớp chính xác hơn, cần user cung cấp thêm công thức Excel gốc tính ra 2.832.000đ.

---

### Giai đoạn 51 — Tái cấu trúc Lõi Nghĩa Vụ Tài Chính theo tài liệu FOA/OET/OE/OT/OTF

**Bối cảnh:** user bổ sung 4 file thiết kế mới vào `docs/` (`Lõi Nghĩa Vụ Tài Chính Của Sản Phẩm Vay`, `Lớp vỏ thương mại`, `Ví dụ xuyên suốt: Ma Trận FOA × OE và Mô Phỏng Xây Dựng OTF`, `Data dictionary: FOA, OET, OE, OT, OTF`) — thực chất là MHTML/Confluence export (không phải `.doc` nhị phân thật), tự viết script Node giải mã quoted-printable + trích HTML→text để đọc được. Yêu cầu đọc rồi giải thích quan hệ FOA/OET/OE/OT/OTF, sau đó hỏi tuần tự: có sửa nhiều không nếu triển khai; Block/Attribute/Answer Slot có ảnh hưởng không; Pattern có còn gọi Block đúng không; các màn Thư viện nền tảng (Obligation Library/Ontology/Sysmap/Archetype/Matrix) có đổi nhiều không; cuối cùng chốt lên plan sửa từ code đến DB.

**Mô hình tài liệu mới:** 6 OET (Obligation Element Type — Party/Value Structure/Activation Logic/Time Structure/Fulfillment Logic/Recovery Anchor) là bộ câu hỏi cố định, đóng. OE (Obligation Element) = câu trả lời cụ thể cho 1 OET. OT (Obligation Type) = tổ hợp đủ 6 OE, tập đóng 7 mã cố định (3 cốt lõi: Giải ngân/Hoàn trả gốc/Trả lãi + 4 phụ trợ: Phí/Phạt/Bảo hiểm/Bàn giao tài sản) — **tên OT bất biến qua mọi FOA**, chỉ OE bên trong biến thiên. FOA (Financial Obligation Archetype — Term Loan/Revolving/Conditional, phân loại theo "ai kiểm soát kích hoạt nghĩa vụ") là tầng ràng buộc quy định OE nào Required/Possible/N.A cho từng OET của 3 OT cốt lõi (Ma trận FOA×OE) — **KHÔNG quyết định OT phụ trợ nào tồn tại**, việc đó do 1 bảng tra ĐỘC LẬP map OE cụ thể → bật/tắt OT phụ trợ (vd Recovery Anchor="Tài sản cầm cố" → bật OT Bàn giao tài sản). OTF (Obligation Type Family) = OT + OE cụ thể đã điền đủ, sẵn sàng tái dùng — khác OT (khuôn trừu tượng còn chỗ trống).

**Đối chiếu với schema/code thật** (nguyên tắc "code là chuẩn", qua nhiều vòng grep/đọc trực tiếp `V1__schema.sql`/`V2__seed.sql`/service Java): khung sườn đã có sẵn ~70% dưới tên gọi khác —
- `financial_obligation_archetype` ≈ FOA (khớp gần như y hệt).
- `foa_element` (archetype_code, element_code, requirement) ≈ Ma trận FOA×OE (khớp đúng ý nghĩa BB/CP/KO).
- `obligation_element_type`/`obligation_element` (đã tồn tại sẵn dưới dạng bảng thật, KHÔNG phải chỉ chuỗi tự do như phỏng đoán ban đầu) ≈ OET/OE — nhưng thiếu `OET_PARTY` và có thêm `OET_NATURE` (pseudo-dimension không có trong 6 OET chuẩn, dùng để định danh Family).
- `obligation_type` (code, name, family_code, archetype_code, status) ≈ **OTF**, không phải OT thật — bị gọi nhầm tên trong code hiện tại.
- `obligation_type_composition` ≈ bảng OT×OET→OE, nhưng **THIẾU 1 CHIỀU CẤU TRÚC THẬT SỰ**: coi 1 OTF chỉ có 1 dòng OET phẳng duy nhất, trong khi tài liệu mô tả 1 OTF là tổ hợp NHIỀU OT lõi (Giải ngân/Hoàn trả gốc/Trả lãi/Bàn giao TS...), mỗi cái có bộ 6 OE riêng.
- 2 chỗ TRÙNG LẶP dữ liệu: `obligation_family` (FAM_LOAN/FAM_FACILITY/FAM_CONDITIONAL) trùng 1:1 với FOA; `foa_element` trùng với `constraint_matrix` (kind=`ARCHETYPE_X_ELEMENT`) — cả 2 đều lưu FOA×OE requirement.

**Xác nhận phạm vi KHÔNG bị ảnh hưởng** (đọc trực tiếp `ProductPatternService.java`): `pattern_block` (Pattern↔Block) và `pattern_obligation_type` (Pattern↔ObligationType) là **2 join hoàn toàn độc lập**, không tham chiếu chéo — nên toàn bộ Block/Attribute/Answer Slot/Constraint/Selector Scope/Fragment/Template/Config/Variant/Catalog/Release **không đổi gì**. Vì mã `obligation_type.code` (OT_PLEDGE_INSTALLMENT...) giữ nguyên không đổi tên, `PatternPreviewModal.tsx`/tab "Nghĩa vụ tài chính" ở Variant detail **không cần sửa code**.

**Quyết định (EnterPlanMode do đổi cấu trúc lõi + nhiều bảng/tầng, hỏi user 3 quyết định qua AskUserQuestion — cả 3 chọn phương án khuyến nghị):** (1) gộp bỏ `obligation_family`, dùng thẳng `archetype_code`; (2) làm ĐỦ theo tài liệu — tách `obligation_type_composition` theo OT lõi, thêm `OET_PARTY`; (3) gộp `foa_element`+`constraint_matrix`(ARCHETYPE_X_ELEMENT) về 1 nguồn duy nhất (`foa_element`).

**Sửa — Schema (`V1__schema.sql`):** xóa bảng `obligation_family` + cột `obligation_type.family_code`; bảng mới `obligation_type_core` (7 dòng cố định: `OT_DISBURSEMENT`/`OT_PRINCIPAL_REPAYMENT`/`OT_INTEREST`/`OT_FEE`/`OT_PENALTY`/`OT_INSURANCE`/`OT_ASSET_HANDOVER`) + `ot_activation_rule` (trigger_element_code → activated_ot_core_code); `obligation_type_composition` thêm cột `ot_core_code`+`leg` (`leg` phân biệt 2 chiều cùng 1 OT lõi, vd Bàn giao TS nhận/trả), PK mở rộng 4 phần.

**Sửa — Seed (`V2__seed.sql`):** thêm `OET_PARTY` + 6 `OE_PARTY_*` (Data dictionary Mục 4.1) + 7 OE mới cần cho OT Giải ngân/Bàn giao TS/Trả lãi mà catalog gốc thiếu (`OE_VAL_FIXED_ONE_OFF`, `OE_VAL_ACCRUAL_ON_BALANCE`, `OE_ACT_CONTRACT_EFFECTIVE`, `OE_ACT_SETTLEMENT_TRIGGER` — mã bổ sung ngoài catalog 36 gốc do Ví dụ xuyên suốt cần "Trigger: tất toán" nhưng Data dictionary bỏ sót, `OE_TIME_POINT`, `OE_FUL_LUMP_SUM`, `OE_REC_NOT_APPLICABLE`). Backfill lại TOÀN BỘ 246 dòng composition cho 9 OTF hiện có: mỗi OTF tách thành `OT_DISBURSEMENT` (OE cố định mọi FOA, đúng "Lưu ý" tài liệu) + `OT_PRINCIPAL_REPAYMENT`/`OT_INTEREST` (tái dùng đúng giá trị Value/Activation/Fulfillment/Recovery/Time cũ, thêm Party) + `OT_ASSET_HANDOVER`×2 chiều cho 8/9 OTF có Recovery=ASSET_PLEDGE (chỉ `OT_UNSECURED` không có, đúng Recovery=UNSECURED); riêng `OT_GUARANTEE`/`OT_COMMITMENT` (FOA_CONDITIONAL) **KHÔNG có `OT_INTEREST`** — đúng đặc điểm tài liệu nêu rõ ("Đặc điểm riêng của FOA_CONDITIONAL: không có OT Trả lãi trong cả 2 OTF"). Xóa dòng `constraint_matrix` id=1 (ARCHETYPE_X_ELEMENT) + toàn bộ `matrix_cell` liên quan.

**Sửa — Backend:** entity/repo/controller mới `ObligationTypeCore` (`/api/obligation-type-cores`), `OtActivationRule`+`OtActivationRuleId` (`/api/ot-activation-rules`) — theo đúng pattern `ReadOnlyController`/`@IdClass` có sẵn; xóa hẳn `ObligationFamily`/`ObligationFamilyRepository`/`ObligationFamilyController`. `ObligationTypeComposition`/`ObligationTypeCompositionId` thêm field `otCoreCode`+`leg`. `ObligationType` bỏ field `familyCode`. `ObligationTypeService` bỏ join family. `FinancialObligationArchetypeService.detail()` thêm field mới `activationRules` (join tên OE trigger + tên OT core, minh bạch quy tắc Mục 6 tài liệu). `ConstraintMatrixService` bỏ `ARCHETYPE_X_ELEMENT` khỏi các switch generic (`legendOf`/`rowHeadOf`/`rowLabel`/`colLabel`), thêm `foaOeMatrix()` derived trực tiếp từ `foa_element` (cùng shape/cơ chế `patternCoverage()` có sẵn) + endpoint `GET /api/constraint-matrices/foa-oe-matrix`.

**Sửa — Frontend:** `ObligationPage.tsx` (Obligation Library) đổi 3→4 tab (thêm "Obligation Type (lõi)" fetch `obligation-type-cores`, bỏ cột Family khỏi tab OTF); `OntologyPage.tsx` bỏ fetch `obligation-families`, group theo Archetype thay Family, khối decomposition nhóm theo (ot_core_code, leg) trước rồi hiện 6 dòng OET bên trong; `ArchetypeDetailPage.tsx` thêm khối "Quy tắc kích hoạt Obligation Type phụ trợ" hiện `activationRules`; `MatrixPage.tsx` tab đầu ("FOA × Obligation Element") đổi nguồn fetch sang `foa-oe-matrix` (tái dùng đúng cơ chế đặc cách đã có cho tab "Pattern × Block"); `SysmapPage.tsx` sửa bảng quan hệ tĩnh (Obligation Type gom nhóm Family → Obligation Type lõi gộp thành OTF); `DashboardPage.tsx` (KPI "phân bố theo Family" mất nguồn — đổi sang phân bố theo Financial Obligation Archetype, dùng thẳng `typeCount` đã tính sẵn ở `/api/archetypes`, code gọn hơn hẳn vì không cần join tay `familyCode`↔`obligation-families` nữa); `tables.ts` (generic fallback DataTable) xóa entry `obligation-families`, thêm entry `obligation-type-cores`/`ot-activation-rules`, cập nhật cột entry `obligation-types`/`obligation-type-compositions`.

**Verify:** `docker compose down -v && up --build` — Maven (backend compile trong container) + Flyway (schema+seed) + `tsc -b` (frontend) đều **0 lỗi**, cả 3 container `Up`/`healthy`. Curl xác nhận: `GET /api/obligation-type-cores` đúng 7 dòng; `GET /api/ot-activation-rules` đúng 1 dòng (`ASSET_PLEDGE→OT_ASSET_HANDOVER`); `GET /api/obligation-type-compositions` tổng đúng **246 dòng** (khớp chính xác tính tay: 6 OTF×30 + 1×18 + 2×24); `OT_UNSECURED` đúng 18 dòng, không có `OT_ASSET_HANDOVER`; `GET /api/constraint-matrices/foa-oe-matrix` khớp y hệt giá trị grid `constraint_matrix` id=1 cũ (16 hàng × 3 cột, đối chiếu trước khi xóa); `GET /api/archetypes/FOA_TERM_LOAN/detail` có thêm `activationRules` đúng; `GET /api/constraint-matrices` giờ chỉ còn 2 dòng (id 2,3, đúng sau khi bỏ id=1). Regression: `GET /api/product-patterns/PT-001/detail` và `GET /api/product-intents/1/detail` không đổi output; `GET /api/archetypes` trả `typeCount` 5/2/2 (tổng 9, đúng cho Dashboard). **CHƯA verify bằng Playwright/trình duyệt thật** — môi trường phiên này không có công cụ browser automation, chỉ xác nhận qua API thật + `tsc` build 0 lỗi; nếu cần chắc chắn tuyệt đối về UI (đặc biệt layout 4-tab mới ở Obligation Library, khối decomposition nhóm theo OT lõi ở Ontology) nên render kiểm chứng ở phiên sau. Đã dọn `docs_extract_tmp/` (thư mục tạm giải mã 4 file .doc, không phải phần vĩnh viễn của repo).

---

### Giai đoạn 51b — Sửa catalog Obligation Element cho đúng Data Dictionary (36 mã đóng)

**Bối cảnh:** ngay sau Giai đoạn 51, user báo "phần Obligation Library vẫn sai", yêu cầu đọc lại thật kỹ Data Dictionary rồi đối chiếu đúng/sai. Đã giải mã lại trực tiếp file MHTML gốc (không dựa trí nhớ) để lấy chính xác 100% nội dung Mục 4 (catalog 36 mã OE).

**Lỗi thật tìm thấy:** ở Giai đoạn 51, chỉ OET_PARTY được thêm đúng 6 mã canonical mới; 5 OET còn lại (Value/Activation/Time/Fulfillment/Recovery) vẫn giữ nguyên 13 mã kiểu cũ (`PRINCIPAL_NO_INCREASE_MULTI_DECREASE`, `EVENT_LENDER_DISBURSEMENT`, `CALENDAR_HAS_CYCLE_HAS_DEADLINE`...) thay vì đổi đúng tên Data Dictionary — quyết định "tránh rename rủi ro vỡ FK" lúc đó khiến tab "Obligation Element" không khớp catalog 36 mã đóng. Đối chiếu chi tiết: VALUE thiếu 3 mã (`OE_VAL_PRINCIPAL_SINGLE_DECREASE`/`OE_VAL_ACCRUAL_ON_OVERDUE`/`OE_VAL_PERCENT_OF_BASE`), ACTIVATION thiếu 3 mã (`OE_ACT_DRAWDOWN_REQUEST`/`OE_ACT_BREACH_EVENT`/`OE_ACT_CHARGEABLE_EVENT`), TIME thiếu 1 (`OE_TIME_UNTIL_EVENT`), FULFILLMENT thiếu 1 (`OE_FUL_PER_REQUEST`) + phát hiện `PAYMENT_BULLET` trùng nghĩa với `OE_FUL_LUMP_SUM` đã thêm sẵn (dư 1 mã), RECOVERY thiếu 2 (`OE_REC_THIRD_PARTY_GUARANTEE`/`OE_REC_RECEIVABLES`).

**Quyết định (hỏi user qua AskUserQuestion về `OE_ACT_SETTLEMENT_TRIGGER` — mã tự thêm ở Giai đoạn 51 cho "Bàn giao TS (trả)" nhưng không khớp mã nào trong 7 mã đóng OET_ACTIVATION):** user xác nhận phạm vi Obligation Library chỉ gồm đúng 4 khái niệm OET/OT/OE/OTF (khớp 4-tab đã dựng, không đổi cấu trúc) — giữ `OE_ACT_SETTLEMENT_TRIGGER` làm mã mở rộng có ghi chú rõ (lỗ hổng của chính tài liệu gốc, không phải tự bịa).

**Sửa (chỉ `V2__seed.sql`, đã grep xác nhận không Java/TSX nào hardcode các mã này):** đổi tên 13 mã sang đúng canonical Data Dictionary; gộp `PAYMENT_BULLET`→`OE_FUL_LUMP_SUM`; thêm 10 mã catalog còn thiếu; áp dụng rename nhất quán ở `obligation_element`, `foa_element`, `obligation_type_composition` (246 dòng), `block.governed_by_element_code`, `product_intent_element` (2 block insert), `ot_activation_rule`.

**Verify:** `docker compose down -v && up --build` 0 lỗi. Curl `obligation-elements` → đúng 40 dòng, nhóm theo OET: PARTY=6/VALUE=8/ACTIVATION=8(7 canonical+1 mở rộng)/TIME=5/FULFILLMENT=5/RECOVERY=5/NATURE=3(lịch sử) — khớp chính xác 6+8+7+5+5+5=36 canonical. `obligation-type-compositions` vẫn đúng 246 dòng, 0 dòng còn dùng mã kiểu cũ. Regression: `blocks/BLK_LIMIT/detail`, `product-intents/1/detail`, `archetypes/FOA_TERM_LOAN/detail` (activationRules), `product-patterns/PT-001/detail`, `constraint-matrices/foa-oe-matrix` đều đúng dữ liệu, chỉ đổi `code` ẩn bên dưới còn `name` hiển thị không đổi.

---

### Giai đoạn 52 — Bỏ "Element Type" thừa (gỡ OET_NATURE, OET_LIFECYCLE)

**Bối cảnh:** user gửi thêm 1 tài liệu mới `docs/Tu_duy_Loi_Nghia_vu_Tai_chinh_v1.0.docx` (BA v1.0, dạng .docx thật — khác 4 file MHTML trước), yêu cầu đối chiếu với Obligation Library, chỉ ra thẳng "cái element type đang bị thừa thãi". Đã giải mã file (unzip + strip XML) và đối chiếu trực tiếp với schema/seed — xác nhận đúng: tab "Element Type" có 8 dòng thay vì đúng 6 chuẩn (Party/Value/Activation/Time/Fulfillment/Recovery).

**Lỗi tìm thấy:** (1) `OET_NATURE` không phải 1 trong 6 OET — tài liệu mới (mục OI-4) nói thẳng đây là "va chạm thuật ngữ", đề xuất "gỡ OET_NATURE, chuyển Nature về thuộc tính của FOA". Kiểm chứng DB xác nhận trùng lặp dữ liệu thật ở 5 chỗ: `product_intent` có CẢ `archetype_code` VÀ `nature_element_code` cùng mã hoá 1 fact (UI lộ rõ 2 cột/card cạnh nhau); `foa_element` có 3 dòng tautology làm nhiễu ma trận FOA×OE (16 hàng thay vì đúng 13); `product_intent_element` có 5 dòng dư; `block.governed_by_element_code` của BLK_LIMIT/BLK_INTEREST/BLK_FEE trỏ vào nature giả (2 block cuối trùng y hệt 1 mã — dấu hiệu gán qua loa, và trường này đã xác nhận CHỈ dùng hiển thị, không dùng cho logic ghép nối); `obligation_element` có 3 dòng thuộc OET_NATURE. (2) `OET_LIFECYCLE` còn thừa hơn — 0 dòng `obligation_element` nào thuộc chiều này, comment trong seed thừa nhận thẳng nó chỉ tồn tại để tab có thêm dòng.

**Quyết định (hỏi user qua AskUserQuestion):** 3 Block ở mục governed_by — chuyển `governed_by_element_code=NULL`, `governed_by_aspect` = mã FOA thật tương ứng (`FOA_REVOLVING` cho BLK_LIMIT; `FOA_TERM_LOAN` cho BLK_INTEREST/BLK_FEE) — giữ đúng ý nghĩa gốc nhưng trỏ FOA thật thay vì nature giả, không bịa liên kết Block↔OE mới.

**Sửa:** `V2__seed.sql` — xóa 2 dòng `obligation_element_type` (NATURE/LIFECYCLE); xóa 3 dòng `obligation_element` thuộc NATURE; xóa 3 dòng tautology trong `foa_element`; bỏ cột `nature_element_code` khỏi INSERT `product_intent`; xóa 5 dòng nature trong `product_intent_element`; sửa `governed_by_element_code`/`governed_by_aspect` của 3 block; co Matrix 2 (`matrix_cell` id=2) từ 6×6 (36 ô) còn 5×5 (25 ô), bỏ hàng/cột OET_NATURE. `V1__schema.sql` — bỏ cột `nature_element_code` + FK + comment khỏi `product_intent`; cập nhật comment `obligation_element_type`/`block`. Backend: `ProductIntent.java` bỏ field+getter `natureElementCode` (controller chỉ serialize entity trực tiếp, không có logic riêng dùng field này). Frontend: `ProductIntentPage.tsx`/`ProductIntentDetailPage.tsx` bỏ cột/card "Obligation nature" (thông tin không mất — "Archetype" đã hiển thị đúng fact này).

**Ngoài phạm vi (để đợt sau nếu user muốn):** tài liệu mới còn nêu OI-4 điểm 2 — đổi tên `OT_*` (tổ hợp OTF, vd `OT_PLEDGE_INSTALLMENT`) → `OTF_*` cho đúng lớp khái niệm; việc này lớn hơn (đổi PK dùng ở nhiều bảng), không thuộc yêu cầu "Element Type thừa" lần này.

**Verify:** `docker compose down -v && up --build` 0 lỗi. Curl xác nhận: `obligation-element-types` đúng 6 dòng; `obligation-elements` đúng 37 dòng (40−3 nature); `constraint-matrices/foa-oe-matrix` đúng 13 hàng (16−3 tautology); `product-intents/{1..6}/detail` không còn `natureElementCode`, `elements` không còn mã nature; `blocks/BLK_LIMIT|BLK_INTEREST|BLK_FEE/detail` → `gov` đúng `FOA_REVOLVING`/`FOA_TERM_LOAN`/`FOA_TERM_LOAN`. Regression: `obligation-type-compositions` vẫn đúng 246 dòng (không đụng OET_NATURE), `product-patterns/PT-001/detail` và `archetypes/FOA_TERM_LOAN/detail` vẫn 200 OK.

---

### Giai đoạn 52b — Đổi nhãn "Element Type" → "OET"

**Bối cảnh:** ngay sau Giai đoạn 52, user hỏi lại "sao trong màn Obligation Library vẫn còn tab tên là element type" — hỏi rõ qua AskUserQuestion thì user xác nhận: không phải còn dữ liệu thừa (đã đúng 6 dòng), mà là **tên nhãn**: "ta có dùng gì tên là element type nữa đâu, cái này phải tên là OET chứ nhỉ".

**Xác nhận:** đối chiếu lại Data Dictionary và tài liệu Tư duy thiết kế — cả 2 luôn dùng "Obligation Element Type" (đầy đủ) hoặc viết tắt "OET", không nơi nào dùng tên chung "Element Type". Trong code, đã có chỗ dùng đúng (`OntologyPage.tsx` card "Obligation Element Type", `tables.ts` title, `SysmapPage.tsx`) nhưng nhiều chỗ khác vẫn dùng bare "Element Type": tab Obligation Library, 2 cột trong `ObligationPage.tsx`, cột `tables.ts`, 3 câu mô tả trong `OntologyPage.tsx`, nhãn tab Matrix 2 (`MatrixPage.tsx`), và `rowHead` trả về từ backend `ConstraintMatrixService.rowHeadOf()` cho kind `ELEMENTTYPE_X_ELEMENTTYPE`.

**Sửa (thuần đổi nhãn hiển thị, không đổi dữ liệu/logic):** `ConstraintMatrixService.java` — `rowHeadOf()` trả `"OET"` thay vì `"Element Type"`. Frontend: `ObligationPage.tsx` tab 3 → "Obligation Element Type (OET)", cột trong tab 2/3 → "OET"; `tables.ts` cột `elementTypeCode` → "OET", title `obligation-element-types` → "Obligation Element Type (OET)"; `OntologyPage.tsx` 3 câu mô tả + card đổi sang "OET"/"(OET)"; `MatrixPage.tsx` nhãn tab "Element Type × Element Type" → "OET × OET".

**Verify:** `docker compose down -v && up --build` 0 lỗi; curl `GET /api/constraint-matrices/2/detail` trả đúng `rowHead: "OET"`.

---

### Giai đoạn 53 — Detail cho Obligation Type Family (OTF)

**Bối cảnh:** user yêu cầu thêm chức năng click detail cho tab OTF trong Obligation Library (trước đây tab này chỉ list, không click được).

**Sửa — Backend:** `ObligationTypeCompositionRepository` thêm `findByObligationTypeCode()`. `ObligationTypeService.detail(code)` mới (mẫu hình giống các `detail()` khác): trả `{otf, archetypeName, patterns:[{patternCode,patternName,role}], otCores:[{otCoreCode,otCoreName,groupKind,leg,elements:[{elementTypeCode,elementTypeName,elementCode,elementName}]}]}` — `patterns` tái dùng `PatternObligationTypeRepository.findByObligationTypeCode()` đã có sẵn (dùng cho Archetype detail), `otCores` nhóm composition theo `(ot_core_code, leg)` — cùng logic OntologyPage đang tính phía client nhưng giờ trả gọn cho đúng 1 OTF thay vì kéo cả 246 dòng composition về frontend rồi lọc. `ObligationTypeController` thêm `GET /{code}/detail`.

**Sửa — Frontend:** chuyển `ObligationPage.tsx` vào `pages/obligation/` (đúng convention khi có detail sibling — Giai đoạn 31). Tab 0 (OTF) của `ListScreen` thêm `onRowClick` → điều hướng `/obligation-type/{code}` (3 tab còn lại không click được, giữ nguyên list thường). `ObligationTypeDetailPage.tsx` mới: banner gradient tím (khác tông xanh Archetype để phân biệt tầng) + 3 stat card (OT lõi/Element/Pattern), khối "Cấu trúc OTF" hiện từng nhóm OT lõi+leg kèm 6 OET dạng lưới thẻ nhỏ, khối "Product Pattern dùng OTF này" (click điều hướng sang `/pattern/:code` có sẵn). Route `/obligation-type/:code` đặt trước `/:view`.

**Verify:** `docker compose down -v && up --build` 0 lỗi; curl `OT_PLEDGE_INSTALLMENT/detail` đúng 5 nhóm OT lõi (Giải ngân/Hoàn trả gốc/Trả lãi/Bàn giao TS×2 leg), mỗi nhóm đủ 6 element, 2 pattern (PT-001 Primary/PT-002 Support); `OT_UNSECURED/detail` đúng chỉ 3 nhóm (không có Bàn giao TS, đúng đặc điểm tín chấp); 404 khi mã không tồn tại.

---

### Giai đoạn 53b — Liên kết OE→Block + layout dạng cột cho detail OTF

**Bối cảnh:** ngay sau Giai đoạn 53, user hỏi "đọc trong các tài liệu thì OE sẽ có block ở trong đó đúng k". Đã giải mã thêm file `docs/Lớp+vỏ+thương+mại.doc` (chưa đọc kỹ ở các đợt trước) để xác nhận.

**Xác nhận:** không phải "OE chứa Block" — tài liệu "Lớp vỏ thương mại" mô tả rõ: OE chỉ định tính ("gốc giảm dần" — như 1 con trỏ hàm, chưa có tham số), Block là **tầng kế tiếp** (Lớp Tham số Định lượng) nhóm các Attribute định lượng hóa OE đó. Đúng khớp quan hệ đã có sẵn trong schema: `block.governed_by_element_code` (Block "chi phối bởi" 1 OE cụ thể). Hiện có đúng 5 Block map vào 5 OE thật (`OE_VAL_PRINCIPAL_MULTI_DECREASE`→BLK_VALUEBASE, `OE_ACT_ON_DISBURSEMENT`→BLK_DISBURSEMENT, `OE_FUL_INSTALLMENT`→BLK_REPAYMENT, `OE_REC_ASSET_PLEDGE`→BLK_COLLATERAL, `OE_TIME_CYCLE_STATEMENT`→BLK_BILLING).

**Sửa:** `BlockRepository` thêm `findByGovernedByElementCode()`. `ObligationTypeService.detail()` — mỗi element trong `otCores[].elements[]` giờ có thêm `blockId`/`blockName` (null nếu không có Block nào chi phối bởi OE đó). Frontend `ObligationTypeDetailPage.tsx`: mỗi thẻ OE có Block hiện chip tím bấm được (điều hướng `/block/:id`).

**Layout:** user phản hồi layout "hơi rối", yêu cầu chia cột. Đổi khối "Cấu trúc OTF" từ lưới thẻ dồn dòng sang bảng 3 cột rõ ràng (OET / Obligation Element / Block) cho từng nhóm OT lõi, ô Block hiện "—" khi không có thay vì ẩn.

**Verify:** `docker compose up --build` 0 lỗi; curl `OT_PLEDGE_INSTALLMENT/detail` xác nhận đúng 5/30 element có `blockName` (Cơ sở giá trị/Giải ngân/Trả nợ/Tài sản đảm bảo — xuất hiện ở cả nhóm Hoàn trả gốc và Trả lãi vì dùng chung OE), còn lại `blockName: null`.

---

### Giai đoạn 54 — Nhất quán hoá nhãn "Obligation Type" → "OTF" (trừ màn Pattern)

**Bối cảnh:** user tiếp tục rà UI, chỉ ra 2 lượt: (1) "đổi tên thành OTF đi ở pattern vẫn để là ot" — muốn đổi hết nhãn "Obligation Type" còn sót sang "OTF", NHƯNG màn Pattern (list/detail/preview modal) giữ nguyên "OT"; (2) "Obligation Type đổi tên thành OTF đi Obligation Type Family" — rút gọn luôn cả dạng đầy đủ "Obligation Type Family (OTF)" thành "OTF" (không cần spell-out).

**Rà soát xác nhận qua AskUserQuestion (chọn "Đổi hết, trừ Pattern"):** các chỗ còn sót "Obligation Type" chung: Archetype (list+detail — StatCard, "OTF thuộc Archetype này"), Matrix (tab "OTF × Block", mô tả, và cả `constraint_matrix.title/description` seed cho ma trận 2/3 — sót từ Giai đoạn 52b vì lúc đó chỉ sửa `rowHeadOf()` chứ chưa sửa data title/desc), Dashboard (KPI), GlobalSearch (nhãn nhóm kết quả + `path` — nhân tiện sửa luôn: giờ trỏ thẳng `/obligation-type/{code}` thay vì vòng qua Archetype cha như trước Giai đoạn 53), bảng generic `tables.ts`. Riêng "Quy tắc kích hoạt Obligation Type phụ trợ" ở Archetype detail — **không đổi thành OTF** vì đây là quy tắc kích hoạt **OT lõi** phụ trợ (`obligation_type_core`/`ot_activation_rule`), không phải OTF — sửa đúng thành "OT lõi" thay vì áp dụng máy móc theo yêu cầu.

**Sửa:** Backend — `ConstraintMatrixService.rowHeadOf()` default case "Obligation Type"→"OTF"; `GlobalSearchService` type "Obligation Type"→"OTF" + path đổi sang `/obligation-type/{code}`; `V2__seed.sql` sửa title/description `constraint_matrix` id=2 ("Element Type"→"OET") và id=3 ("Obligation Type"→"OTF"/"OT lõi"). Frontend — `ArchetypePage.tsx`/`ArchetypeDetailPage.tsx`, `MatrixPage.tsx`, `DashboardPage.tsx`, `GlobalSearch.tsx`, `tables.ts`, `ObligationPage.tsx` (tab + cột), `OntologyPage.tsx`, `SysmapPage.tsx` — đổi "Obligation Type"/"Obligation Type Family (OTF)" còn sót thành "OTF" gọn. KHÔNG đụng `pages/pattern/*` và `PatternPreviewModal.tsx` — theo đúng yêu cầu, giữ "OT"/"Obligation Type" ở màn Pattern.

**Verify:** `docker compose down -v && up --build` 0 lỗi (seed đổi nên cần down -v, tránh Flyway checksum mismatch — đã gặp lỗi này 1 lần và xử lý đúng bằng down -v). Curl xác nhận: `constraint-matrices` trả đúng title "Ma trận 2: OET × OET (tương thích)"/"Ma trận 3: OTF × Block"; `constraint-matrices/3/detail` → `rowHead:"OTF"`; `GET /api/search?q=vay` trả đúng `type:"OTF"` + `path:"/obligation-type/OT_..."`. Grep xác nhận `pages/pattern/*`/`PatternPreviewModal.tsx` không bị đụng, vẫn nguyên "Obligation Type".

---

### Giai đoạn 55 — Màn Product Pattern: đổi nhãn "Obligation Type" → "Obligation Type Family"

**Bối cảnh:** ngay sau Giai đoạn 54 (đổi hết nhãn "Obligation Type"→"OTF" NHƯNG cố tình chừa riêng màn Pattern giữ nguyên "Obligation Type"/"OT"), user yêu cầu tiếp "ở màn Product Pattern có Obligation Type thì đổi thành Obligation Type Family" — màn Pattern KHÔNG dùng viết tắt "OTF" như phần còn lại của app, mà dùng dạng đầy đủ "Obligation Type Family".

**Sửa:** grep xác nhận đúng 5 chỗ còn "Obligation Type" trần trong 3 file Pattern. `ProductPatternPage.tsx` — cột list "Obligation Type" + filter dropdown cùng tên, sửa đồng thời cả 2 (label filter phải khớp label cột vì `ListScreen.guessColumnIndex()` so khớp chuỗi — bài học từ bug filter "Loại" chết ở Nhật ký hoạt động Giai đoạn 44). `ProductPatternDetailPage.tsx` — banner cảnh báo độ phủ ("Chưa gán Obligation Type…"/"Đủ Block bắt buộc theo ma trận Obligation Type × Block") + tên tab palette bên trái. `PatternPreviewModal.tsx` — stat card + tiêu đề "Độ phủ theo ma trận Obligation Type × Block". Không đổi biến nội bộ (`paletteTab === 'ot'`, hằng số code) — chỉ đổi label hiển thị.

**Verify:** `npm run build` (tsc -b && vite build) 0 lỗi TS.

---

### Giai đoạn 56 — Spell-out "OTF" → "Obligation Type Family (OTF)" ở mọi nhãn/tiêu đề còn viết tắt trần

**Bối cảnh:** sau Giai đoạn 55, user rà UI qua nhiều vòng gửi ảnh chụp: (1) 2 chỗ chữ hoa cứng ở màn Pattern bị sót ("GÁN OBLIGATION TYPE VÀO KHUÔN", "OBLIGATION TYPE ĐÃ GÁN") — grep phân biệt hoa/thường trước đó không bắt được vì cả cụm viết hoa toàn bộ; (2) tab "Nghĩa vụ tài chính" ở Variant detail (tái dùng data từ Pattern) cần đổi theo cùng lý do "Pattern-sourced content"; (3) màn Sơ đồ Ontology — stat card "OTF" nên ghi đầy đủ khớp kiểu "Obligation Element Type (OET)" bên cạnh; (4) tab "OTF" ở Obligation Library cũng vậy. Sau đó hỏi qua AskUserQuestion phạm vi rộng hơn (chỉ 2 chỗ đã chỉ ra hay sửa hết) — user chọn "Sửa hết mọi chỗ".

**Sửa:** rà toàn bộ frontend+backend cho mọi nhãn/tiêu đề/tab/stat-card đang ghi "OTF" trần, đổi thành "Obligation Type Family (OTF)": `tables.ts` (2 title), `DashboardPage.tsx` (KPI), `ArchetypePage.tsx`/`ArchetypeDetailPage.tsx` (stat + "thuộc Archetype này"), `SysmapPage.tsx` (3 node bảng quan hệ), `ObligationPage.tsx` (tên tab), `ObligationTypeDetailPage.tsx` (2 tiêu đề khối), `MatrixPage.tsx` (tên tab "× Block"), `GlobalSearch.tsx` (key map icon + badge loại kết quả — đổi đồng bộ với backend vì đây là chuỗi `type` trả thẳng từ API), `ProductPatternDetailPage.tsx` (2 chỗ chữ hoa cứng bị sót), `ProductVariantDetailPage.tsx` (tiêu đề tab tái dùng data Pattern). Backend: `ConstraintMatrixService.rowHeadOf()` (case default), `GlobalSearchService` (chuỗi `type` cho kết quả OTF).

**Giữ ngắn theo ngoại lệ đã thống nhất:** cột bảng dữ liệu (`label: 'OTF'` trong `ObligationPage.tsx`/`tables.ts`) và câu văn xuôi tiếng Việt dùng "OTF" như từ viết tắt thông thường (vd "1 OTF = tổ hợp...", "cho từng OTF con").

**Bài học kỹ thuật quan trọng:** `frontend` chạy trong Docker qua nginx serve `dist/` build sẵn (không phải `npm run dev`) — `npm run build` cục bộ KHÔNG đủ để thấy thay đổi trên `localhost:5173`, phải `docker compose up -d --build frontend` (và `backend` nếu đổi Java) mỗi vòng sửa.

**Verify:** build backend (Maven qua Docker) + frontend (tsc) đều 0 lỗi; curl xác nhận `constraint-matrices/3/detail` → `rowHead:"Obligation Type Family (OTF)"`, `GET /api/search?q=vay` → `type:"Obligation Type Family (OTF)"`.

---

### Giai đoạn 57 — Cập nhật checklist Bước 2 "Tạo Product Intent" ở Quy trình phát hành theo mô hình OTF mới

**Bối cảnh:** user rà màn Quy trình phát hành (`/release/VAR-101`), Bước 2/8 "Tạo Product Intent" vẫn hiện checklist cũ từ trước Giai đoạn 51 ("Gán Obligation Nature định danh", "Khai báo Obligation Element nền", "Đối chiếu Ma trận FOA × Element") — nhắc tới khái niệm "Obligation Nature" đã bị xoá hẳn từ Giai đoạn 52 (gộp vào Archetype). User mô tả bằng văn nói 3 việc cần làm thật theo quy trình OTF hiện tại, yêu cầu viết lại cho chuẩn: điền OE cho 3 OT lõi cốt lõi, bật/tắt OT lõi phụ trợ, điền OE cho OT lõi phụ trợ đã bật để hoàn thành OTF.

**Sửa:** `V2__seed.sql` — 3 dòng `process_step_checklist` (process_id=1, step_no=2) đổi thành "Điền OE cho 3 OT lõi Cốt lõi (Giải ngân / Hoàn trả gốc / Trả lãi)", "Bật/tắt OT lõi Phụ trợ theo bảng kích hoạt", "Điền OE cho OT lõi Phụ trợ đã bật để hoàn thành OTF" — khớp đúng thuật ngữ "Cốt lõi"/"Phụ trợ" đã dùng ở tab "Obligation Type (lõi)". Rà thêm phát hiện 2 chỗ cùng lỗi thời trong `ReleaseProcessService.java` (hằng số `DESC`/`TIP`, văn bản tĩnh không đổi theo instance): `DESC[1]` ("gắn Obligation Nature...") và `TIP[1]` ("suy diễn Family hợp lệ...") cùng nhắc khái niệm đã xoá — sửa lại theo đúng flow FOA→OE→OTF hiện tại; tiện thể sửa `TIP[2]` (Bước 3 "Dựng Product Pattern") từ "Ma trận Obligation Type × Block" sang "Ma trận Obligation Type Family (OTF) × Block" cho khớp tên ma trận đã đổi ở Giai đoạn 54/56.

**Verify:** seed đổi nên chạy `docker compose down -v && up --build`; curl `GET /api/release-processes/VAR-101/detail` xác nhận `steps[1].checklist` đúng 3 dòng mới, `steps[1].desc`/`.tip` đúng văn bản mới; regression `obligation-type-compositions` vẫn đúng 246 dòng.

---

### Giai đoạn 58 — Màn Ma trận chỉ còn đúng 2 ma trận: FOA × Obligation Element và Obligation Element × Block

**Bối cảnh:** user yêu cầu thẳng "ở màn ma trận giờ sẽ chỉ có OE x block và FOA x OE" — rút màn Ma trận (trước có 4 tab: FOA×OE, OET×OET, OTF×Block, Pattern×Block độ phủ) xuống còn đúng 2 ma trận. Đã hỏi qua AskUserQuestion 2 quyết định: (1) số phận 2 ma trận cũ "OET × OET" và "Pattern × Block (độ phủ)" — user chọn "Bỏ hẳn cả 2, chỉ còn đúng 2 tab" (chấp nhận luôn hệ quả: banner độ phủ ở Pattern builder phải đổi nguồn); (2) nguồn dữ liệu cho ma trận "OE × Block" mới — user chọn "Dựa vào `governed_by_element_code` có sẵn" (không tạo bảng/dữ liệu req/pos/na mới).

**Phân tích trước khi sửa:** rà `ConstraintMatrixService`/`ProductPatternService` xác nhận: (a) 2 ma trận cũ "OET × OET" (kind=ELEMENTTYPE_X_ELEMENTTYPE) và "OTF × Block" (kind=OBLIGATIONTYPE_X_BLOCK) là 2 ma trận DUY NHẤT còn lưu thật ở `constraint_matrix`/`matrix_cell` (từ Giai đoạn 51, ma trận FOA×OE đã derived); (b) banner "Đủ Block bắt buộc" ở Pattern builder (`ProductPatternService.detail()` field `coverage`) và tab "Pattern × Block (độ phủ)" (`ConstraintMatrixService.patternCoverage()`) là 2 chỗ ĐỘC LẬP cùng đọc từ ma trận OTF×Block (bị trùng logic, đã ghi chú "cùng logic" trong code cũ) — cả 2 đều cần đổi nguồn.

**Sửa — Backend:** `ConstraintMatrixService` viết lại gọn còn đúng 2 method derived (`foaOeMatrix()` giữ nguyên, thêm `oeBlockMatrix()` mới) — bỏ hẳn `list()`/`detail(id)`/`patternCoverage()`/`legendOf`/`rowHeadOf`/`rowLabel`/`colLabel` (dead code sau khi FE ngưng gọi). `oeBlockMatrix()`: rows=Block CÓ governed_by_element_code (5/12 — sửa lại ở Giai đoạn 59 sau phản hồi "ma trận trông rỗng", ban đầu định để cả 12 Block nhưng 7 Block luôn "na" ở mọi cột gây loãng bảng không thêm thông tin thật), cols=các Obligation Element thực sự chi phối ít nhất 1 Block (5 mã, suy từ `block.governed_by_element_code` — không cần bảng mới), cell="req" nếu đúng cặp governs, còn lại "na" (không có mức "tuỳ chọn" vì quan hệ chi phối là nhị phân). `ConstraintMatrixController` bỏ 3 endpoint chết (`list`, `/{id}/detail`, `/pattern-coverage`), thêm `GET /oe-block-matrix`. `ProductPatternService.detail()` — field `coverage` viết lại hoàn toàn: gom mọi Obligation Element dùng trong composition (`ObligationTypeCompositionRepository.findByObligationTypeCode()`) của các OTF đã gán cho pattern, rồi lọc Block nào được 1 trong các OE đó chi phối → verdict="req" cho đúng Block đó (danh sách coverage giờ có ĐỘ DÀI THAY ĐỔI theo từng pattern, thay vì cố định 6 Block "cover" cũ) — bỏ hẳn `COVER_BLOCKS`/`matrixRepo`/`matrixCellRepo`/`rank`/`unrank` không dùng nữa. `V2__seed.sql` xoá sạch phần 34-35 (`constraint_matrix` id=2,3 + toàn bộ `matrix_cell` liên quan) — giữ nguyên bảng `constraint_matrix`/`matrix_cell` trong schema (không DROP TABLE, có thể dùng lại cho ma trận thật khác sau này) nhưng seed để trống. `ReleaseProcessService.TIP[2]` (Bước 3, vừa sửa ở Giai đoạn 57 thành "Ma trận Obligation Type Family (OTF) × Block") sửa tiếp lần nữa thành "Ma trận Obligation Element × Block" — phát hiện ngay khi rà lại, tránh lặp lỗi tham chiếu ma trận đã xoá.

**Sửa — Frontend:** `MatrixPage.tsx` viết lại gọn — `TAB_LABELS` chỉ còn `['FOA × Obligation Element', 'Obligation Element × Block']`, bỏ hẳn cơ chế gọi `GET /api/constraint-matrices` (list) rồi lặp qua từng `id` gọi `/detail` + gọi riêng `/pattern-coverage` — giờ gọi thẳng 2 endpoint cố định (`foa-oe-matrix`, `oe-block-matrix`). `LegKind` thu gọn còn `'rpn'` (bỏ `'compat'`/`'block'` không còn dùng).

**Hệ quả đáng chú ý (đã báo trước cho user):** vì banner độ phủ Pattern builder đổi từ ma trận OTF×Block (fabricated, curated tay — 6 Block cố định "BLK_COUNTERPARTY/BLK_INTEREST/BLK_COLLATERAL/BLK_REPAYMENT/BLK_LIMIT/BLK_PENALTY") sang OE→Block thật (5 Block thực sự có OE chi phối — "BLK_VALUEBASE/BLK_DISBURSEMENT/BLK_REPAYMENT/BLK_COLLATERAL/BLK_BILLING"), độ phủ hiển thị cho pattern có thể ĐỔI KHÁC hẳn so với trước — vd PT-001 giờ hiện "Thiếu 2 Block bắt buộc" (BLK_VALUEBASE/BLK_DISBURSEMENT chưa có trong canvas) thay vì "✓ Đủ" như cũ, vì đây là 2 Block CHƯA từng được kiểm tra ở ma trận cũ.

**Verify:** seed đổi nên `docker compose down -v && up --build`; backend start 0 lỗi; curl `oe-block-matrix` đúng 5 cặp req khớp 5 quan hệ governed-by thật đã xác nhận từ Giai đoạn 53b; curl `product-patterns/PT-001/detail` → coverage đúng 4 Block (2 covered/2 missing), `PT-002/detail` → 5 Block (thêm BLK_BILLING vì dùng OE_TIME_CYCLE_STATEMENT); regression `obligation-type-compositions` vẫn 246 dòng, `product-patterns` list vẫn 200 OK; 3 endpoint cũ (`constraint-matrices` list/`{id}/detail`/`pattern-coverage`) không còn route (lỗi "No static resource", khớp hành vi Spring Boot đã thấy trước đây khi gọi route không tồn tại — không phải bug mới); `npm run build` 0 lỗi TS.

---

### Giai đoạn 59 — Sửa 3 lỗi phát hiện ngay sau Giai đoạn 58 + đối chiếu tài liệu bổ sung dữ liệu FOA×OE

**Bối cảnh:** user hard-refresh sau Giai đoạn 58, phát hiện 2 lỗi UI: (1) badge sidebar "Ma trận ràng buộc" hiện "0" dù có 2 tab thật; (2) ma trận OE×Block trông "rỗng" (12 hàng nhưng phần lớn toàn "Không"). Tiện thể xoá 2 card "Obligation Nature"/"Value Structure" ở Archetype detail theo yêu cầu riêng. Sau đó user hỏi thẳng "các dữ liệu trong phần matrix có đang hardcode không, sao tôi thấy có rất nhiều OE trong database mà lên matrix lại ít như thế" — nghi ngờ dữ liệu ma trận bị hardcode.

**Sửa lỗi 1 — badge "0":** `Layout.tsx` vẫn gọi `fetch('/api/constraint-matrices')` (endpoint `list()` đã xoá ở Giai đoạn 58) để đếm badge — lỗi 500 "No static resource" khiến `Array.isArray(arr)` false → fallback 0. Xoá hẳn đoạn fetch chết này; `nav.ts` đổi `count: null` (dynamic) → `count: '2'` (cố định, vì giờ không còn resource phân trang thật để đếm).

**Sửa lỗi 2 — ma trận trông rỗng:** `oeBlockMatrix()` đổi rows từ "toàn bộ 12 Block" xuống "chỉ 5 Block có `governed_by_element_code`" — 7 Block còn lại (BLK_LIMIT/INTEREST/FEE theo FOA, BLK_ELIGIBILITY/COUNTERPARTY/REGULATORY/PENALTY theo khái niệm tự do ở `governed_by_aspect`, không phải OE) luôn "na" ở mọi cột nên đưa vào bảng chỉ gây loãng, không thêm thông tin thật. Ma trận giờ 5×5 thay vì 12×5.

**Trả lời câu hỏi "có hardcode không":** xác nhận qua `docker exec pf-db psql` (query thẳng DB, bỏ qua toàn bộ app/cache) — **không hardcode**, cả 2 ma trận đều derived thật từ `foa_element`/`block.governed_by_element_code`. Nhưng phát hiện 2 nguyên nhân khác nhau khiến "OE nhiều mà matrix ít": (a) Ma trận FOA×OE — đối chiếu tài liệu "Ví dụ xuyên suốt: Ma Trận FOA × OE..." xác nhận phần lớn 24/37 OE không lên ma trận là ĐÚNG THIẾT KẾ (6 mã Party — tài liệu ghi rõ "không áp dụng cho Party"; ~8 mã thuộc OT Giải ngân/Bàn giao TS — tài liệu ghi rõ các OT này "khá cố định... không cần ma trận phân xử"; còn lại thuộc OT phụ trợ ngoài phạm vi tài liệu) — NHƯNG có đúng 2 mã bị thiếu thật (`OE_VAL_PRINCIPAL_SINGLE_DECREASE` "bullet", `OE_REC_UNSECURED` "Tín chấp") và 9 ô bị lệch giá trị BB/CP/KO so với tài liệu — đây là phát hiện còn tồn đọng từ đợt audit tài liệu trước đó (Giai đoạn 58 đối thoại), user xác nhận "có" sửa ngay. (b) Ma trận OE×Block — đọc lại nguyên văn tài liệu "Lớp vỏ thương mại" xác nhận đây CHỈ là văn bản khái niệm (giải thích Block là gì), KHÔNG hề có bảng ánh xạ đầy đủ 12 Block→OE nào — nên không có căn cứ tài liệu để bổ sung thêm quan hệ cho 7 Block còn lại; tự thêm sẽ là bịa dữ liệu, KHÔNG sửa.

**Sửa dữ liệu — `foa_element`:** thêm 9 ô còn thiếu cho 5 OE đã có sẵn hàng (mỗi OE thật ra có nhiều mức yêu cầu theo từng FOA chứ không chỉ 1 cột) + thêm mới 2 OE hoàn toàn vắng mặt (`OE_VAL_PRINCIPAL_SINGLE_DECREASE`, `OE_REC_UNSECURED`) — tổng 15 dòng cũ + 14 dòng mới = 29 dòng, phủ 15 OE (từ 13). Không đổi 4 dòng đã khớp đúng tài liệu (Recovery Anchor "Tài sản cầm cố" — 3 FOA đều CP, đúng H5; và 2 dòng V3/V4 đã khớp sẵn).

**Xoá 2 InfoCard "Obligation Nature"/"Value Structure"** ở `ArchetypeDetailPage.tsx` theo yêu cầu riêng — dọn luôn 4 field không dùng (`nature`/`natureDesc`/`valueStructure`/`valueDesc`) khỏi interface.

**Verify:** seed đổi nên `docker compose down -v && up --build`; curl `foa-oe-matrix` giờ 15 dòng/45 ô (req=12/pos=17/na=16 — mật độ "Được phép" tăng từ 4→17 ô, khớp sát tài liệu); curl `oe-block-matrix` đúng 5×5; regression `obligation-type-compositions` vẫn 246, `product-patterns` list 200 OK, `product-patterns/PT-001/detail` coverage vẫn đúng 4 dòng (không đổi vì dùng nguồn khác — `obligation_type_composition`, không phải `foa_element`); `npm run build` 0 lỗi TS.

### Giai đoạn 60 — làm đầy Block/Attribute còn thiếu trong 4 Pattern đã duyệt/xuất bản (BLK_VALUEBASE, BLK_DISBURSEMENT)

**Bối cảnh:** user yêu cầu "làm đầy thêm dữ liệu về block và attribute", cụ thể: rà các Pattern đã `approved`/`published`, kiểm tra Block nào đang thiếu so với ma trận OE×Block derived (Giai đoạn 58/59) rồi bổ sung vào canvas Pattern, kéo theo Answer Slot/Attribute và điền giá trị luôn — không chỉ dừng ở hiển thị banner "thiếu Block" như đã lộ ra từ Giai đoạn 58.

**Xác định thiếu gì:** 4 Pattern đủ điều kiện (`approved`/`published`): PT-001, PT-003, PT-005, PT-006 (PT-002 `review`, PT-004 `draft` — ngoài phạm vi). Đối chiếu `pattern_block` hiện có với tập OE thật dùng trong `obligation_type_composition` của OTF gán cho từng Pattern (đúng logic `ProductPatternService.detail().coverage` viết ở Giai đoạn 58) ra kết quả:
- PT-001 (OT_PLEDGE_INSTALLMENT): thiếu **BLK_VALUEBASE**, **BLK_DISBURSEMENT**.
- PT-003 (OT_PLEDGE_BULLET): thiếu **BLK_VALUEBASE** (BLK_DISBURSEMENT đã có sẵn từ đầu).
- PT-005 (OT_UNSECURED): thiếu **BLK_VALUEBASE**, **BLK_DISBURSEMENT**.
- PT-006 (OT_AUTO_PLEDGE): thiếu **BLK_VALUEBASE**, **BLK_DISBURSEMENT**.

BLK_BILLING (OE_TIME_CYCLE_STATEMENT) không Pattern nào trong 4 Pattern này dùng tới — đúng, không thêm.

**Attribute/Answer Slot:** cả 2 Block đã có sẵn Answer Slot + Attribute đầy đủ trong schema từ trước (`decrease_method`/`principal_base` cho BLK_VALUEBASE, `disb_method`/`disb_syntax`/`transfer_content` cho BLK_DISBURSEMENT — DT_ENUM/DT_TEXT, có `attribute_enum_value` đóng) — chỉ chưa từng được dùng vì chưa Pattern nào gán Block. Không cần tạo Attribute/Answer Slot mới.

**Sửa `pattern_block`:** thêm 7 dòng — PT-001 (BLK_VALUEBASE vị trí 9, BLK_DISBURSEMENT vị trí 10), PT-003 (BLK_VALUEBASE vị trí 7), PT-005 (BLK_VALUEBASE vị trí 6, BLK_DISBURSEMENT vị trí 7), PT-006 (BLK_VALUEBASE vị trí 8, BLK_DISBURSEMENT vị trí 9).

**Điền giá trị — 2 tầng:** (1) `template_frame` cho cả 5 Template dùng 4 Pattern này (TPL-001/002/004/005/006) — `decrease_method`="Giảm dần theo gốc" và `principal_base`="Gốc vay" (chỉ có đúng 1 giá trị enum đóng trong `attribute_enum_value`, kể cả cho PT-003 Bullet — không có lựa chọn nào khác trong DB thật), `disb_method`="Chuyển khoản" + `disb_syntax`="F88 {contract}" + `transfer_content`="Giai ngan {contract} - F88" (khớp đúng giá trị TPL-005 đã dùng sẵn cho block này). (2) Phát hiện qua verify: chỉ thêm `template_frame` KHÔNG đủ để completeness lên 100% — đọc kỹ `ProductConfigService.buildBody()` xác nhận `missingRequired`/`reqFilled` chỉ đếm slot có **Fragment thật** (`!frags.isEmpty()`), `template_frame` chỉ hiện `inheritedFrameValue` tham khảo chứ không tính "đã điền" — đúng hành vi đã thiết lập từ Giai đoạn 48. Nên thêm tiếp `fragment` (scope=`default`) cho 6 Config đang dùng 4 Pattern này: CFG-0021/CFG-0037/CFG-0040/CFG-0043 (← TPL-001/002, PT-001), CFG-0038 (← TPL-006, PT-005), CFG-0039 (← TPL-005, PT-003 — đã có sẵn `disb_method` fragment từ Giai đoạn 41, chỉ thêm BLK_VALUEBASE). TPL-004 (PT-006) hiện chưa có Config nào nên chỉ cần `template_frame`.

**Tiện thể vá 1 lỗ hổng phát hiện khi verify:** CFG-0037 (← TPL-002/PT-001) thiếu hẳn fragment cho BLK_LIMIT dù Block này đã có từ Giai đoạn 48 — sót lại vì đợt đó chỉ backfill 3 Config của TPL-001 (CFG-0021/0040/0043), bỏ quên CFG-0037 của TPL-002. Thêm fragment `limit_amount`="100.000.000đ – 2.000.000.000đ" + `capacity_range`="Có quản trị" (khớp đúng `product_variant.limit_range` thật của VAR-107 "100tr – 2 tỷ").

**Verify:** seed đổi nên `docker compose down -v && up --build`; curl `product-patterns/{PT-001,003,005,006}/detail` → `coverage` mọi dòng đều `inCanvas:true` (Đủ Block bắt buộc); curl `product-configs/{CFG-0021,0037,0038,0039,0040,0043}/resolved` → `completeness.pct=100`, `missingRequired=[]` cho cả 6; regression `obligation-type-compositions` vẫn 246, `product-patterns`/`product-configs`/`product-variants` list đều 200 OK, `foa-oe-matrix` vẫn 15 dòng, `oe-block-matrix` vẫn 5×5 (không đổi — Giai đoạn 60 chỉ đụng `pattern_block`/`template_frame`/`fragment`, không đụng `foa_element`/`block.governed_by_element_code`); `npm run build` 0 lỗi TS (không có thay đổi frontend đợt này — hoàn toàn seed data).

### Giai đoạn 61 — làm giàu sample data cho Block/Attribute/Answer Slot + lan xuống Pattern/Template/Config

**Bối cảnh:** user muốn "thêm các dữ liệu sample cho các block, attribute, answer slot và thêm luôn cho các pattern, config, template" — mở rộng tiếp sau Giai đoạn 60 (lúc đó chỉ vá lỗ hổng thiếu Block). Đã hỏi qua AskUserQuestion 2 quyết định phạm vi, cả 2 đều chọn phương án khuyến nghị (an toàn hơn): (1) **không** tạo Block/Attribute Group mới — chỉ làm giàu 12 Block đã có (khi kiểm tra, mỗi Block đang chỉ có 2-3 Answer Slot — khá sơ sài); (2) làm giàu **chiều sâu** dữ liệu đã có (6 Pattern/6 Template/8 Config hiện tại) thay vì tạo thêm sản phẩm mẫu mới.

**Thiết kế 12 Answer Slot mới (đúng 1/Block, tái dùng `group_code`/domain có sẵn của từng Block, không tạo nhóm mới):** BLK_COUNTERPARTY→`co_borrower_allowed` (Cho phép đồng vay), BLK_REGULATORY→`dispute_resolution` (Cơ chế giải quyết tranh chấp), BLK_INTEREST→`reference_index` (Chỉ số lãi suất tham chiếu), BLK_FEE→`fee_collection_time` (Thời điểm thu phí), BLK_REPAYMENT→`repay_channel` (Kênh nhận trả nợ), BLK_COLLATERAL→`insurance_required` (Yêu cầu bảo hiểm tài sản), BLK_PENALTY→`penalty_base` (Cơ sở tính phạt), BLK_LIMIT→`review_cycle` (Chu kỳ tái xét hạn mức), BLK_VALUEBASE→`rounding_rule` (Quy tắc làm tròn), BLK_DISBURSEMENT→`disb_timing` (Thời điểm giải ngân), BLK_ELIGIBILITY→`credit_history_required` (Yêu cầu lịch sử tín dụng), BLK_BILLING→`stmt_channel` (Kênh gửi sao kê). Tất cả `is_required=false` (an toàn, không phá completeness của Pattern/Config hiện có).

**Điểm neo theo tài liệu:** `reference_index` kèm 1 dòng `attribute_constraint` kind=`dependency` đúng nguyên văn ví dụ trong tài liệu "Lớp vỏ thương mại" (mục Constraint, loại Dependency): *"Rate_type = 'Thả nổi' → bắt buộc có Reference Index"*. Hiện chưa Config nào dùng `rate_type='Thả nổi'` nên giá trị mọi Template vẫn "Không áp dụng (lãi suất cố định)" — constraint mô tả đúng quy tắc sẽ áp dụng khi có sản phẩm thả nổi sau này, không phải dữ liệu bịa.

**Điền giá trị xuống Template (chỉ `template_frame`, không thêm `fragment`):** đúng hành vi đã thiết lập cho slot KHÔNG bắt buộc từ trước (vd `grace`/`fee_amount`/`disb_syntax` chưa từng có Fragment override, chỉ có Template default) — 10 Attribute mới (trừ 2 DT_BOOL) đều có `attribute_enum_value` đóng, chọn giá trị hợp bối cảnh từng Template thay vì rập khuôn 1 giá trị cho tất cả: TPL-002 (doanh nghiệp) → `dispute_resolution`="Trọng tài thương mại" (khác toà án cá nhân của các Template khác), `fee_collection_time`="Hàng kỳ" (khớp `fee_type`="Phí quản lý" đã có sẵn — khác "Phí thẩm định" 1 lần của TPL-001/004); TPL-002/004 (ô tô, giá trị cao) → `insurance_required`="Bật"; TPL-001/002/004/005 (cầm cố có tài sản vật lý) → `disb_timing`="Sau thẩm định tài sản", TPL-006 (tín chấp lương, không tài sản) → "Ngay sau ký hợp đồng"; TPL-006 → `co_borrower_allowed`="Bật" + `repay_channel`="Trích nợ tự động" (khớp đặc thù vay lương trả qua tài khoản). Tổng 52 dòng `template_frame` mới trải trên cả 6 Template theo đúng tập Block mà Pattern gốc của từng Template thực có.

**Verify:** seed đổi nên `docker compose down -v && up --build`; `block` mỗi Block +1 Answer Slot (2-3→3-4/Block, tổng 31→43 Answer Slot); `attribute` 31→43, `attribute_enum_value` +23; curl `product-configs/{CFG-0021,0037,0038,0039,0040,0041,0042,0043}/resolved` → completeness KHÔNG đổi so với Giai đoạn 60 cho từng Config (slot mới toàn optional) — CFG-0043/0037/0038/0039/0040/0021 vẫn 100%, CFG-0041/0042 vẫn 67% (12/18, đúng số cũ từ Giai đoạn 46) — đồng thời 10 slot mới đều lên đúng giá trị qua `inheritedFrameValue`; curl `attributes/reference_index/usage` → đúng 1 constraint `dependency` trên `rate_type`; curl `blocks/BLK_INTEREST/detail` → 4 slot (thêm `reference_index`); regression `obligation-type-compositions` vẫn 246, coverage 4 Pattern Giai đoạn 60 vẫn đủ, 2 ma trận không đổi (15 dòng / 5×5), list các entity vẫn 200 OK; `npm run build` 0 lỗi TS (hoàn toàn seed data, không đổi code Java/TSX).

### Giai đoạn 62 — vá 2 Config published (CFG-0041/CFG-0042) thiếu Fragment cho 6 slot bắt buộc

**Bối cảnh:** user yêu cầu kiểm tra lại mọi Config trạng thái `published`/`approved`/`retired` (không giới hạn theo Pattern nguồn nữa như Giai đoạn 60) xem còn slot nào chưa có giá trị — gợi ý "có thể điền vào template rồi nó tự fill", yêu cầu kiểm tra giả thuyết đó trước khi làm.

**Audit:** quét cả 6 Config đúng 3 trạng thái trên (CFG-0021/0039/0040/0041/0042/0043) qua `resolved()` — đối chiếu số slot kỳ vọng (tính từ `pattern_block`×`answer_slot`) với số slot thực trả về (khớp 100%, không rớt slot nào ở cả 6), và quét từng slot xem có ít nhất 1 nguồn giá trị (Fragment/Template Frame/default) — 0 slot trống hoàn toàn. Nhưng `missingRequired` phát hiện **CFG-0041** và **CFG-0042** (cả 2 `published`, cùng nguồn TPL-003/PT-002) mỗi Config thiếu đúng 6 slot bắt buộc: `BLK_ELIGIBILITY.age`, `.min_income`, `BLK_REGULATORY.compliance`, `.legal_form`, `BLK_INTEREST.rate_type`, `BLK_REPAYMENT.schedule` — completeness chỉ 67% (12/18) dù UI builder vẫn "nhìn thấy đủ" giá trị.

**Kiểm chứng giả thuyết "điền Template rồi tự fill":** cả 6 slot ĐÃ có `template_frame` đầy đủ ở TPL-003 (từ đợt bổ sung "28c" trước đây) — nhưng `ProductConfigService.buildBody()` chỉ tính 1 slot là "đã điền" khi có **Fragment thật** (`!frags.isEmpty()`), `template_frame` chỉ hiển thị `inheritedFrameValue` tham khảo chứ không tính vào completeness (đúng hành vi đã xác nhận từ Giai đoạn 48/60). Vậy giả thuyết của user **sai một phần**: điền Template là điều kiện CẦN (để có giá trị hiển thị/kế thừa) nhưng KHÔNG ĐỦ để hết cảnh báo "thiếu" — phải có Fragment thật ở đúng Config đó.

**Nguyên nhân gốc:** CFG-0041/CFG-0042 là 2 Config được seed từ rất sớm (trước cả đợt TPL-003 bổ sung 3 Block ELIGIBILITY/REGULATORY/PENALTY ở mục "28c"), nên chưa từng có Fragment cho 3 Block mới đó — riêng BLK_PENALTY đã được vá trước đây, còn ELIGIBILITY/REGULATORY (+2 slot rate_type/schedule) thì sót lại tới giờ.

**Sửa:** thêm 12 dòng `fragment` (scope=`default`) — 6 slot × 2 Config — dùng đúng giá trị `template_frame` đã có sẵn của TPL-003 (không có căn cứ nào cho thấy CFG-0041/CFG-0042 cần khác biệt so với khung Template, không bịa số liệu mới).

**Verify:** seed đổi nên `docker compose down -v && up --build`; curl `product-configs/{CFG-0021,0039,0040,0041,0042,0043}/resolved` → CFG-0041/CFG-0042 giờ đúng 18/18 (100%, `missingRequired=[]`), 4 Config còn lại không đổi; regression `obligation-type-compositions` vẫn 246, list các entity vẫn 200 OK; `npm run build` 0 lỗi TS (hoàn toàn seed data).

### Giai đoạn 63 — mọi Attribute có "giá trị kèm theo" ngay từ khởi tạo, đối soát Template/Fragment khớp catalog

**Bối cảnh:** user muốn "ở các attribute sẽ có các attribute khi khởi tạo sẽ có phần giá trị kèm theo luôn để khi vào template ngoài việc chúng ta nhập giá trị default thì chúng ta có thể lấy luôn giá trị kèm theo đó, đây để cho việc sau này chúng ta sẽ không phải nhập tay 100% template" — tức mọi Attribute nên có sẵn 1 danh mục "giá trị kèm theo" (`attribute_enum_value`) để khi điền Template/Config sau này chỉ cần CHỌN từ danh mục thay vì gõ tay tự do.

**Kiểm tra hiện trạng:** cơ chế `attribute_enum_value` đã tồn tại từ trước (dùng cho tab "Attribute Usage" — `AttributeUsageService`) nhưng CHỈ áp dụng cho Attribute kiểu `DT_ENUM`; 3 Attribute `DT_BOOL` (`co_borrower_allowed`/`compliance`/`insurance_required`, thêm ở Giai đoạn 61) có 0 dòng dù bản chất Boolean cũng là 1 tập giá trị đóng 2 phần tử.

**Kiểm tra sâu hơn (đúng tinh thần "để sau này lấy đúng giá trị kèm theo" của user):** đối chiếu TOÀN BỘ `template_frame`/`fragment`/`answer_slot.default_value` (3 nguồn ghi giá trị thật) với `attribute_enum_value` (catalog) cho mọi Attribute `DT_ENUM`/`DT_BOOL` — phát hiện **8 chỗ lệch thật**: 6 chỗ `asset_type` dùng dạng ngắn ("Xe máy"/"Ô tô"/"Vàng" ở 1 `answer_slot.default_value` + 5 `template_frame`) trong khi catalog dùng dạng dài có hậu tố tiếng Anh ("Xe máy (TwoWheels)"...) — 2 nguồn dữ liệu bị trôi dần theo thời gian không đồng bộ; 1 chỗ `occupation` dùng "Không giới hạn" (2 Template) nằm ngoài 4 giá trị catalog; 1 chỗ `fragment` của CFG-0021 dùng "Thiết bị điện tử (Laptop)" — 1 loại tài sản có thật trong dữ liệu mẫu (khoản vay cầm cố laptop) nhưng chưa từng được thêm vào catalog `asset_type` (chỉ có 3/4 loại).

**Sửa:**
1. Thêm `attribute_enum_value` cho 3 Attribute `DT_BOOL` — mỗi Attribute 2 dòng (`Bật`/`Tắt`) — để mọi Attribute có tập giá trị đóng (không riêng `DT_ENUM`) đều có "giá trị kèm theo" từ khi khởi tạo.
2. Bổ sung catalog `asset_type` thêm giá trị thứ 4 "Thiết bị điện tử (Laptop)" (khớp dữ liệu Config CFG-0021 đã dùng thật), cập nhật luôn text mô tả `attribute_constraint` kind=`enum` cho khớp.
3. Bổ sung catalog `occupation` thêm giá trị thứ 5 "Không giới hạn" (khớp dữ liệu 2 Template TPL-003/TPL-006 đã dùng thật, nghĩa "không ràng buộc nghề nghiệp cụ thể").
4. Chuẩn hoá 6 chỗ `asset_type` dạng ngắn còn lại (`answer_slot.default_value` + 5 `template_frame`) về đúng dạng dài khớp catalog — không đổi ý nghĩa dữ liệu, chỉ đồng bộ 2 nguồn.

Cách tiếp cận: **không đổi giá trị thật đang dùng** để ép khớp 1 catalog cứng nhắc — mà bổ sung catalog cho khớp với những giá trị hợp lý đã tồn tại thật (Laptop, Không giới hạn), chỉ chuẩn hoá những chỗ rõ ràng là lỗi chính tả/viết tắt (Xe máy → Xe máy (TwoWheels)).

**Verify:** seed đổi nên `docker compose down -v && up --build`; 3 câu SQL đối soát (`template_frame`/`fragment`/`answer_slot.default_value` vs `attribute_enum_value`) đều trả **0 dòng lệch** (trước đó 7+1); `attributes/asset_type/usage` → đúng 4 `enumValues`; completeness mọi Config (CFG-0021/0037/0038/0039/0040/0041/0042/0043) không đổi so với Giai đoạn 62; regression `obligation-type-compositions` vẫn 246, list các entity vẫn 200 OK; `npm run build` 0 lỗi TS (hoàn toàn seed data, không đổi code Java/TSX).

### Giai đoạn 64 — làm thật nút "Xuất PDF" ở màn Simulation Engine

**Bối cảnh:** user yêu cầu "hoàn thiện nốt button xuất PDF" ở màn Simulation — nút này trước đây no-op (`title="read-only"`, cùng kiểu mọi nút CUD khác), đứng cạnh nút "Xuất CSV" đã làm thật từ trước. Đây là hành động XUẤT/XEM (không phải CUD) nên đúng tinh thần đã áp dụng cho "Xem trước" Pattern (Giai đoạn 39) và "Xuất CSV" cùng màn này — làm thật được.

**Quyết định kỹ thuật:** không thêm thư viện PDF mới (jsPDF...) vào `package.json` — dùng cơ chế in gốc của trình duyệt: dựng 1 trang HTML in-được (cùng nội dung tóm tắt kịch bản + bảng lịch trả nợ đầy đủ như `handleExportCsv` đã có, chỉ khác định dạng trình bày — bảng HTML có màu thương hiệu thay vì CSV thô), mở ở tab mới (`window.open`), rồi gọi `window.print()` — trình duyệt tự cho người dùng chọn đích "Save as PDF" trong hộp thoại In. Cách này không phụ thuộc mạng ngoài, không tăng bundle size, nhất quán với việc CSV export cũng build hoàn toàn client-side từ state `result`/`form` đã có sẵn (không gọi thêm API).

**Sửa:** `SimulationPage.tsx` — thêm `escapeHtml()` (tránh chèn HTML lạ từ `tagText` do backend sinh ra) + `handleExportPdf()` (dựng summary 17 dòng + bảng lịch trả nợ đầy đủ, style inline khớp bảng màu dự án `#0E8C5A`/`#0B7349`/`#F4F7F5`/`#E6ECE8`); nút "Xuất PDF" đổi từ tĩnh sang `onClick={handleExportPdf}` + `disabled={!result}`, cùng style bật/tắt như nút "Xuất CSV" cạnh nó.

**Verify:** `npm run build` 0 lỗi TS; `docker compose up -d --build frontend`; smoke test `curl` xác nhận frontend (200) và `GET /api/simulation/default` (200) hoạt động bình thường. **Không verify được bằng trình duyệt thật** (môi trường phiên này không có công cụ browser automation — giống hạn chế đã ghi nhận ở Giai đoạn 51) — đã rà kỹ code (đóng ngoặc, escape, luồng dữ liệu từ `result`/`form` đã có sẵn client-side) nhưng khuyến nghị user tự bấm thử nút "Xuất PDF" ở `/simulation` sau khi chạy 1 mô phỏng để xác nhận hộp thoại In hiện đúng và nội dung khớp.

### Giai đoạn 65 — Xuất PDF Simulation: chuyển từ hộp thoại In sang tải file thật (jsPDF + font nhúng)

**Bối cảnh:** ngay sau Giai đoạn 64, user phản hồi thẳng "xuất là tải về chứ" — đúng, bản Giai đoạn 64 dùng `window.print()` vẫn bắt người dùng tự chọn đích "Save as PDF" trong hộp thoại In của trình duyệt, không phải tải file trực tiếp như "Xuất CSV" cạnh nó (Blob + `<a download>`, không thao tác gì thêm). Đây là điểm khác biệt hành vi rõ ràng — "xuất" phải nghĩa là tải về ngay.

**Vấn đề kỹ thuật cốt lõi:** trình duyệt không có API "tạo PDF thật rồi tải về" thuần túy (ngoài Electron) — muốn tải file PDF thật (không qua dialog) bắt buộc phải tự dựng nội dung PDF (client-side qua thư viện, hoặc server-side). Chọn client-side (`jsPDF`) để giữ nguyên triết lý "Xuất CSV" đã có — thuần dựng file từ state `result`/`form` sẵn có, không cần endpoint mới.

**Vấn đề phụ phát sinh — font tiếng Việt:** 14 font chuẩn của PDF (Helvetica, Times...) dùng WinAnsiEncoding, không đủ ký tự có dấu tiếng Việt (ệ, ữ, ả...) — chữ sẽ vỡ nếu dùng font mặc định của jsPDF. Phải nhúng 1 font TTF hỗ trợ Unicode đầy đủ. Đã tải trực tiếp **Be Vietnam Pro** (đúng font thương hiệu UI web đang dùng, `index.html`) bản Regular + Bold từ repo chính thức Google Fonts trên GitHub (`google/fonts/ofl/bevietnampro`, giấy phép SIL Open Font License 1.1 — tự do nhúng/phân phối lại, kèm `OFL.txt` giữ trong repo cho minh bạch bản quyền), convert base64 thành module `frontend/src/infrastructure/fonts/beVietnamPro.ts`, nhúng vào jsPDF qua `addFileToVFS`/`addFont`.

**Sửa `SimulationPage.tsx`:** thay toàn bộ `handleExportPdf` (trước đây dựng HTML + `window.print()`) bằng bản dùng `jsPDF` + `jspdf-autotable` — trang tiêu đề (tên sản phẩm/ngày xuất), bảng tóm tắt kịch bản (17 dòng key-value, `autoTable` theme `plain`), bảng lịch trả nợ đầy đủ (đúng 11 cột như CSV, tô màu dòng có tag — grace/prepay/penalty — khớp `rowBg` từ backend), số trang ở footer. `doc.save(...)` gọi trực tiếp → tải file `.pdf` về máy ngay lập tức, không dialog nào.

**Tối ưu bundle:** `jsPDF`+`jspdf-autotable`+font base64 (~500KB) là phụ thuộc khá nặng, chỉ dùng ở đúng 1 nút bấm trên 1 màn — dùng `import()` động ngay trong `handleExportPdf` (thay vì import tĩnh ở đầu file) để KHÔNG kéo vào bundle chính tải cho mọi màn khác. Verify qua `npm run build`: chunk chính giữ nguyên 438KB (trước khi thêm jsPDF cũng ~433KB, gần như không đổi), các phần liên quan PDF tách hẳn thành chunk riêng (`jspdf.es.min` 390KB, `beVietnamPro` 364KB, `jspdf.plugin.autotable` 31KB, `html2canvas` — phụ thuộc bắc cầu của jsPDF dù không dùng trực tiếp — 201KB) chỉ tải khi thật sự bấm nút.

**Verify:** `npm run build` 0 lỗi TS (2 lượt — trước và sau khi chuyển sang dynamic import); `docker compose up -d --build frontend`; smoke test curl xác nhận frontend + chunk mới đều 200. **Vẫn chưa verify được bằng trình duyệt thật** (môi trường phiên này không có browser automation) — đã rà kỹ code (kiểu dữ liệu `autoTable`/`CellHookData`, `doc.lastAutoTable.finalY` xác nhận đúng còn tồn tại ở v5 qua đọc source `jspdf.plugin.autotable.js`), khuyến nghị user tự bấm "Xuất PDF" ở `/simulation` để xác nhận file `.pdf` tải về đúng, chữ có dấu tiếng Việt hiển thị đúng font, không vỡ ký tự.

### Giai đoạn 66 — Product Intent list/detail: dựng cấu trúc OT lõi Cốt lõi/Phụ trợ thật

**Bối cảnh:** user xem màn "Quy trình phát hành" (`/release/VAR-101`), thấy checklist Bước 2/8 "Tạo Product Intent" (viết từ Giai đoạn 57) mô tả đúng 3 việc — "Điền OE cho 3 OT lõi Cốt lõi", "Bật/tắt OT lõi Phụ trợ theo bảng kích hoạt", "Điền OE cho OT lõi Phụ trợ đã bật để hoàn thành OTF" — và hỏi thẳng màn Product Intent (list + detail) có phản ánh đúng 3 việc này không.

**Khảo sát xác nhận KHÔNG khớp:** `product_intent_element` (junction Intent↔OE) hoàn toàn phẳng — chỉ `(product_intent_id, element_code)`, không có `ot_core_code`/`leg` — không thể phân biệt OE thuộc OT lõi Cốt lõi hay Phụ trợ. `ProductIntentController.detail()` trả `elements: List<String>` — 1 list tag rời rạc sort alphabet. Dữ liệu mẫu chỉ 5 dòng OE/intent (PI-003 chỉ 2) — quá thưa để đại diện "3 OT lõi × 6 OET = 18 dòng tối thiểu".

**Nguồn backfill trung thực, không bịa:** mỗi Product Intent đã có đúng 1 Pattern con (`product_pattern.product_intent_id`), Pattern đó đã gán 1 OTF "Primary" (`pattern_obligation_type`), và OTF đó đã có composition đầy đủ trong `obligation_type_composition` (đúng cấu trúc `ot_core_code`/`element_type_code`/`element_code`/`leg` từ Giai đoạn 51). Copy nguyên bộ composition này vào `product_intent_element` theo lineage thật:

| Intent | Pattern con | OTF (Primary) | Số dòng |
|---|---|---|---|
| PI-001 | PT-003 | `OT_PLEDGE_BULLET` | 30 |
| PI-002 | PT-004 | `OT_FACILITY` | 30 |
| PI-003 | PT-002 | `OT_FACILITY` | 30 |
| PI-004 | PT-006 | `OT_AUTO_PLEDGE` | 30 |
| PI-005 | PT-001 | `OT_PLEDGE_INSTALLMENT` | 30 |
| PI-006 | PT-005 | `OT_UNSECURED` | 18 (không Bàn giao TS) |

Tổng 168 dòng thay 27 dòng phẳng cũ. Phát hiện phụ: mapping lineage thật đôi chỗ khác bản backfill nhanh ở Giai đoạn 51b (PI-001 lúc đó dùng tạm `OT_UNSECURED` "đại diện cùng archetype" dù Pattern con thật — PT-003 — gán `OT_PLEDGE_BULLET`) — đã sửa lại theo đúng lineage.

**Quyết định (đã hỏi user, chọn mức "Sâu"):** thêm cột thật `ot_core_code`/`element_type_code`/`leg` vào `product_intent_element` (mirror đúng shape `obligation_type_composition`), đổi PK thành `(product_intent_id, ot_core_code, element_type_code, leg)` (PK cũ theo `element_code` sẽ đụng unique violation vì 1 element_code như `OE_TIME_POINT` lặp ở nhiều ot_core/leg khác nhau trong cùng 1 intent). "Bật/tắt OT lõi Phụ trợ" không cần thêm bảng toggle riêng — sự có/không mặt của nhóm ot_core_code phụ trợ trong dữ liệu backfill TỰ NÓ đã là trạng thái bật/tắt.

**Sửa:** `V1__schema.sql` (3 cột mới + PK + 2 FK mới `product_intent_element`); `V2__seed.sql` (viết lại 168 dòng theo bảng trên); `ProductIntentElement.java`/`ProductIntentElementId.java` viết lại theo đúng khuôn `ObligationTypeComposition`/`-Id` (4 cột `@Id`); `ProductIntentElementRepository` đổi finder thành `findByProductIntentId`; tách logic khỏi Controller (vi phạm layering trước đó) thành `application/service/pipeline/ProductIntentService.java` mới — `detail(id)` group theo `ot_core_code::leg` (copy logic từ `ObligationTypeService.detail()`, bỏ cột Block vì thuộc tầng Pattern) + `activationRules` đối chiếu `ot_activation_rule` với chính OE của Intent (field mới `isTriggered`, khác bản ở Archetype detail chỉ liệt kê luật chung không đánh giá); `list(Pageable)` thêm `coreCount`/`auxCount`. `ProductIntentController.java` giờ gọi thẳng Service (không còn `extends ReadOnlyController` vì `list()` cần làm giàu, giống pattern `ObligationTypeController`).

Frontend: `ProductIntentPage.tsx` thêm cột "OT lõi" (`"3 Cốt lõi · 1 Phụ trợ"`); `ProductIntentDetailPage.tsx` bỏ khối "Element nền" (tag cloud phẳng) thay bằng "Cấu trúc OT lõi" (mirror `ObligationTypeDetailPage.tsx` — nhóm theo `otCores`, bảng 2 cột OET|Obligation Element, badge Cốt lõi/Phụ trợ/leg) + khối mới "Quy tắc kích hoạt OT lõi Phụ trợ" (chip "Đã kích hoạt"/"Chưa kích hoạt" theo `isTriggered`).

**Verify:** `docker compose down -v && up --build` — Maven build backend qua Docker 0 lỗi, Flyway migrate 0 lỗi; `GET /api/product-intents/{1..5}/detail` → đúng 5 nhóm otCores (3 Cốt lõi + Bàn giao TS nhận/trả Phụ trợ), 30 dòng element, `activationRules[0].isTriggered=true`; `GET /api/product-intents/6/detail` → đúng 3 nhóm (không Bàn giao TS), 18 dòng, `isTriggered=false`; `GET /api/product-intents?size=200` → `coreCount=3` mọi dòng, `auxCount=1` (PI-001..005) hoặc `0` (PI-006) — khớp chính xác dự tính; regression `obligation-type-compositions` vẫn 246 dòng, `product-patterns/PT-003/detail` vẫn 200 OK; `npm run build` 0 lỗi TS.

### Giai đoạn 67 — Ma trận "Obligation Element × Block": thêm mức "Được phép" (làm giàu dữ liệu)

**Bối cảnh:** ngay sau Giai đoạn 66, user hỏi thêm về quan hệ Block↔OE (khẳng định lại: Pattern↔Block và Block↔OE là 2 quan hệ độc lập — quan hệ #2 cố định trong catalog). Xem ảnh chụp màn Ma trận thật (tab "Obligation Element × Block"), user yêu cầu "làm lại màn ... thêm giàu dữ liệu hơn" — ảnh cho thấy đúng vấn đề đã biết: ma trận 5×5, chỉ 5 ô "Bắt buộc" trên đường chéo, **0 ô "Được phép"** (stat card nổi bật con số 0), 20 ô còn lại toàn "Không" — rất thưa.

**Khảo sát:** `ConstraintMatrixService.oeBlockMatrix()` (trước sửa) derive thuần từ `block.governed_by_element_code` — rows = 5 Block có governed thật, cols = đúng 5 OE governing đó (1 Block ↔ 1 OE, không hơn), cell chỉ 2 mức req/na, chưa từng dùng mức "pos". Query thật `obligation_type_composition` (qua `docker exec pf-db psql`) tìm nguồn làm giàu không bịa: có **26 Obligation Element thật sự đang được dùng** (distinct trong composition của các OTF), chia theo `element_type_code` (OET) — đúng 5/6 OET có 1 Block "đại diện" (OET_VALUE→BLK_VALUEBASE, OET_ACTIVATION→BLK_DISBURSEMENT, OET_FULFILLMENT→BLK_REPAYMENT, OET_RECOVERY→BLK_COLLATERAL, OET_TIME→BLK_BILLING), chỉ OET_PARTY không Block nào chi phối.

**Quyết định (đã EnterPlanMode, hỏi user qua AskUserQuestion 1 câu về hướng làm giàu, chọn phương án khuyến nghị):** thêm mức "Được phép" (pos) — mỗi Block mở rộng cột ra TOÀN BỘ 26 OE thật CÙNG OET với OE nó đang chi phối (vd BLK_VALUEBASE thêm 4 OE Value khác = "Được phép"), bỏ hẳn OET_PARTY (không Block nào chi phối, đưa vào chỉ toàn "na" — giống lý do Giai đoạn 59 đã bỏ 7 Block luôn-rỗng). Đây là suy luận kỹ thuật có căn cứ (cùng OET = cùng "kiểu câu trả lời" cho cùng 1 câu hỏi định tính) nhưng **chưa có tài liệu xác nhận đây là đúng 100% quy tắc nghiệp vụ** — ghi rõ trong Javadoc để không hiểu nhầm là dữ liệu đã qua duyệt nghiệp vụ tường minh.

**Sửa:** `ConstraintMatrixService.java` — inject thêm `ObligationTypeCompositionRepository`; viết lại `oeBlockMatrix()`: (1) với mỗi trong 5 Block governed, tra `element_type_code` của OE governing nó; (2) quét toàn bộ `obligation_type_composition` lấy distinct `element_code` thật, nhóm theo OET, chỉ giữ OET nào có ít nhất 1 Block chi phối (bỏ OET_PARTY); (3) dựng cột theo từng nhóm OET liền nhau (21 cột: 5 Value + 5 Activation + 4 Fulfillment + 3 Recovery + 4 Time); (4) cell = "req" nếu đúng OE governing, "pos" nếu khác OE nhưng cùng OET với Block đó, "na" nếu khác OET hoàn toàn. Không đổi schema/seed (thuần derive, không cần `down -v`). Không đổi frontend — `MatrixPage.tsx` renderer đã generic theo `cols`/`rows`/`cells` với legend "rpn" có sẵn, và đã có `overflowX: auto` nên 21 cột tự cuộn ngang.

**Verify:** `docker compose up -d --build backend` (không đổi schema/seed) 0 lỗi Maven; curl `GET /api/constraint-matrices/oe-block-matrix` → đúng 5 rows × 21 cols, đúng 5 "req" (đường chéo cũ) + 16 "pos" (cùng OET) + 84 "na" = 105 ô, mỗi Block đúng đủ số cột cùng OET (BLK_VALUEBASE/DISBURSEMENT 5 cột, BLK_REPAYMENT/BILLING 4 cột, BLK_COLLATERAL 3 cột); regression `GET /api/constraint-matrices/foa-oe-matrix` không đổi (vẫn 15 rows × 3 cols), `product-intents/1/detail`/`blocks`/`product-patterns/PT-001/detail` vẫn 200 OK.

### Giai đoạn 68 — Thêm 2 Block thật vào quan hệ Block↔OE (BLK_INTEREST, BLK_LIMIT)

**Bối cảnh:** ngay sau Giai đoạn 67, user hỏi xác nhận chiều ma trận (dọc=Block, ngang=OE), rồi nhận xét "sao ít block thế, làm giàu block hơn nữa đi" — đúng, ma trận mới chỉ có 5/12 Block xuất hiện (chỉ Block có `governed_by_element_code` thật).

**Khảo sát (query thật DB, không suy đoán):** rà cả 7 Block còn lại (đang `governed_by_aspect`) xem có OE thật nào khớp không, qua `docker exec pf-db psql` trên `obligation_type_composition`. Kết quả 3 nhóm rõ ràng:
- **2 Block có real match SẠCH 100%:** `OE_VAL_ACCRUAL_ON_BALANCE` chỉ dùng cho `OT_INTEREST` (7/7 dòng) → khớp thẳng **BLK_INTEREST** (Lãi suất); `OE_VAL_LIMIT_INC_DEC_CAPACITY` chỉ dùng cho OTF họ Facility (2/2 dòng) → khớp thẳng **BLK_LIMIT** (Hạn mức). Cả 2 tên gọi cũng khớp ý nghĩa trực tiếp.
- **1 Block mơ hồ (không đụng):** BLK_COUNTERPARTY↔OET_PARTY có 5 mã `OE_PARTY_*` thật nhưng không mã nào áp đảo (16/8/8/7/2 lần) — chọn 1 sẽ là gán tùy tiện, không sạch như 2 Block trên.
- **Còn lại KHÔNG THỂ có OE thật:** `SELECT DISTINCT ot_core_code FROM obligation_type_composition` chỉ trả 4 giá trị (`OT_ASSET_HANDOVER`/`OT_DISBURSEMENT`/`OT_INTEREST`/`OT_PRINCIPAL_REPAYMENT`) — 3 OT lõi Phụ trợ còn lại (`OT_FEE`/`OT_PENALTY`/`OT_INSURANCE`) chưa từng có 1 dòng composition nào → BLK_FEE/BLK_PENALTY không có căn cứ thật; BLK_ELIGIBILITY/BLK_REGULATORY không thuộc chiều OET nào cả.

**Kiểm tra tác động phụ trước khi sửa:** `governed_by_element_code` còn dùng ở `ProductPatternService` tính banner "Đủ Block bắt buộc" — đã xác nhận cả 6 Pattern hiện có đều ĐÃ có `BLK_INTEREST` trong canvas, và 2 Pattern dùng OTF họ Facility (PT-002/PT-004) đều ĐÃ có `BLK_LIMIT` → thêm governance mới không tạo banner "thiếu Block" giả nào cho 2 Block này.

**Quyết định (đã EnterPlanMode, AskUserQuestion xác nhận phạm vi — chọn phương án khuyến nghị):** chỉ thêm đúng 2 Block sạch, không ép BLK_COUNTERPARTY (dù có OE thật, không sạch bằng — tránh gán tùy tiện).

**Sửa:** `V2__seed.sql` — 2 dòng `block`: `BLK_LIMIT` đổi `governed_by_element_code='OE_VAL_LIMIT_INC_DEC_CAPACITY'` (bỏ `governed_by_aspect`), `BLK_INTEREST` đổi `governed_by_element_code='OE_VAL_ACCRUAL_ON_BALANCE'` (bỏ `governed_by_aspect`) — kèm comment giải thích nguồn gốc. Không đổi code Java nào — `ConstraintMatrixService.oeBlockMatrix()` (Giai đoạn 67) và `ProductPatternService` coverage đều đọc `governed_by_element_code` động, tự nhận Block mới.

**Verify:** `docker compose down -v && up --build` (seed đổi) 0 lỗi; curl `oe-block-matrix` → đúng 7 rows × 21 cols (cột OET_VALUE giờ có 3 "req" khác nhau: BLK_VALUEBASE/BLK_INTEREST/BLK_LIMIT, mỗi Block "pos" chéo nhau trên 4 OE Value còn lại) — tổng 7 req + 24 pos + 116 na; `blocks/BLK_INTEREST/detail` và `blocks/BLK_LIMIT/detail` → đúng `gov` mới; regression `product-patterns/PT-001/detail` → coverage đủ, không có Block thiếu mới liên quan Interest/Limit (PT-002/PT-004 vẫn thiếu 2-3 Block khác — BLK_VALUEBASE/BLK_DISBURSEMENT/BLK_COLLATERAL — nhưng đây là khoảng trống ĐÃ CÓ TỪ TRƯỚC, không liên quan/không do Giai đoạn 68 gây ra, ngoài phạm vi đợt này); `foa-oe-matrix` vẫn 200 OK không đổi.

### Giai đoạn 69 — Phân trang minh họa cho mọi màn list

**Bối cảnh:** user yêu cầu "giờ các màn nào có list hãy làm phân trang cho tôi, k yêu cầu bấm được chỉ để demo thôi" — thêm giao diện phân trang cho mọi màn danh sách, chủ động nói rõ KHÔNG cần chuyển trang thật, chỉ cần có mặt để demo (đúng tinh thần nút CUD "giữ giao diện, no-op, tooltip read-only" đã áp dụng khắp dự án).

**Khảo sát:** prototype gốc (`docs/Product Factory 5.1.html`) không có bất kỳ markup phân trang nào (grep "phân trang"/"pagination" 0 kết quả) — đây là UI mới ngoài prototype (giống tiền lệ Giai đoạn 29/30/34/35 khi prototype không có mà user yêu cầu thêm), nên tự thiết kế theo đúng bảng màu/spacing dự án thay vì trích markup. 12 màn dùng chung `ListScreen.tsx` (component bảng danh sách dùng chung); riêng `ProductCatalogPage.tsx` và `ArchetypePage.tsx` là card-grid tự render, không qua `ListScreen`.

**Sửa:** tạo mới `components/PaginationFooter.tsx` — thanh chân trang chung (props `total`/`pageSize=20`/`unit`): bên trái "Hiển thị N trên tổng M {đơn vị}" tính THẬT từ dữ liệu đã tải (không bịa số), bên phải nút Prev (icon `chevron` xoay 180°)/số trang (tính `Math.ceil(total/pageSize)`, hiện tối đa 7 số + "…")/Next — toàn bộ nút đều `disabled`, có `title` giải thích "Phân trang minh họa — chưa nối dữ liệu thật". Gắn `<PaginationFooter total={visibleIndexes.length} />` vào cuối `ListScreen.tsx` (dùng số dòng ĐANG HIỂN THỊ sau search/filter — tự động có mặt ở cả 12 màn dùng chung component này mà không cần sửa từng trang); gắn riêng vào `ProductCatalogPage.tsx` (`unit="sản phẩm"`) và `ArchetypePage.tsx` (`unit="archetype"`) vì 2 màn này không qua `ListScreen`.

**Verify:** `npm run build` 0 lỗi TS; `docker compose up -d --build frontend`; smoke test curl frontend 200 OK. Không cần đổi backend/schema/seed (thuần frontend, không gọi API nào mới).

### Giai đoạn 70 — Cờ `is_overridable` trên Attribute: khóa/mở ghi đè Fragment

**Bối cảnh:** user thiết kế lại tầng Template/Config: "nếu attribute mà có cắm cờ thì cho ghi đè giá trị" — 1 Attribute cần cờ boolean cho biết giá trị của nó có được phép ghi đè qua Fragment ở Config hay không. Đã hỏi rõ 2 quyết định qua AskUserQuestion: khóa theo **Attribute** (không phải Answer Slot, để đồng nhất quy tắc dù dùng ở nhiều Block khác nhau); enforce **thật** vào logic resolve (không chỉ hiển thị); và **chưa khóa Attribute nào** ở đợt này — thuần dựng hạ tầng, default `true` cho toàn bộ 42 Attribute (0 regression).

**Sửa:**
- Schema: `attribute` thêm cột `is_overridable boolean NOT NULL DEFAULT true` (cùng nhóm 3 cờ `is_required`/`is_unique`/`is_nullable` có sẵn).
- `Attribute.java`: thêm field `overridable`/`isOverridable()` theo đúng khuôn 3 cờ cũ.
- `ProductConfigService.buildBody()` (dùng chung bởi builder Config `detail()` và tab "Giá trị cấu hình" ở Variant `resolved()`): sau khi join Attribute, tính `effectiveFrags = overridable ? frags : List.of()` — Attribute khóa thì Fragment thật vẫn tồn tại trong DB nhưng bị bỏ qua khi resolve (giá trị luôn về template_frame/default, không tính vào completeness). Thêm `overridable`/`ignoredFragmentCount` vào mỗi `slotDetail` để minh bạch khi có Fragment bị bỏ qua (không để dữ liệu "biến mất" không giải thích).
- `AttributeService.list()`/`AttributeUsageService.usage()`: thêm field `overridable`.
- Frontend: `AttributePage.tsx` (cột "Ghi đè" mới trong list + `BoolBadge` thứ 4 trong modal chi tiết), `AttributeUsageDetailPage.tsx` (badge header + banner cảnh báo nếu Attribute khóa nhưng vẫn còn Fragment — chưa xuất hiện vì chưa khóa gì), `ProductConfigDetailPage.tsx` (badge "Attribute khóa ghi đè" + note số Fragment bị bỏ qua), `ProductVariantDetailPage.tsx` (tag "KHÓA" nhỏ cạnh tên slot).

**Verify:** schema đổi → `docker compose down -v && up --build` 0 lỗi Flyway/Maven; curl `attributes`/`attributes/{code}`/`attributes/{code}/usage` → mọi Attribute `overridable:true`; curl `product-configs/{CFG-0021,CFG-0042,CFG-0043}/detail` và `/resolved` → completeness giữ nguyên y hệt trước khi sửa (100% cả 3, đúng dự tính 0 regression), mọi slot `overridable:true`/`ignoredFragmentCount:0`; `npm run build` 0 lỗi TS. Việc chọn Attribute cụ thể nào cần khóa để sau, khi có quy tắc nghiệp vụ rõ ràng hơn.

### Giai đoạn 71 — Quyết định Attribute nào khóa/mở cờ `is_overridable`

**Bối cảnh:** ngay sau Giai đoạn 70, user yêu cầu "dựa vào các tài liệu và các dữ liệu đang có thì hãy suy luận và lên cho tôi bản plan các attribute nào thì có bật cờ ghi đè còn attribute nào thì k" — quyết định nghiệp vụ còn để ngỏ ở Giai đoạn 70.

**Nguồn suy luận:** đọc lại `docs/Lớp+vỏ+thương+mại.doc` (giải mã MHTML — duy nhất trong 5 tài liệu có nhắc "override"/Attribute/Block, đã grep xác nhận 4 tài liệu còn lại không đề cập) — tài liệu nói rõ cần "cơ chế Cho phép override theo Selector Scope ngay từ bước tạo mới Attribute" và phân biệt Attribute "bao nhiêu" (giá trị thương mại biến thiên theo People/Place/Time) với điều kiện/pháp lý/cơ chế cố định. Query thật `docker exec pf-db psql` (join `fragment`↔`answer_slot.attribute_code`): trong 43 Attribute chỉ **22 đã từng có Fragment thật**, 21 chưa từng được ghi đè; chỉ `base_rate`/`limit_amount`/`ltv` có override theo scope People/Place/Time. Phát hiện quan trọng: 3 Attribute có constraint `regulatory` (`base_rate`/`ltv`/`penalty_rate`) đều nằm trong nhóm overridable NHIỀU nhất — xác nhận "có trần pháp lý" ≠ "phải khóa ghi đè".

**Nguyên tắc:** (1) 22 Attribute đã có Fragment thật → bắt buộc giữ `true` (khóa sẽ regression dữ liệu Config đang hoạt động); (2) trong 21 Attribute chưa dùng Fragment, chỉ khóa Attribute có căn cứ tài liệu rõ (cơ chế/định dạng kỹ thuật cố định hoặc thủ tục pháp lý chuẩn hóa — không phải "bao nhiêu" thương mại), còn lại giữ `true` mặc định an toàn.

**Kết quả:** đã EnterPlanMode, trình bày 3 nhóm (A giữ true 22 mã có Fragment thật, B đề xuất khóa 6 mã, C giữ true 15 mã còn lại không đủ căn cứ), hỏi qua AskUserQuestion — user chọn **đồng ý cả 6 mã Nhóm B**. Khóa `is_overridable=false` cho: `dispute_resolution` (GRP_LEGAL — cơ chế pháp lý chuẩn hóa), `disb_syntax`/`transfer_content` (định dạng kỹ thuật cố định, vd "F88 {contract}"), `rounding_rule` (quy ước tính toán, GRP_VALUE), `penalty_base` (cơ chế tính phạt, khác `penalty_rate` là con số % vẫn giữ overridable), `disb_timing` (gắn quy trình thẩm định rủi ro của Pattern).

**Sửa:** `V2__seed.sql` — thêm 1 câu `UPDATE "attribute" SET is_overridable=false WHERE code IN (...)` ngay sau block seed Attribute (mục 12c), kèm comment giải thích từng mã. Không đổi code Java/TSX (hạ tầng đã đủ từ Giai đoạn 70).

**Verify:** `docker compose down -v && up --build` 0 lỗi; curl `attributes` → đúng 6 dòng `overridable:false`/37 dòng `true`; curl `product-configs/{CFG-0021,CFG-0037,CFG-0038,CFG-0039,CFG-0040,CFG-0041,CFG-0042,CFG-0043}/resolved` → completeness **100% cả 8 Config, giữ nguyên y hệt trước khi khóa** — đúng dự tính 0 regression vì cả 6 mã Nhóm B chưa từng có Fragment; slot của 6 Attribute này hiện đúng `overridable:false`/`ignoredFragmentCount:0`/vẫn kế thừa `inheritedFrameValue` từ Template bình thường. Đây là suy luận dựa trên tài liệu ngắn + dữ liệu sample — không phải quy tắc nghiệp vụ đã xác nhận 100%, tương tự các suy luận kỹ thuật trước ở Giai đoạn 67/68.

### Giai đoạn 72 — Vá lỗ hổng "slot không có giá trị gì" ở màn Config (Template→Config)

**Bối cảnh:** user quan sát: Attribute không ghi đè, đáng lẽ kế thừa default từ Template — nhưng kiểm tra lại thấy có attribute/slot ở màn Config hoàn toàn không có giá trị gì. Yêu cầu rà soát và bổ sung từ Template xuống Config.

**Rà soát (query thật, không bịa):**
1. Curl `resolved()` cho toàn bộ 8 Config hiện có (CFG-0021/037/038/039/040/041/042/043), kiểm tra mọi slot có `fragments` rỗng + `inheritedFrameValue=null` + `slotDefaultValue=null` cùng lúc (= hoàn toàn trống) → **0 slot trống** ở tầng `/resolved` (tab "Giá trị cấu hình" Variant) trước khi vá.
2. Nhưng phát hiện **bug hiển thị thật ở builder Config** (`ProductConfigDetailPage.tsx`, route `/config/:code`): interface `SlotDetail` **thiếu hẳn field `slotDefaultValue`** (dù backend `buildBody()` đã trả từ Giai đoạn 46) và khối hiển thị chỉ có 1 nhánh `{selectedSlot.inheritedFrameValue && (...)}` — khi Template CHƯA có khung (`inheritedFrameValue=null`) nhưng Answer Slot có `default_value`, builder không hiện gì cả, đúng như user mô tả "không có giá trị gì" — khác `ConfigValuesTab` (tab Variant) đã có fallback 3 tầng từ Giai đoạn 46.
3. Query trực tiếp `docker exec pf-db psql` đối chiếu MỌI `pattern_block`×`answer_slot` của cả 6 Template với `template_frame` (LEFT JOIN tìm `template_code IS NULL`) → tìm đúng **4 dòng thiếu khung thật**: `TPL-001`/`TPL-002` × `BLK_LIMIT` × 2 slot (`capacity_range` — BẮT BUỘC, `min_amount` — tùy chọn) — khớp đúng dữ liệu quan sát được (`capacity_range` vẫn "hoạt động" nhờ có Fragment thật ở mọi Config dùng 2 Template này, nhưng `min_amount` hoàn toàn không Fragment nào → hiện trống thật trên builder).

**Sửa:**
- `V2__seed.sql`: thêm 4 dòng `template_frame` (`TPL-001`/`TPL-002` × `capacity_range`='Có quản trị', `min_amount`='0đ') — giá trị lấy đúng từ `answer_slot.default_value` sẵn có + khớp mọi Fragment thật đang dùng cho `capacity_range`, không bịa số mới.
- `ProductConfigDetailPage.tsx`: thêm field `slotDefaultValue` vào `SlotDetail`; khối hiển thị đổi thành 3 nhánh — có `inheritedFrameValue` → "Kế thừa giá trị khung từ Template", không có nhưng `fragmentCount===0 && slotDefaultValue` → "Mặc định Answer Slot", còn lại (thật sự trống) → không hiện gì — khớp đúng logic `ConfigValuesTab` đã có.

**Verify:** seed đổi → `docker compose down -v && up --build` 0 lỗi; rà lại toàn bộ 8 Config qua `/resolved` → vẫn 0 slot trống (không đổi); curl riêng `capacity_range`/`min_amount` của 4 Config dùng TPL-001/002 → cả 2 giờ có `inheritedFrameValue` thật ("Có quản trị"/"0đ"); completeness 8 Config **giữ nguyên 100% y hệt trước khi vá** (đúng dự tính — `capacity_range` đã có Fragment tính completeness từ trước, `min_amount` không bắt buộc); `npm run build` 0 lỗi TS; curl `/detail` (builder) xác nhận cả 2 slot trả đủ `slotDefaultValue`.

### Giai đoạn 73 — Phân biệt Attribute "chính gốc" (cần điền ở Template) vs "đơn giản" (tự động lấy default từ Attribute)

**Bối cảnh:** ngay sau Giai đoạn 72, user hỏi thêm về "Xem trước Resolution" ở builder Config chỉ tính theo Fragment, bỏ qua Template/default (xác nhận đúng, code `resolution` useMemo chỉ lọc `selectedSlot.fragments`). Từ đó user đặt câu hỏi kiến trúc lớn hơn: dự án demo chỉ ~43 Attribute nên còn khả thi điền `template_frame` cho từng Template, nhưng dự án thật sẽ có hàng nghìn Attribute — không thể bắt mỗi lần tạo Template phải điền default cho tất cả. Đề xuất: tách Attribute thành "chính gốc/quan trọng/tiên quyết" (vẫn cho điền default riêng ở Template) và "đơn giản" (gán default ngay ở tầng Attribute, Template tự động lấy ra, không cần điền lại).

**Khảo sát (query thật, không suy đoán):** `attribute.default_value` và `answer_slot.default_value` trùng nhau 42/43 dòng (chỉ lệch `asset_type` — attribute còn dạng cũ "Xe máy", answer_slot đã chuẩn hoá "Xe máy (TwoWheels)" từ Giai đoạn 63 nhưng bỏ sót cột attribute) — xác nhận 2 cột về bản chất là 1, gộp về 1 nguồn (tầng Attribute) được. Test tiêu chí phân loại bằng dữ liệu thật: đếm số giá trị `template_frame` PHÂN BIỆT thật của mỗi Attribute qua 6 Template — 17/43 có ≥2 giá trị khác nhau thật (base_rate 4, asset_type/installment_count/limit_amount 3, còn lại 2) → nhóm chính gốc thật; 26 Attribute còn lại chỉ có ĐÚNG 1 giá trị y hệt ở mọi Template — kể cả 6 Attribute đang `is_required=true` (age/compliance/lender_party/penalty_rate/rate_type/schedule...) chưa từng biến thiên thật. Đã hỏi qua AskUserQuestion xác nhận dùng tiêu chí dữ liệu thật thay vì suy diễn từ `is_required` (đã chứng minh không tương quan). Kiểm tra khoảng trống: LEFT JOIN toàn bộ 6 Template × 17 Attribute chính gốc với `template_frame` → 0 dòng thiếu (Giai đoạn 60/61/72 đã lấp đủ).

**Sửa:**
- `V1__schema.sql`: thêm cột `attribute.is_template_customizable boolean NOT NULL DEFAULT false`.
- `V2__seed.sql`: sửa `asset_type.default_value` → 'Xe máy (TwoWheels)' (khớp catalog); thêm `UPDATE "attribute" SET is_template_customizable=true WHERE code IN (17 mã)`.
- `Attribute.java`: thêm field `templateCustomizable`/`isTemplateCustomizable()`.
- `ProductConfigService.buildBody()`: đổi nguồn `slotDefaultValue` từ `slot.getDefaultValue()` (Answer Slot) sang `attr.getDefaultValue()` (Attribute — single source of truth, đúng tinh thần "gán default ở tầng Attribute, Template lấy ra dùng"); thêm `templateCustomizable` và `missingTemplateFrame` (= chính gốc mà chưa có `template_frame` — CHỈ cảnh báo cho nhóm chính gốc, nhóm đơn giản không có template_frame là bình thường) vào `slotDetail`. `AttributeService.list()`/`AttributeUsageService.usage()` thêm field `templateCustomizable`.
- Frontend: `AttributePage.tsx` (cột "Cấu hình Template" mới + `TemplateChip`, `BoolBadge` thứ 5 trong modal), `AttributeUsageDetailPage.tsx` (badge header), `ProductConfigDetailPage.tsx`/`ProductVariantDetailPage.tsx` (đổi nhãn fallback "Mặc định Answer Slot"→"Mặc định từ Attribute", thêm badge chính gốc/đơn giản + cảnh báo khi `missingTemplateFrame`).

**Verify:** schema đổi → `docker compose down -v && up --build` 0 lỗi; curl `attributes` → đúng 17 `templateCustomizable:true`/26 `false`; curl `attributes/asset_type` → `defaultValue:"Xe máy (TwoWheels)"` (đã hết lệch); curl `product-configs/*/resolved` cho cả 8 Config → **completeness giữ nguyên 100% y hệt trước khi sửa** (0 regression), `missingTemplateFrame` toàn bộ = false (đúng dự tính — không có lỗ hổng thật nào); `npm run build` 0 lỗi TS.

### Giai đoạn 74 — "Xem trước Resolution" fallback đúng theo Attribute chính gốc/đơn giản

**Bối cảnh:** ngay sau Giai đoạn 73, user hỏi xác nhận khối "Xem trước Resolution" ở builder Config có phải chỉ tính theo Fragment không — xác nhận đúng (`resolution` useMemo chỉ lọc `selectedSlot.fragments`, bỏ qua Template/default nên hiện "— chưa cấu hình —" dù bên trái đã ghi rõ giá trị kế thừa). User yêu cầu "gán luôn giá trị gốc cho attribute đi sao để mỗi đơn giản và chính gốc thế" — vá để khối này resolve đúng cho cả 2 nhóm Attribute (chính gốc/đơn giản) vừa phân loại ở Giai đoạn 73.

**Sửa:** `ProductConfigDetailPage.tsx` — `resolution` useMemo thêm 2 tầng fallback khi không có Fragment nào khớp ngữ cảnh: (1) `inheritedFrameValue` (Attribute chính gốc, kế thừa khung Template) → winner tổng hợp `source:'template'`; (2) `slotDefaultValue` (Attribute đơn giản, default gán ở tầng Attribute) → winner tổng hợp `source:'attribute-default'`; chỉ khi cả 2 đều không có mới thật sự "chưa cấu hình". Thêm 2 mục `SCOPE_META` (`template` xanh lá, `attribute-default` tím) cho badge "Thắng: ..." đúng màu; câu giải thích bên dưới phân biệt rõ 3 nguồn (Fragment/Template/Attribute-default); ẩn dòng "ưu tiên N" khi nguồn không phải Fragment thật (tránh hiện số priority âm vô nghĩa).

**Verify:** `npm run build` 0 lỗi TS; `docker compose up -d --build frontend`; smoke test 200 OK. Thuần frontend, không đổi backend/schema/seed (đã có sẵn `inheritedFrameValue`/`slotDefaultValue` trong `slotDetail` từ Giai đoạn 72-73).

### Giai đoạn 75 — Hiện "Giá trị gốc" ngay trong bảng danh sách Attribute

**Bối cảnh:** user xem màn Attribute list (screenshot), thấy các cột Bắt buộc/Ghi đè/Cấu hình Template nhưng không thấy giá trị `default_value` thật ở đâu — yêu cầu hiện luôn giá trị gốc trong bảng, nhất là cho Attribute "đơn giản" (giá trị đó chính là giá trị phục vụ thật, không cần Template tuỳ biến).

**Sửa:** `AttributeService.list()` — thêm field `defaultValue` (trước đây route list() hoàn toàn không trả field này, dù entity đã có sẵn). `AttributePage.tsx` — thêm cột "Giá trị gốc" ngay sau "Data Type": Attribute "đơn giản" hiện đậm màu `#243A30` (đây là giá trị phục vụ thật), Attribute "chính gốc" hiện nhạt màu `#8A998F` (chỉ là baseline, Template thật sự dùng có thể khác — tránh gây hiểu nhầm đây là giá trị cuối).

**Verify:** curl `attributes` → mọi dòng có `defaultValue` đúng dữ liệu thật; `npm run build` 0 lỗi TS; `docker compose up -d --build backend frontend`; smoke test 200 OK.

### Giai đoạn 76 — Chỉ hiện "Giá trị gốc" cho Attribute đơn giản, ẩn hẳn với Attribute chính gốc

**Bối cảnh:** ngay sau Giai đoạn 75, user tinh chỉnh: cột "Giá trị gốc" nên chỉ hiện con số thật cho Attribute "Đơn giản"; Attribute "Chính gốc" thì KHÔNG hiện giá trị gốc nữa (vì giá trị thật khác nhau theo từng Template, hiện 1 con số baseline dễ gây hiểu nhầm — đúng tinh thần đã cảnh báo ở Giai đoạn 75 nhưng giờ ẩn hẳn thay vì chỉ làm nhạt màu).

**Sửa:** `AttributePage.tsx` — cột "Giá trị gốc": nếu `templateCustomizable=true` (chính gốc) hiện nhãn "Theo Template" (chữ nghiêng, xám nhạt, có tooltip giải thích "giá trị thật khác nhau theo từng Template, xem ở Template tương ứng") thay vì con số; nếu `false` (đơn giản) hiện đúng `defaultValue` thật, đậm màu.

**Verify:** `npm run build` 0 lỗi TS; `docker compose up -d --build frontend`; smoke test 200 OK. Thuần frontend, không đổi backend/schema.

### Giai đoạn 77 — Bổ sung "Giá trị gốc" vào màn chi tiết Attribute Usage

**Bối cảnh:** ngay sau Giai đoạn 76, user gửi 2 ảnh chụp (`/attribute/min_amount` và `/attribute`) chỉ ra màn chi tiết Attribute (`/attribute/:code`) hoàn toàn chưa hiện giá trị gốc ở đâu — cần bổ sung; đồng thời xác nhận lại yêu cầu ẩn giá trị gốc của Attribute chính gốc ở màn list (đã đúng từ Giai đoạn 76, ảnh chụp chỉ là bản UI cũ do Docker chưa build lại được — gặp sự cố Docker Desktop lỗi WSL treo giữa phiên, đã tự xử lý bằng `wsl --shutdown` rồi build lại toàn bộ stack).

**Sửa:** Backend `AttributeUsageService.usage()` đã trả sẵn field `defaultValue` từ trước — không cần sửa. `AttributeUsageDetailPage.tsx`: thêm `defaultValue` vào interface `AttributeInfo`; thêm badge mới cạnh badge "Chính gốc/Đơn giản" ở header — `templateCustomizable=false` (đơn giản) → badge xanh "Giá trị gốc · {defaultValue}"; `true` (chính gốc) → badge nhạt chữ nghiêng "Giá trị gốc · Theo Template" kèm tooltip, nhất quán với màn list (Giai đoạn 76).

**Verify:** `npm run build` 0 lỗi TS; Docker rebuild toàn bộ (`down -v && up --build`, áp dụng tích luỹ schema/seed từ Giai đoạn 66-76 lần đầu sau sự cố) — cả 3 container lên khỏe; curl `attributes/base_rate/usage` đúng `templateCustomizable:true`+`defaultValue:"1,5%/tháng"`; smoke test 200 OK. Thuần frontend, không đổi backend/schema.

---
---

## 5. ĐANG LÀM DỞ

Không có màn nào đang dở giữa chừng. Vừa xong **Giai đoạn 77 — Bổ sung "Giá trị gốc" vào màn chi tiết Attribute Usage** (badge mới ở header `/attribute/:code`, nhất quán với màn list), sau **Giai đoạn 76 — Chỉ hiện "Giá trị gốc" cho Attribute đơn giản, ẩn hẳn với chính gốc** (tinh chỉnh ngay sau Giai đoạn 75 — thay vì chỉ làm nhạt màu, Attribute "chính gốc" giờ ẩn hẳn con số baseline, hiện nhãn "Theo Template" thay thế, tránh hiểu nhầm), sau **Giai đoạn 75 — Hiện "Giá trị gốc" ngay trong bảng danh sách Attribute** (user xem màn Attribute list, không thấy default_value đâu — thêm field `defaultValue` vào `AttributeService.list()` [trước đây thiếu hoàn toàn] + cột mới trong `AttributePage.tsx`, đậm màu cho Attribute đơn giản/nhạt màu cho chính gốc để không gây hiểu nhầm), sau **Giai đoạn 74 — "Xem trước Resolution" fallback đúng theo Attribute chính gốc/đơn giản** (khối GIÁ TRỊ RESOLVE ở builder Config trước đây chỉ tính Fragment, hiện "chưa cấu hình" sai dù đã có giá trị kế thừa — vá thêm 2 tầng fallback Template/Attribute-default khớp đúng phân loại Giai đoạn 73, thuần frontend), sau **Giai đoạn 73 — Phân biệt Attribute "chính gốc" vs "đơn giản"** (giải quyết bài toán "hàng nghìn Attribute trong dự án thật không thể bắt điền default ở mọi Template" — cột mới `is_template_customizable`, phân loại bằng dữ liệu thật [đếm giá trị template_frame phân biệt qua 6 Template, không dùng is_required vì đã chứng minh không tương quan]: 17/43 chính gốc cần Template tự khai báo, 26/43 đơn giản tự động lấy default từ tầng Attribute; `slotDefaultValue` đổi nguồn từ answer_slot sang attribute [single source of truth], vá luôn 1 lệch dữ liệu asset_type; completeness 8 Config giữ nguyên 100%), sau **Giai đoạn 72 — Vá lỗ hổng "slot không có giá trị gì" ở màn Config** (user quan sát attribute không ghi đè nhưng lại không kế thừa default từ Template ở màn Config; rà soát phát hiện bug hiển thị thật ở builder `ProductConfigDetailPage.tsx` — thiếu fallback `slotDefaultValue` [tab Variant `ConfigValuesTab` đã có từ Giai đoạn 46 nhưng builder Config thì chưa] + 4 dòng `template_frame` thật sự thiếu ở TPL-001/TPL-002×BLK_LIMIT [`capacity_range` bắt buộc, `min_amount` tùy chọn] tìm qua LEFT JOIN toàn bộ pattern_block×answer_slot với template_frame; đã vá cả 2 nguyên nhân, verify completeness 8 Config giữ nguyên 100%), sau **Giai đoạn 71 — Quyết định Attribute nào khóa/mở cờ `is_overridable`** (dựa trên tài liệu "Lớp vỏ thương mại" + query Fragment thật, chia 43 Attribute thành 3 nhóm: 22 có Fragment thật giữ `true` bắt buộc, 6 đề xuất khóa `false` [dispute_resolution/disb_syntax/transfer_content/rounding_rule/penalty_base/disb_timing — cơ chế/định dạng kỹ thuật cố định hoặc pháp lý chuẩn hóa, KHÔNG phải giá trị "bao nhiêu" thương mại], 15 còn lại giữ `true` vì không đủ căn cứ; đã EnterPlanMode + AskUserQuestion, user chọn đồng ý cả 6 mã; sửa 1 câu UPDATE trong `V2__seed.sql`, verify completeness 8 Config đã biết giữ nguyên 100% — đúng 0 regression), sau **Giai đoạn 70 — Cờ `is_overridable` trên Attribute** (thiết kế Template mới: Attribute cần cờ boolean cho biết có cho phép ghi đè qua Fragment hay không; đã hỏi rõ khóa theo Attribute + enforce thật vào `ProductConfigService.buildBody()` + chưa khóa Attribute nào đợt này [default true, 0 regression] — hạ tầng schema/entity/service/frontend đã đầy đủ, chờ quy tắc nghiệp vụ cụ thể để chọn Attribute nào khóa sau), sau **Giai đoạn 69 — Phân trang minh họa cho mọi màn list** (user yêu cầu thêm giao diện phân trang cho mọi màn danh sách, chủ động nói rõ không cần bấm chuyển trang được, chỉ demo — prototype gốc không có markup phân trang nào nên tự thiết kế `components/PaginationFooter.tsx` mới theo bảng màu dự án; gắn vào cuối `ListScreen.tsx` [tự động có mặt ở 12 màn dùng chung] + `ProductCatalogPage.tsx`/`ArchetypePage.tsx` [2 màn card-grid không qua ListScreen]; số liệu hiển thị tính thật từ dữ liệu đã tải, chỉ hành vi chuyển trang là no-op — đúng tinh thần nút CUD đã áp dụng khắp dự án; thuần frontend, không đổi backend/schema/seed), sau **Giai đoạn 68 — Thêm 2 Block thật vào quan hệ Block↔OE (BLK_INTEREST, BLK_LIMIT)** (user muốn ma trận có nhiều Block hơn — rà 7 Block còn thiếu governed_by_element_code, tìm được đúng 2 Block có OE thật khớp 100% sạch [OE_VAL_ACCRUAL_ON_BALANCE→BLK_INTEREST, OE_VAL_LIMIT_INC_DEC_CAPACITY→BLK_LIMIT], 1 Block mơ hồ [BLK_COUNTERPARTY, 5 mã Party không mã nào áp đảo] và 4 Block không có OE thật nào [Fee/Penalty/Insurance chưa từng có composition, Eligibility/Regulatory không thuộc OET nào] — đã kiểm tra kỹ trước khi sửa để không gây banner "thiếu Block" giả cho Pattern hiện có, chỉ sửa 2 dòng seed, không đổi code; ma trận OE×Block giờ 7 Block × 21 cột, phát hiện phụ [ngoài phạm vi]: PT-002/PT-004 vốn đã thiếu 2-3 Block khác từ trước, không liên quan đợt này), sau **Giai đoạn 67 — Ma trận "Obligation Element × Block": thêm mức "Được phép"** (user xem ảnh chụp màn Ma trận thật, thấy 0 ô "Được phép" — quá thưa, yêu cầu làm giàu; đã EnterPlanMode, hỏi hướng làm giàu qua AskUserQuestion — chọn thêm "pos" suy từ cùng OET (element_type_code) thay vì chỉ mở rộng cột giữ nguyên req/na; `ConstraintMatrixService.oeBlockMatrix()` giờ 5 Block × 21 cột [gộp theo 5 OET có Block chi phối, bỏ OET_PARTY] thay vì 5×5 — 5 req + 16 pos + 84 na; thuần derive từ `obligation_type_composition` đã có, không đổi schema/seed/frontend; đã ghi rõ đây là suy luận kỹ thuật theo OET chứ chưa có tài liệu xác nhận đúng 100% nghiệp vụ), sau **Giai đoạn 66 — Product Intent list/detail: dựng cấu trúc OT lõi Cốt lõi/Phụ trợ thật** (user xem checklist Bước 2 ở Quy trình phát hành, hỏi Product Intent có phản ánh đúng "điền OE 3 OT lõi Cốt lõi + bật/tắt Phụ trợ" không — xác nhận KHÔNG, `product_intent_element` hoàn toàn phẳng; đã EnterPlanMode, backfill 168 dòng đúng lineage Pattern con→OTF Primary→composition thật [thay 27 dòng phẳng cũ], đổi PK+thêm cột `ot_core_code`/`element_type_code`/`leg`, tách `ProductIntentService` mới group theo ot_core/leg + đối chiếu `ot_activation_rule` theo đúng OE của từng Intent, list thêm cột "OT lõi", detail thay "Element nền" bằng cấu trúc OT lõi + khối Quy tắc kích hoạt — verify đầy đủ qua Docker+curl, khớp 100% dự tính), sau **Giai đoạn 65 — Xuất PDF Simulation: chuyển từ hộp thoại In sang tải file thật** (user phản hồi "xuất là tải về chứ" ngay sau Giai đoạn 64 — bản `window.print()` vẫn cần chọn tay "Save as PDF", không phải tải trực tiếp như "Xuất CSV"; chuyển sang `jsPDF`+`jspdf-autotable`, nhúng font Be Vietnam Pro OFL-1.1 tải từ repo Google Fonts chính thức vì 14 font chuẩn PDF không đủ ký tự có dấu tiếng Việt; `doc.save()` tải file `.pdf` ngay lập tức; dùng `import()` động để không tăng bundle chính cho mọi màn khác — verify build xác nhận chunk chính giữ nguyên 438KB; **chưa verify bằng trình duyệt thật** do môi trường không có browser automation), sau **Giai đoạn 64 — làm thật nút "Xuất PDF" ở màn Simulation Engine** (nút trước đây no-op, giờ dựng trang HTML in-được từ `result`/`form` đã có client-side rồi gọi `window.print()` — không thêm thư viện PDF mới, trình duyệt tự cho lưu "Save as PDF"; **chưa verify bằng trình duyệt thật** do môi trường phiên này không có browser automation, đã rà kỹ code + build 0 lỗi TS, khuyến nghị user tự bấm thử), sau **Giai đoạn 63 — mọi Attribute có "giá trị kèm theo" ngay từ khởi tạo, đối soát Template/Fragment khớp catalog** (user muốn mọi Attribute có sẵn danh mục giá trị để điền Template sau này không cần gõ tay — thêm attribute_enum_value cho 3 Attribute DT_BOOL, đối chiếu toàn bộ template_frame/fragment/answer_slot.default_value với catalog DT_ENUM/DT_BOOL phát hiện 8 chỗ lệch thật (asset_type dạng ngắn không khớp catalog dạng dài, occupation/asset_type-Laptop dùng giá trị hợp lý nhưng ngoài catalog) — sửa bằng cách bổ sung catalog cho khớp giá trị thật đang dùng + chuẩn hoá 6 chỗ rõ ràng là viết tắt, sau sửa 0 chỗ lệch), sau **Giai đoạn 62 — vá 2 Config published (CFG-0041/CFG-0042) thiếu Fragment cho 6 slot bắt buộc** (user yêu cầu rà mọi Config `published`/`approved`/`retired` xem còn slot chưa có giá trị — phát hiện CFG-0041/CFG-0042 [TPL-003/PT-002] thiếu Fragment cho 6 slot bắt buộc dù Template đã có đủ khung; xác nhận giả thuyết "điền Template rồi tự fill" của user chỉ ĐÚNG MỘT PHẦN — Template là điều kiện cần nhưng completeness chỉ tính Fragment thật, không tính giá trị kế thừa; thêm 12 dòng fragment khớp đúng template_frame có sẵn, cả 2 Config lên 100%), sau **Giai đoạn 61 — làm giàu sample data cho Block/Attribute/Answer Slot + lan xuống Pattern/Template/Config** (mỗi 12 Block +1 Answer Slot mới, tái dùng group_code/domain có sẵn — không tạo Block/nhóm mới theo lựa chọn user; `reference_index` kèm 1 attribute_constraint dependency đúng nguyên văn ví dụ tài liệu "Lớp vỏ thương mại"; điền 52 dòng `template_frame` cho 6 Template theo đúng tập Block của Pattern gốc, giá trị hợp bối cảnh từng Template — không rập khuôn 1 giá trị; tất cả slot mới optional nên completeness các Config không đổi), sau **Giai đoạn 60 — làm đầy Block/Attribute còn thiếu trong 4 Pattern đã duyệt/xuất bản** (rà PT-001/003/005/006 — cả 4 đều `approved`/`published` — theo ma trận OE×Block derived, phát hiện thiếu BLK_VALUEBASE ở cả 4 và BLK_DISBURSEMENT ở 3/4 [PT-003 đã có sẵn]; Attribute/Answer Slot của 2 Block này đã có sẵn trong schema từ trước, chỉ chưa được dùng; thêm 7 dòng `pattern_block` + `template_frame` cho 5 Template liên quan + `fragment` scope=default cho 6 Config liên quan [chỉ template_frame KHÔNG đủ để completeness lên 100%, phải có Fragment thật — đúng hành vi đã thiết lập từ Giai đoạn 48]; tiện thể vá luôn 1 lỗ hổng sót từ Giai đoạn 48: CFG-0037/TPL-002 thiếu fragment BLK_LIMIT; kết quả cả 4 Pattern đủ Block bắt buộc, cả 6 Config liên quan lên completeness 100%; hoàn toàn seed data, không đổi code Java/TSX), sau **Giai đoạn 59 — sửa 3 lỗi phát hiện ngay sau Giai đoạn 58 + bổ sung dữ liệu FOA×OE theo tài liệu** (badge sidebar hiện đúng số, ma trận OE×Block bỏ 7 Block luôn-rỗng khỏi hàng, foa_element thêm 2 OE thiếu + sửa 9 ô lệch — xác nhận qua psql trực tiếp KHÔNG có gì hardcode; xoá 2 card Obligation Nature/Value Structure ở Archetype detail), sau **Giai đoạn 58 — màn Ma trận chỉ còn đúng 2 ma trận (FOA × Obligation Element, Obligation Element × Block)** (bỏ hẳn OET×OET và Pattern×Block-độ-phủ khỏi màn Ma trận theo yêu cầu user; OE×Block derived từ block.governed_by_element_code có sẵn, không tạo bảng mới; banner độ phủ Pattern builder đổi nguồn theo — PT-001 giờ hiện đúng "Thiếu 2 Block" thay vì "Đủ" cũ vì dữ liệu cũ là fabricated), sau **Giai đoạn 57 — cập nhật checklist Bước 2 "Tạo Product Intent" ở Quy trình phát hành theo mô hình OTF mới** (3 checklist + desc/tip liên quan trong `ReleaseProcessService.java`/`V2__seed.sql` không còn nhắc "Obligation Nature"/"Family" đã xoá từ Giai đoạn 51-52, thay bằng đúng flow điền OE cho OT lõi Cốt lõi/Phụ trợ), sau **Giai đoạn 56 — spell-out "OTF" thành "Obligation Type Family (OTF)" ở mọi nhãn/tiêu đề còn viết tắt trần** (Dashboard/Archetype/Sysmap/ObligationPage/ObligationTypeDetail/Matrix/GlobalSearch/tables.ts + 2 chỗ sót ở Pattern + tab Variant tái dùng data Pattern — theo lựa chọn "sửa hết mọi chỗ" của user, trừ cột bảng dữ liệu và câu văn xuôi vẫn giữ ngắn), sau **Giai đoạn 55 — màn Product Pattern: đổi nhãn "Obligation Type" → "Obligation Type Family"** (khác Giai đoạn 54, riêng màn Pattern dùng dạng đầy đủ chứ không viết tắt "OTF"), sau **Giai đoạn 54 — nhất quán hoá nhãn "Obligation Type" → "OTF"** (rà toàn UI đổi hết chỗ còn dùng "Obligation Type"/"Obligation Type Family (OTF)" sang gọn "OTF" — Archetype/Matrix/Dashboard/GlobalSearch/tables.ts, kể cả `constraint_matrix.title` seed sót từ Giai đoạn 52b; CHỦ Ý giữ nguyên "OT"/"Obligation Type" ở riêng màn Pattern theo yêu cầu; sửa đúng "Quy tắc kích hoạt OT lõi phụ trợ" thay vì áp máy móc thành OTF vì đó là khái niệm khác), sau **Giai đoạn 53b — liên kết OE→Block + layout dạng cột cho detail OTF** (xác nhận qua tài liệu "Lớp vỏ thương mại": Block không nằm "trong" OE mà là tầng kế tiếp được OE "chi phối", dùng đúng `block.governed_by_element_code` có sẵn; đổi layout "Cấu trúc OTF" từ lưới thẻ sang bảng 3 cột theo phản hồi "hơi rối" của user), sau **Giai đoạn 53 — detail cho Obligation Type Family (OTF)** (route `/obligation-type/:code`, backend `ObligationTypeService.detail()` join Pattern dùng OTF + cấu trúc OT lõi/leg/OET; tab OTF trong Obligation Library giờ click được), sau **Giai đoạn 52b — đổi nhãn "Element Type" → "OET"** (user hỏi lại tại sao tab vẫn tên "Element Type" — hoá ra là vấn đề TÊN chứ không phải dữ liệu, tài liệu chỉ dùng "OET"/"Obligation Element Type", đổi nhất quán ở tab/cột/backend rowHead), sau **Giai đoạn 52 — bỏ "Element Type" thừa** (gỡ `OET_NATURE`/`OET_LIFECYCLE` khỏi Obligation Library — trùng lặp/không dữ liệu thật, phát hiện qua đối chiếu tài liệu BA v1.0 mới với Obligation Library; bỏ cột `product_intent.nature_element_code`, co ma trận FOA×OE 16→13 hàng, sửa 3 Block governed-by trỏ sang FOA thật thay vì nature giả), sau **Giai đoạn 51b — sửa catalog Obligation Element cho đúng Data Dictionary 36 mã đóng** (đổi tên 13 mã kiểu cũ, gộp `PAYMENT_BULLET` trùng lặp, thêm 10 mã catalog còn thiếu, áp dụng nhất quán ở 6 chỗ dùng element_code trong `V2__seed.sql` — chỉ sửa seed, không đổi code Java/TSX), sau **Giai đoạn 51 — tái cấu trúc Lõi Nghĩa Vụ Tài Chính theo tài liệu FOA/OET/OE/OT/OTF** (gộp bỏ `obligation_family` trùng FOA, tách `obligation_type_composition` theo OT lõi thật + `leg`, thêm `obligation_type_core`/`ot_activation_rule`, gộp `foa_element`+`constraint_matrix` về 1 nguồn — backfill 246 dòng composition cho 9 OTF, chưa verify Playwright do môi trường không có browser tool), sau **Giai đoạn 50 — sửa bug EMI trôi dần khi có phí quản lý + đổi sang tính lãi/phí theo ngày thật (actual/365)** (PMT giờ tính trên rate gộp lãi+phí thay vì chỉ lãi, CPV mỗi kỳ tính theo số ngày thật/365 thay vì "1 kỳ=1 tháng chẵn", kỳ cuối có plug đưa dư nợ về đúng 0 — phát hiện từ file Excel tham chiếu user gửi, đã EnterPlanMode do đổi lõi công thức), sau **Giai đoạn 49 — sửa lệch ưu đãi lãi suất VIP < Thân thiết trong Simulation Engine** (không phải bug logic — dữ liệu `customer_segment` đặt ngược ưu đãi 2 tier, đã đổi lại VIP=−0,5%/tháng cao hơn Thân thiết=−0,3%/tháng theo đúng thứ tự thông thường, xác nhận qua AskUserQuestion), sau **Giai đoạn 48 — bổ sung Block "Hạn mức" (BLK_LIMIT) vào Pattern PT-001** (thêm `pattern_block`/`template_frame`/`fragment` cho TPL-001/TPL-002 và 3 Config CFG-0021/CFG-0040/CFG-0043 — khớp đúng `limit_range` thật đã có sẵn ở từng Variant, không bịa số mới; hoàn toàn seed data, không đổi code), sau **Giai đoạn 47 — Simulation Engine bỏ hardcode, tính từ dữ liệu thật của sản phẩm** (`appraisalFee`/`segmentCode`/`penaltyFactor` resolve thật theo Config/Template nguồn qua `resolveSlotValue` 3 tầng fallback; `grace` (miễn phạt N ngày trễ) áp dụng vào công thức phạt qua field mới `graceDays`; nhóm C — `periodicFeePct`/`startDate`/toggle kịch bản — giữ nguyên là input người dùng theo yêu cầu user), sau **Giai đoạn 46 — tab "Giá trị cấu hình" ở Variant hiện ĐỦ mọi Answer Slot** (endpoint mới `GET /api/product-configs/{code}/resolved` không lọc theo block đã có fragment như `/detail` builder cũ, thêm tầng fallback `slotDefaultValue`, completeness% giờ tính đúng trên toàn pattern), sau **Giai đoạn 45 — màn detail cho Nhật ký hoạt động** (route `/activity/:id`, banner theo hành động tái dùng `STATUS_COLORS`, liên kết sang entity nguồn, khối "Hoạt động liên quan" tái dùng `ApprovalHistory` qua prop `title` mới), sau **Giai đoạn 44 — "Lịch sử duyệt" cho Business Intent & Product Intent + filter Hành động ở Nhật ký hoạt động** (32 dòng activity_log mới cho 8/13 entity BI/PI, `ApprovalHistory` thêm vào 2 detail page, sửa filter "Loại" chết thành "Hành động" hoạt động thật ở màn Activity), sau **Giai đoạn 43 — vá lỗ hổng "Lịch sử duyệt" trống trơn trên toàn Pipeline** (61 dòng activity_log mới cho 22/28 entity Pattern/Template/Config/Variant, sửa bug status TPL-003 lệch version_entry, viết lại created_user/updated_user khớp chuỗi mới), sau **Giai đoạn 42 — Nhật ký hoạt động theo audit thật + Menu theo Role người dùng** (bảng `app_user` mới, populate `created_user`/`updated_user` từ activity_log thật, sidebar lọc menu theo role qua `UserContext`, khối "Lịch sử duyệt" ở Config/Pattern/Template detail — role-switch là demo, không phải đăng nhập thật), **Giai đoạn 41 — sample data "Vay xe máy mùa tựu trường"** (sản phẩm đầy đủ đã duyệt, tái dùng khuôn PT-001/TPL-001), **Giai đoạn 40 — sửa lệch lifecycle Config↔Variant + thêm cột audit/CDC/governance vào 43 bảng**, làm thật nút "Xem trước" ở builder Product Pattern (Giai đoạn 39), hoàn thiện thanh tìm kiếm toàn cục ở topbar (Giai đoạn 38), chia detail Product Variant thành 3 tab con (Giai đoạn 37), thêm detail đầy đủ cho Product Variant (Giai đoạn 36), detail cho Block & Answer Slot (Giai đoạn 35), detail cho Lifecycle & State và Domain (Giai đoạn 34), bổ sung seed `activity_log` (Giai đoạn 33), liên kết Catalog ↔ Quy trình phát hành theo trạng thái sản phẩm thật (Giai đoạn 32), gộp cấu trúc thư mục pages theo feature (Giai đoạn 31) và màn "Attribute Usage" + popup Group/Data Type (Giai đoạn 29-30). Việc kế tiếp: đợt polish cuối (mục 5.3 — loading/error states, Docker hoàn thiện), chưa có yêu cầu mới nào khác từ user.

---

## 6. VIỆC CẦN LÀM TIẾP (thứ tự — xem thêm NEXT_WORK.md)

> **THỨ TỰ MỚI (user chốt): THƯ VIỆN NỀN TẢNG trước, PIPELINE SẢN PHẨM sau.** Vì màn Pipeline đọc dữ liệu từ thư viện nền tảng — dựng nền tảng trước thì Pipeline join API thật, không fix cứng. Builder Pattern hiện tại giữ nguyên; khi backend nền tảng xong thì wire nó chỉ còn đổi nguồn data.

### A0. Thư viện nền tảng (LÀM ĐẦU, thứ tự):
1. ✅ **block** — Block & Answer Slot (+ `data_type`), package `structure`. **XONG (Giai đoạn 6):** backend `Block`/`AnswerSlot`(+Id)/`DataType` + `/api/blocks` (list làm giàu slotCount/gov + `/{id}/detail` join slots) + `/api/data-types`; frontend `BlockPage` list pixel-perfect. `/{id}/detail` đã sẵn nguồn để gỡ fix cứng builder ở A0.7.
2. ✅ **matrix** — constraint_matrix + matrix_cell, package `governance`. **XONG (Giai đoạn 7):** `ConstraintMatrix`/`MatrixCell`(+Id) + `/api/constraint-matrices` (list + `/{id}/detail` grid join nhãn + `/pattern-coverage` phái sinh); frontend `MatrixPage` 4-tab pixel-perfect. Logic coverage đã sẵn ở BE để dùng lại ở A0.7.
3. ✅ **attribute** — list 3-tab (Attribute/Attribute Group/Data Type), package `attribute` (`Domain`/`AttributeGroup`/`AttributeConstraint` mới). **XONG (Giai đoạn 8).** Màn detail "Attribute Usage" (lineage) — **XONG (Giai đoạn 29)**, xem mục A2 dưới.
4. ✅ **obligation** — list 3-tab (Obligation Type/Obligation Element/Element Type), backend `ontology` 3 controller chuyển sang join làm giàu. **XONG (Giai đoạn 9).**
   ✅ **archetype** — card grid + trang detail riêng (route `/archetype/:code`), backend `FinancialObligationArchetypeController` join làm giàu (typeCount/elementCount/productCount). **XONG (Giai đoạn 10).**
5. ✅ **domain** + **lifecycle** — list đơn giản, backend `DomainController` (read-only thuần) + `LifecycleController` (join stateCount). **XONG (Giai đoạn 11).**
6. ✅ **ontology** + **sysmap** — màn biểu đồ, không backend mới (tổng hợp client-side). **XONG (Giai đoạn 12) — HOÀN TẤT NHÓM NỀN TẢNG.**
7. ✅ **Wire builder Pattern về DB** (mục A bên dưới) — **XONG (Giai đoạn 13).** `patternBuilderData.ts` đã xóa; `ProductPatternController#/{code}/detail` join thật block/answer_slot/attribute/data_type/constraint_matrix.

Sau nền tảng → **Pipeline**: template → config → variant → catalog (đều DB-driven). ⬅ ĐANG TỚI (bắt đầu từ Template). Rồi Lớp IV (release, activity) → simulation → polish.

### A. Wire builder Pattern về DB thật — ✅ XONG (Giai đoạn 13, xem mục 4 phía trên)
Thay `patternBuilderData.ts` (tĩnh) bằng dữ liệu THẬT từ DB. **Toàn bộ đều có nguồn** (đã đối chiếu seed):
- **`block`** (Lớp II): `id` PK, `code` UNIQUE, `name`, `biz_group` (enum: Khởi tạo/Giá trị/Kích hoạt/Vận hành/Thu hồi), `governed_by_element_code` (null), `governed_by_aspect` (null), `status`. → "Nhóm nghiệp vụ" = `biz_group`; "gov" = `governed_by_element_code ?? governed_by_aspect`.
- **`answer_slot`** (Lớp II, PK ghép `[block_id, code]`): `name`, `attribute_code`, `is_required`, `default_value`, `rule_text`. → def=`default_value`, rule=`rule_text`, req=`is_required`.
- **`attribute`** (đã có entity): `code` PK, `name`, `data_type_code`, `default_value`, `unit`… → "ĐỊNH NGHĨA BỞI ATTRIBUTE" = `attribute.name · code`; "type" của slot = `data_type.name` (join `attribute.data_type_code → data_type.code`).
- **`data_type`** (Lớp II): `code` PK, `name` (Money/Percent/Integer/Enum/Range/Boolean/Formula/Reference/Text). Cần entity mới `DataType`.
- **`constraint_matrix`** + **`matrix_cell`** (Lớp IV): ma trận OT×Block = `constraint_matrix.kind = 'OBLIGATIONTYPE_X_BLOCK'` (seed id=3), cell `matrix_cell(row_code=OT_code, col_code=block_id, verdict: req|pos|na)`. Verdict `na` → bỏ dòng; logic độ phủ giữ nguyên như prototype (đã tái tạo trong `ProductPatternDetailPage`).
- **archetype của OT:** `obligation_type.archetype_code → financial_obligation_archetype.name` (vd FOA_TERM_LOAN → "Term Loan").

**Cách làm đề xuất (gọn cho builder):** tạo entity/repo Lớp II & IV cần thiết:
- package `structure`: `Block`(+repo), `AnswerSlot`(+`AnswerSlotId` composite, `findByBlockId`), `DataType`(+repo). *(Các bảng này cũng là màn thư viện tương lai: `block`, `attribute`.)*
- package `governance`: `ConstraintMatrix`(+repo `findFirstByKind`), `MatrixCell`(+`MatrixCellId`, `findByMatrixId`). *(Cũng là màn "Ma trận ràng buộc".)*
- **Mở rộng `ProductPatternController#/{code}/detail`** để join thêm: mỗi block → `{blockId,position,usage,name,bizGroup,gov,slots:[{name,code,type,required,def,rule,attrName,attrCode}]}`; `assignedOTs` thêm `archetype`; thêm `coverage:[{blockId,label,verdict,inCanvas,...}]` hoặc trả raw matrix cells để FE tự tính (FE đã có logic). Rồi **xóa nội dung tĩnh trong `patternBuilderData.ts`** (chỉ giữ COVER_COLS label nếu cần, hoặc bỏ hẳn).
- Verify lại render builder với API thật (mock JSON = query DB), so khớp.

### A2. ✅ XONG (Giai đoạn 29) — Attribute Usage screen
Prototype có màn chi tiết "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant, Selector Scope values theo People/Place/Time, bảng where-used với số Template/Config/Variant). Đã dựng đủ dữ liệu thật từ `product_template`/`product_config`/`product_variant`/`fragment`/`selector_scope` (Pipeline layer đã có backend từ Giai đoạn 14-21). Route `/attribute/:code`, backend `AttributeUsageService`/`AttributeUsageController`. Modal tạo/sửa Attribute KHÔNG làm — nút CUD toàn dự án giữ quy ước no-op (mục 7), không có ngoại lệ riêng cho Attribute.

### B. ✅ XONG (Giai đoạn 20) — Business Intent detail + KPI
Backend `BusinessIntentKpi`(+`BusinessIntentKpiId` composite) + `findByBusinessIntentIdOrderBySortOrder` + `BusinessIntentController#/{id}/detail` `{intent, kpis}` (thêm cạnh 2 endpoint sẵn có từ `ReadOnlyController`, không cần bỏ extends). Frontend `BusinessIntentDetailPage` (mẫu `ProductIntentDetailPage`) + route `/businessintent/:id` (trước `/:view`) + `BusinessIntentPage` thêm `onRowClick`. Prototype KHÔNG có markup detail cho màn này (row click gốc chỉ mở modal tạo-mới chung) — dựng mới hoàn toàn theo quyết định nợ đã chốt, dữ liệu thật 100%. Verified: BI-01 hiện đúng 3 KPI seed (Dư nợ giải ngân mới/Số hợp đồng/NPL).

### C. ✅ XONG (Giai đoạn 20) — ListScreen interactive
`components/ListScreen.tsx` tự lọc search + filter dropdown THẬT, client-side, **không đổi signature `rows: ReactNode[][]`, không sửa bất kỳ page nào khác** (phương án thay thế cho việc đổi `rows` sang `{cells,raw,onClick}` từng cân nhắc — tránh sửa lại toàn bộ ~20 page). `extractText(node)` đệ quy trích text từ cell đã dựng (ưu tiên `props.children`; component tùy biến không có children — như `StatusChip`, chip label riêng — fallback đọc `props.status` (dịch qua `STATUS_LABELS` export từ `StatusChip.tsx`) hoặc `props.label`/`props.text`). `guessColumnIndex()` đoán cột ứng với mỗi tên filter bằng so khớp label (không cần khai báo gì thêm ở từng page); dropdown liệt kê giá trị phân biệt thật của đúng cột đó, chọn nhiều, nút "Xóa lọc". Verified trên `BlockPage`: search "lãi" đúng còn 1/4 dòng; filter "Trạng thái"→"Nháp" đúng còn 1/4 dòng.

### D. Pipeline sản phẩm (đang làm, đều DB-driven)
- ✅ **template** — XONG (Giai đoạn 14, list + detail `/template/:code`). Backend package `pipeline`: `ProductTemplate`/`CustomerSegment`/`TemplateSegment`/`TemplateFrame` + `ProductTemplateController`.
- ✅ **config** — XONG (Giai đoạn 15, list + detail `/config/:code`). Backend package `pipeline`: `ProductConfig`/`SelectorScope`/`Fragment` + `ProductConfigController` (detail gom fragment theo Answer Slot, sắp theo `selector_scope.priority`).
- ✅ **variant** — XONG (Giai đoạn 16, list only — xác nhận `isList`, không có wizard/detail thật). Backend package `pipeline`: `ProductVariant`/`ProductCatalog`/`CatalogListing` + `ProductVariantController` (cột Kênh suy ra thật qua `catalog_listing`).
- ✅ **catalog** — XONG (Giai đoạn 17, card grid — xác nhận `isCatalog`, không phải `isList`/wizard). Backend `ProductCatalogController` join `product_variant`+`catalog_listing`→`product_catalog.channel` (không cần entity mới, tái dùng từ Giai đoạn 16). **NHÓM PIPELINE SẢN PHẨM ĐÃ HOÀN TẤT.**

### E. Lớp IV + Simulation + hoàn thiện
- ✅ **release** — XONG (Giai đoạn 18, stepper 8 bước + swimlane — xác nhận `isRelease`, không phải list). Backend package mới `release`: `MakerCheckerProcess`/`ProcessStep`/`ProcessStepChecklist` + `ReleaseProcessController` (checklist/step_status thật từ DB, `desc`/`tip`/`icon` giữ hằng số UI tĩnh vì không có cột DB nguồn nhưng là copy quy trình chuẩn không đổi theo instance).
- ✅ **activity** — XONG (Giai đoạn 18, list). Backend package mới `activity`: `ActivityLog` + `ActivityLogController` (cột Kênh suy ra thật bằng regex trên `detail`, bỏ số bịa "1.284" dùng COUNT thật).
- ✅ **simulation** — XONG (Giai đoạn 19, form + annuity engine thật, phần 10% CÓ TÍNH TOÁN). Backend package mới `simulation`: `SimulationScenario`/`SimulationScheduleRow` (đọc kịch bản mẫu thật) + `SimulationEngine` (thuần Java, cổng công thức annuity/ân hạn/trả bớt gốc/tất toán sớm/phạt trễ hạn của bundler) + `SimulationController` (`GET /default` thật + `POST /run` tính, KHÔNG ghi DB — nút "Chạy mô phỏng" là nút DUY NHẤT trong dự án gọi tính toán thật, không no-op). **TOÀN BỘ 18 MÀN + SIMULATION ENGINE ĐÃ HOÀN TẤT.**

Tổng 18 màn + Simulation Engine. **Đã xong: dashboard, businessintent(list), intent(list+detail), pattern(builder, đã WIRE về DB thật — Giai đoạn 13), block(list + backend structure), matrix(4-tab grid + backend governance), attribute(list 3-tab + backend Domain/AttributeGroup/AttributeConstraint), obligation(list 3-tab, join làm giàu ontology có sẵn), archetype(card grid + detail), domain(list), lifecycle(list, join stateCount), ontology(ER-chain+decomposition+vocab), sysmap(pipeline+foundations+relations), template(list + detail /template/:code, backend pipeline.ProductTemplate/CustomerSegment/TemplateSegment/TemplateFrame), config(builder Fragment+Resolution pixel-perfect /config/:code, backend pipeline.ProductConfig/SelectorScope/Fragment — VIẾT LẠI Giai đoạn 21), variant(list, backend pipeline.ProductVariant/ProductCatalog/CatalogListing), catalog(card grid, backend pipeline.ProductCatalogController), release(stepper+swimlane, backend release.MakerCheckerProcess/ProcessStep/ProcessStepChecklist), activity(list, backend activity.ActivityLog), simulation(form + annuity engine thật, backend simulation.SimulationEngine, POST /api/simulation/run). TẤT CẢ ĐÃ HOÀN TẤT — chỉ còn đợt polish cuối (mục 5).**

---

## 7. QUY ƯỚC CODE QUAN TRỌNG

**Backend:**
- Entity read-only: chỉ getter, `@Entity @Table`. Composite PK: `@IdClass` + Serializable.
- Read-only thuần: extends `ReadOnlyController<Entity,IdType>`. **Cần join làm giàu list → tự viết controller** (không extends), trả `Page<Map>`.
- Resource path kebab số nhiều: `/api/product-patterns`. Lấy tên cột từ DDL/canonical, không đoán.
- **Enum PG (entity_status_enum, block_usage_enum, ot_role_enum, biz_group_enum…) map bằng `@Column String`** (theo tiền lệ BusinessIntent.status). Không dùng `@Enumerated`.
- Cột trùng từ khóa SQL (`usage`, `position`, `role`) vẫn `@Column(name="usage")` — hiện chạy OK; nếu lỗi runtime thì quote.

**Frontend:**
- Màn list MỚI: dùng `ListScreen` (signature THẬT: `rows: ReactNode[][]`). Status: `<StatusChip>`. Icon: `<Icon>` (35 icon, không có lock/history/grid).
- Mã code mono: `fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:'#5E6F66', fontWeight:600`.
- Detail thường: header gradient `linear-gradient(120deg,#0B7349,#0E8C5A)`, back icon, mã mono, StatusChip, info card `border:1px solid #E6ECE8, borderRadius:12`.
- **Màn "builder/phức tạp" (như Pattern): KHÔNG rút gọn thành detail thường** — trích markup builder gốc, dựng 3 cột. Root `height:100%` để fill khung Layout (content area đã `flex:1; overflowY:auto`).
- Đăng ký màn: thêm CUSTOM đúng nav key; route detail đặt TRƯỚC `/:view`.
- Nút CUD: giữ giao diện, no-op, tooltip read-only.

**Bảng màu chuẩn:** xanh chủ đạo `#0E8C5A`, đậm `#0B7349`, sidebar `#0B3B2E→#082A20`. Chữ chính `#122019`, phụ `#5E6F66`/`#8A998F`, viền `#E6ECE8`, nền `#F4F7F5`, card `#fff`. Header cell uppercase `#8A998F` 11px/700. Font `Be Vietnam Pro`.

**Quy trình bắt buộc mỗi màn:** code → `cd frontend && npm run build` (0 lỗi TS) → render Playwright → view PNG so khớp → đóng zip trọn vẹn.

---

## 8. GHI CHÚ KỸ THUẬT (tránh lặp lỗi)

1. **Seed + Flyway:** `V2__seed.sql` bỏ `BEGIN;`/`COMMIT;`. Giữ khối `ALTER TABLE` vá FK ngược `obligation_family ↔ obligation_element` ở đầu seed.
2. **Sandbox KHÔNG build được backend Spring** (Maven Central chặn 403). Không `mvn compile` được. Chỉ verify: cấu trúc file, cân bằng ngoặc `{}`/`()`, import, và render frontend. Backend build thật trên máy user qua Docker. → Viết Java phải cẩn thận cú pháp.
3. **Frontend build ĐƯỢC verify:** `npm install` (zip không kèm node_modules) rồi `npm run build`. LUÔN chạy trước khi giao.
4. **Render pixel-perfect (Playwright chromium):** serve `dist` bằng HTTP server có **SPA fallback** (path lạ → index.html), directory trỏ **dist tuyệt đối**. Mock API bằng `page.route('**/api/...')` trả JSON = seed thật. Server + screenshot trong CÙNG process Python (thread daemon). *Mẹo: nếu viewer ảnh không hiện, kiểm tra bằng mẫu pixel (PIL getpixel) để chắc không phải trang trắng + đúng màu vùng.*
5. **Prototype markup + data:** trích từ `Product_Factory_5_1.html`. Markup builder dùng template `{{ }}`. Cách trích: đọc file, tìm mốc (`openBuilder`, `BLOCKS(){`, `OTS(){`, `builderData(){`, `blockCoverage(){`, tên view…), unescape thủ công: `.replace('\\u002F','/').replace('\\/','/').replace('\\"','"').replace("\\'","'").replace('\\n','\n')`. **KHÔNG dùng `unicode_escape`** (lỗi lone backslash).
6. **✅ Builder Pattern hết fix cứng (Giai đoạn 13):** `frontend/src/patternBuilderData.ts` đã XÓA. `ProductPatternController#/{code}/detail` giờ join thật `block`/`answer_slot`/`attribute`+`data_type`/`constraint_matrix`+`matrix_cell`. Builder phản ánh đúng DB theo thời gian thực, không còn copy verbatim từ prototype.
7. **nav key ≠ resource path:** intent→`/api/product-intents`; businessintent→`/api/business-intents`; pattern→`/api/product-patterns`. Luôn kiểm `nav.ts` lấy đúng key khi wire route/CUSTOM.
8. **Máy user Windows/PowerShell:** đường dẫn có dấu cách để trong ngoặc kép. `docker-compose.yml` nằm trong thư mục `product-factory` (con) — user hay lỗi "no configuration file provided" do đứng sai thư mục / giải nén lồng thư mục.
9. **Package `attribute`** (Lớp II) hiện ở `com.f88.productfactory.attribute`. Khi thêm block/answer_slot/data_type → package `structure`; matrix → `governance` (mục 6.A).
10. **Docker chạy:** `docker compose up --build` (lần đầu 5-10p tải deps). FE :5173, BE :8080, db :5432. OK khi log `Started ProductFactoryApplication`.

---

*Cập nhật lần cuối: sau khi hoàn thành **Business Intent detail+KPI + ListScreen interactive** (Giai đoạn 20, mục 5.1+5.2). BI detail: `BusinessIntentKpi`(+Id) mới + `/business-intents/{id}/detail`, frontend `BusinessIntentDetailPage` (route `/businessintent/:id` — không có markup gốc trong prototype, dựng mới theo mẫu `ProductIntentDetailPage`, KPI 100% thật). ListScreen interactive: `extractText()` đệ quy trích text từ cell React (fallback đọc `status`/`label` cho component tùy biến như `StatusChip`) để search+filter chạy client-side **không cần sửa bất kỳ page nào khác** — áp dụng ngay cho toàn bộ ~20 màn list. Verified Playwright cả 2 (BI-01 đúng 3 KPI seed; BlockPage search+filter lọc đúng). Việc kế tiếp theo NEXT_WORK: mục 5.3 (loading/error states, Docker hoàn thiện) — mục 5.4 (Attribute Usage) vẫn hoãn.*

*Ghi chú lịch sử: sau khi hoàn thành **Simulation Engine** (Giai đoạn 19, mục 3C) — **TOÀN BỘ 18 MÀN + PHẦN 10% TÍNH TOÁN CHÍNH THỨC HOÀN TẤT.** Backend package mới `simulation` (`SimulationScenario`/`SimulationScheduleRow` đọc kịch bản mẫu thật + `SimulationEngine` thuần Java cổng lại công thức annuity/ân hạn/trả bớt gốc/tất toán sớm/phạt trễ hạn của bundler). `POST /api/simulation/run` — nút DUY NHẤT trong dự án gọi tính toán thật (không no-op), không ghi DB. Verified Playwright khớp chính xác PMT/tổng lãi/tổng phải trả/LTV/18 dòng lịch trả nợ với seed thật (bắt và sửa 1 lỗi: tổng phải trả ban đầu thiếu phí thẩm định 1 lần). Việc kế tiếp theo NEXT_WORK: **đợt polish cuối** (mục 5 — Business Intent detail+KPI, ListScreen interactive, loading/error, Docker, Attribute Usage đã hoãn).*

*Ghi chú lịch sử: sau khi hoàn thành **Release + Activity Log** (Giai đoạn 18, mục 3B). `release` là stepper 8 bước + swimlane (không phải list) — backend package mới `release` đọc thật `maker_checker_process`/`process_step`/`process_step_checklist` (khớp seed y hệt bundler hardcode). `activity` là list đơn giản — backend package mới `activity`, cột KÊNH suy ra thật bằng regex trên `detail` (hậu tố "· kênh X"), bỏ số bịa "1.284" dùng COUNT thật (8). Verified Playwright (stepper 4/8 done + bước 5 current, swimlane 5 lane × 8 cột, activity list 8/8 dòng đều khớp seed).*

*Ghi chú lịch sử: sau khi hoàn thành **Product Catalog** (Giai đoạn 17, mục 3.4) — **HOÀN TẤT TOÀN BỘ NHÓM PIPELINE SẢN PHẨM** (Template→Config→Variant→Catalog). `catalog` là card grid riêng (`isCatalog`, không phải `isList`/wizard), không cần entity mới (tái dùng `ProductCatalog`/`CatalogListing` đã dựng ở Variant). `ProductCatalogController` join `product_variant`+`catalog_listing`→`product_catalog.channel`, chỉ hiện variant đã niêm yết ít nhất 1 catalog (khớp đúng 6/7 card như prototype). Verified Playwright khớp verbatim 6 card thật.*

*Ghi chú lịch sử: sau khi hoàn thành **Product Variant** (Giai đoạn 16, mục 3.3) — màn LIST (xác nhận qua bundler JS: `variant` nằm trong `isList`, click dòng chỉ mở drawer tạo-mới chung, không phải detail thật). Phát hiện đáng chú ý: cột "Kênh" của prototype KHÔNG cần bỏ — suy ra được thật từ `catalog_listing.variant_code → product_catalog.channel`. Backend 4 entity mới package `pipeline` (`ProductVariant`, `ProductCatalog`, `CatalogListing`+Id).*

*Ghi chú lịch sử: sau khi hoàn thành **Product Config** (Giai đoạn 15, mục 3.2) — cả list VÀ detail (`/config/:code`). Cùng bài học Template: wizard "configForm" gốc của prototype dùng dữ liệu tĩnh (`configBase()`, không đổi theo dòng click) → dựng `/{code}/detail` là màn XEM fragment thật của từng config, gom theo Answer Slot, sắp theo `selector_scope.priority` (default→time→place→people). Backend 3 entity mới package `pipeline` (`SelectorScope`, `ProductConfig`, `Fragment`).*

*Ghi chú lịch sử: sau khi hoàn thành **Product Template** (Giai đoạn 14, mục 3.1) — cả list VÀ detail (`/template/:code`). Khảo sát prototype xác nhận wizard "Tạo Product Template" 3 bước là dữ liệu TĨNH 100% (`TPL_BLOCKS` catalog cứng, `state.tpl` khởi tạo cứng, không đổi theo dòng click) → dựng `/{code}/detail` là màn XEM 1 template thật, tái dùng layout 3 bước, suy ra "Block đang áp dụng" từ có/không có dòng `template_frame` (không có cột "khóa" thật trong DB — quyết định qua AskUserQuestion). Backend 4 entity mới package `pipeline` (`CustomerSegment`, `ProductTemplate`, `TemplateSegment`, `TemplateFrame`).*

*Ghi chú lịch sử: sau khi hoàn thành **WIRE builder Product Pattern về DB thật** (Giai đoạn 13, mục 2.7): `ProductPatternController#/{code}/detail` mở rộng join `block`/`answer_slot`/`attribute`/`data_type`/`constraint_matrix`/`matrix_cell` — `frontend/src/patternBuilderData.ts` đã xóa hoàn toàn, không còn nơi nào dùng dữ liệu tĩnh. Verified bằng Playwright (mock đúng shape API mới từ seed thật PT-001).*

*Ghi chú lịch sử: sau khi hoàn thành **Ontology + Sysmap** (Giai đoạn 12, mục 2.6 — HOÀN TẤT NHÓM NỀN TẢNG): 2 màn dạng biểu đồ (card/flex/grid, không SVG/canvas), không cần backend mới — tổng hợp client-side từ API đã có (obligation-types/families/compositions/elements/element-types cho Ontology; cấu trúc tĩnh + điều hướng cho Sysmap), verified.*

*Ghi chú lịch sử: sau khi hoàn thành **Domain + Lifecycle & State** (Giai đoạn 11, mục 2.5): backend `DomainController` (read-only thuần) + `LifecycleController` (join stateCount qua lifecycle_state) + frontend `DomainPage`/`LifecyclePage` (list đơn giản, không tab/detail — đúng prototype), verified.*

*Ghi chú lịch sử: sau khi hoàn thành **Financial Obligation Archetype** (Giai đoạn 10, phần 2 mục 2.4 — hoàn tất mục 2.4): backend `FinancialObligationArchetypeController` (join làm giàu typeCount/elementCount/productCount qua obligation_type/foa_element/pattern_obligation_type) + frontend `ArchetypePage` (card grid) + `ArchetypeDetailPage` (route `/archetype/:code`), verified.*

*Ghi chú lịch sử: sau khi hoàn thành **Obligation Library** (Giai đoạn 9, phần 1 mục 2.4): backend package `ontology` (ObligationTypeController/ObligationElementController/ObligationElementTypeController chuyển sang tự viết join làm giàu: familyName/archetypeName/elementCount/elementTypeName/isIdentify) + frontend ObligationPage 3-tab pixel-perfect, verified.*

*Ghi chú lịch sử — sau khi hoàn thành **Attribute** (Giai đoạn 8, CHỈ MÀN LIST): backend package `attribute` (Domain/AttributeGroup/AttributeConstraint mới; AttributeController/AttributeGroupController + structure/DataTypeController tự viết join làm giàu) + frontend AttributePage 3-tab (Attribute/Attribute Group/Data Type) pixel-perfect, verified. Màn "Attribute Usage" (lineage) + modal tạo/sửa hoãn (mục 6.A2 — chờ Pipeline + fragment/selector_scope).*

*Ghi chú lịch sử — sau khi hoàn thành **Ma trận ràng buộc** (Giai đoạn 7): backend package `governance` (ConstraintMatrix/MatrixCell + `/api/constraint-matrices` grid join nhãn + `/pattern-coverage` phái sinh) + frontend MatrixPage 4-tab pixel-perfect, verified. Zip mới nhất: `product-factory-phase7-matrix.zip`.*

*Ghi chú lịch sử — Block & Answer Slot (Giai đoạn 6): backend package `structure` (Block/AnswerSlot/DataType) + frontend BlockPage list pixel-perfect.

*Ghi chú lịch sử — sau khi hoàn thành **Product Pattern builder** (Giai đoạn 5) + audit nguồn data. Đính chính: BusinessIntent detail/KPI CHƯA làm (nợ). **ĐỔI THỨ TỰ (user chốt): Thư viện nền tảng trước — bắt đầu Block & Answer Slot (+ data_type), rồi matrix/attribute/obligation/archetype/domain/lifecycle/ontology/sysmap → wire builder Pattern về DB → rồi Pipeline (template…), đều DB-driven.** Business Intent detail+KPI và ListScreen interactive để đợt polish cuối. Zip mới nhất: `product-factory-phase5-pattern-builder.zip`.*
