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

## 5. ĐANG LÀM DỞ

Không có màn nào đang dở giữa chừng. Vừa hoàn thành audit toàn dự án + sửa dữ liệu fix cứng (Giai đoạn 26: Dashboard viết lại hoàn toàn, sidebar count lấy thật, Simulation Engine wire trần quy định từ `attribute_constraint`). Việc kế tiếp: đợt polish cuối (mục 5.3 — loading/error states, Docker hoàn thiện) — mục 5.4 (Attribute Usage) vẫn hoãn theo quyết định gốc.

---

## 6. VIỆC CẦN LÀM TIẾP (thứ tự — xem thêm NEXT_WORK.md)

> **THỨ TỰ MỚI (user chốt): THƯ VIỆN NỀN TẢNG trước, PIPELINE SẢN PHẨM sau.** Vì màn Pipeline đọc dữ liệu từ thư viện nền tảng — dựng nền tảng trước thì Pipeline join API thật, không fix cứng. Builder Pattern hiện tại giữ nguyên; khi backend nền tảng xong thì wire nó chỉ còn đổi nguồn data.

### A0. Thư viện nền tảng (LÀM ĐẦU, thứ tự):
1. ✅ **block** — Block & Answer Slot (+ `data_type`), package `structure`. **XONG (Giai đoạn 6):** backend `Block`/`AnswerSlot`(+Id)/`DataType` + `/api/blocks` (list làm giàu slotCount/gov + `/{id}/detail` join slots) + `/api/data-types`; frontend `BlockPage` list pixel-perfect. `/{id}/detail` đã sẵn nguồn để gỡ fix cứng builder ở A0.7.
2. ✅ **matrix** — constraint_matrix + matrix_cell, package `governance`. **XONG (Giai đoạn 7):** `ConstraintMatrix`/`MatrixCell`(+Id) + `/api/constraint-matrices` (list + `/{id}/detail` grid join nhãn + `/pattern-coverage` phái sinh); frontend `MatrixPage` 4-tab pixel-perfect. Logic coverage đã sẵn ở BE để dùng lại ở A0.7.
3. ✅ **attribute** — list 3-tab (Attribute/Attribute Group/Data Type), package `attribute` (`Domain`/`AttributeGroup`/`AttributeConstraint` mới). **XONG (Giai đoạn 8) — CHỈ MÀN LIST.** Màn "Attribute Usage" (detail/lineage) + modal tạo/sửa ghi nợ ở mục B dưới, hoãn tới khi Pipeline + fragment/selector_scope có backend.
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

### A2. NỢ — Attribute Usage screen + Create/Edit modal (hoãn tới khi có Pipeline + fragment/selector_scope)
Prototype có màn chi tiết "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant, Selector Scope values theo People/Place/Time, bảng where-used với số Template/Config/Variant) + modal tạo/sửa Attribute (form đổi field theo Data Type: Money/Percent/Integer/Range/Enum/Text/Boolean/Date/Formula). Cả hai cần dữ liệu từ `product_template`/`product_config`/`product_variant`/`fragment`/`selector_scope` — chưa có backend. Làm sau khi Pipeline sản phẩm (mục D) + `fragment`/`selector_scope` (Lớp II) có backend, để tránh fix cứng như từng xảy ra với Pattern builder (mục 6.A cũ).

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
