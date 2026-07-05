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

**Backend** — 3 entity mới package `pipeline` (Lớp III):
- `CustomerSegment` (PK `code`): `name`, `audience`, `tier` (nullable), `legalRequirement` (nullable). + `CustomerSegmentRepository`.
- `ProductTemplate` (PK `code`): `name`, `fromPatternCode`, `status`. + `ProductTemplateRepository`.
- `TemplateSegment` (+`TemplateSegmentId` composite `[template_code, segment_code]`): junction Template×Segment. + `TemplateSegmentRepository.findByTemplateCode`.
- `ProductTemplateController` (`/api/product-templates`, tự viết `Page<Map>` vì cần join, không extends `ReadOnlyController`): `GET /` trả `{code,name,fromPatternCode,patternName,segmentCode,segmentName,status}` — `patternName` join `product_pattern.name`, `segmentCode`/`segmentName` join qua `template_segment`→`customer_segment` (lấy dòng đầu, seed mỗi template chỉ có 1 segment). Cột "CẬP NHẬT" của prototype **bỏ** — `product_template` không có cột `updated_at`/tương đương (quy tắc vàng, đúng tiền lệ Pattern/Block/Attribute).
- Chưa tạo `TemplateFrame` entity (bảng `template_frame`) — không cần cho màn list; để dành cho lúc cần (Config hoặc nếu sau này dựng lại Template Usage).

**Frontend** — `pages/ProductTemplatePage.tsx` (mẫu y hệt `DomainPage`/`ObligationPage` list đơn, không tab): 5 cột Mã(mono)/Tên Template(bold)/Pattern nguồn(dim)/Đối tượng KH/`StatusChip`; `filters={['Pattern nguồn','Đối tượng']}` (đúng prototype); `actionLabel="Tạo Template"`; không `onRowClick` (tránh dẫn tới màn wizard không dựng). `main.tsx`: thêm `template: <ProductTemplatePage />` vào `CUSTOM` (nav key `template` đã có sẵn trong `nav.ts` từ trước, chỉ thiếu component).

Build 0 lỗi TS. Render Playwright (mock `/api/product-templates` từ 6 dòng seed thật TPL-001..006, join tên pattern qua `from_pattern_code`): đủ 6 dòng, đúng 5 cột, không có cột "Cập nhật" giả, filter chip + nút "Tạo Template" hiện đúng vị trí prototype. OK.

---

## 5. ĐANG LÀM DỞ

Không có màn nào đang dở giữa chừng. Vừa hoàn thành **Product Template** (Giai đoạn 14, mục 3.1) — màn đầu tiên của Pipeline sản phẩm. Việc kế tiếp theo NEXT_WORK mục 3.2 = **Product Config**.

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

### B. NỢ — Business Intent detail + KPI (làm ở đợt polish, KHÔNG xen giữa)
Backend `BusinessIntentKpi`(+`Id` composite, `findByBusinessIntentIdOrderBySortOrder`) + `/business-intents/{id}/detail` `{intent, kpis}`. Frontend `BusinessIntentDetailPage` + route `/businessintent/:id` + wire `onRowClick`. Seed: BI id=1 có 3 KPI, id=6 có 1 KPI.

### C. NỢ — ListScreen interactive (đợt polish)
Wire search (lọc text) + filter dropdown thật; áp lại cho mọi màn list. (Tùy chọn đổi `rows` sang `{cells, raw, onClick}` — nếu đổi phải cập nhật tất cả page dùng ListScreen.)

### D. Pipeline sản phẩm (đang làm, đều DB-driven)
- ✅ **template** — XONG (Giai đoạn 14). Xác nhận qua prototype: **KHÔNG phải builder** (`openTplWizard` là wizard tạo-mới chung, không phải detail của dòng click) → chỉ dựng LIST. Backend package `pipeline`: `ProductTemplate`/`CustomerSegment`/`TemplateSegment`(+Id) + `ProductTemplateController` join tên Pattern nguồn + Đối tượng KH.
- **config** (`product_config`+fragment) ← ĐANG TỚI → **variant** (`product_variant`) → **catalog** (`product_catalog`+catalog_listing). Trích markup từng màn trước khi code (kiểm `openBuilder` để chắc không phải builder). Join hết vào block/attribute/pattern/template thật.

### E. Lớp IV + Simulation + hoàn thiện
Release, activity → **Simulation** (gần cuối — annuity, `/api/simulation/run`) → loading/error states, Docker cuối.

Tổng 18 màn. **Đã xong: dashboard, businessintent(list), intent(list+detail), pattern(builder, đã WIRE về DB thật — Giai đoạn 13), block(list + backend structure), matrix(4-tab grid + backend governance), attribute(list 3-tab + backend Domain/AttributeGroup/AttributeConstraint), obligation(list 3-tab, join làm giàu ontology có sẵn), archetype(card grid + detail), domain(list), lifecycle(list, join stateCount), ontology(ER-chain+decomposition+vocab), sysmap(pipeline+foundations+relations), template(list, backend pipeline.ProductTemplate/CustomerSegment/TemplateSegment). Nhóm thư viện nền tảng ĐÃ HOÀN TẤT, builder Pattern ĐÃ HẾT FIX CỨNG, Pipeline sản phẩm ĐÃ BẮT ĐẦU (Template xong).**

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

*Cập nhật lần cuối: sau khi hoàn thành **Product Template** (Giai đoạn 14, mục 3.1) — màn đầu tiên của Pipeline sản phẩm. Khảo sát prototype xác nhận `template` là LIST đơn thuần (không phải builder — `openTplWizard` là wizard TẠO MỚI chung, không gắn với dòng được click), nên chỉ dựng list, không dựng wizard. Backend 3 entity mới (`CustomerSegment`, `ProductTemplate`, `TemplateSegment`) package `pipeline`; `ProductTemplateController` join tên Pattern nguồn + Đối tượng KH. Verified bằng Playwright (6 dòng seed thật TPL-001..006). Việc kế tiếp theo NEXT_WORK mục 3.2 = **Product Config**.*

*Ghi chú lịch sử: sau khi hoàn thành **WIRE builder Product Pattern về DB thật** (Giai đoạn 13, mục 2.7): `ProductPatternController#/{code}/detail` mở rộng join `block`/`answer_slot`/`attribute`/`data_type`/`constraint_matrix`/`matrix_cell` — `frontend/src/patternBuilderData.ts` đã xóa hoàn toàn, không còn nơi nào dùng dữ liệu tĩnh. Verified bằng Playwright (mock đúng shape API mới từ seed thật PT-001).*

*Ghi chú lịch sử: sau khi hoàn thành **Ontology + Sysmap** (Giai đoạn 12, mục 2.6 — HOÀN TẤT NHÓM NỀN TẢNG): 2 màn dạng biểu đồ (card/flex/grid, không SVG/canvas), không cần backend mới — tổng hợp client-side từ API đã có (obligation-types/families/compositions/elements/element-types cho Ontology; cấu trúc tĩnh + điều hướng cho Sysmap), verified.*

*Ghi chú lịch sử: sau khi hoàn thành **Domain + Lifecycle & State** (Giai đoạn 11, mục 2.5): backend `DomainController` (read-only thuần) + `LifecycleController` (join stateCount qua lifecycle_state) + frontend `DomainPage`/`LifecyclePage` (list đơn giản, không tab/detail — đúng prototype), verified.*

*Ghi chú lịch sử: sau khi hoàn thành **Financial Obligation Archetype** (Giai đoạn 10, phần 2 mục 2.4 — hoàn tất mục 2.4): backend `FinancialObligationArchetypeController` (join làm giàu typeCount/elementCount/productCount qua obligation_type/foa_element/pattern_obligation_type) + frontend `ArchetypePage` (card grid) + `ArchetypeDetailPage` (route `/archetype/:code`), verified.*

*Ghi chú lịch sử: sau khi hoàn thành **Obligation Library** (Giai đoạn 9, phần 1 mục 2.4): backend package `ontology` (ObligationTypeController/ObligationElementController/ObligationElementTypeController chuyển sang tự viết join làm giàu: familyName/archetypeName/elementCount/elementTypeName/isIdentify) + frontend ObligationPage 3-tab pixel-perfect, verified.*

*Ghi chú lịch sử — sau khi hoàn thành **Attribute** (Giai đoạn 8, CHỈ MÀN LIST): backend package `attribute` (Domain/AttributeGroup/AttributeConstraint mới; AttributeController/AttributeGroupController + structure/DataTypeController tự viết join làm giàu) + frontend AttributePage 3-tab (Attribute/Attribute Group/Data Type) pixel-perfect, verified. Màn "Attribute Usage" (lineage) + modal tạo/sửa hoãn (mục 6.A2 — chờ Pipeline + fragment/selector_scope).*

*Ghi chú lịch sử — sau khi hoàn thành **Ma trận ràng buộc** (Giai đoạn 7): backend package `governance` (ConstraintMatrix/MatrixCell + `/api/constraint-matrices` grid join nhãn + `/pattern-coverage` phái sinh) + frontend MatrixPage 4-tab pixel-perfect, verified. Zip mới nhất: `product-factory-phase7-matrix.zip`.*

*Ghi chú lịch sử — Block & Answer Slot (Giai đoạn 6): backend package `structure` (Block/AnswerSlot/DataType) + frontend BlockPage list pixel-perfect.

*Ghi chú lịch sử — sau khi hoàn thành **Product Pattern builder** (Giai đoạn 5) + audit nguồn data. Đính chính: BusinessIntent detail/KPI CHƯA làm (nợ). **ĐỔI THỨ TỰ (user chốt): Thư viện nền tảng trước — bắt đầu Block & Answer Slot (+ data_type), rồi matrix/attribute/obligation/archetype/domain/lifecycle/ontology/sysmap → wire builder Pattern về DB → rồi Pipeline (template…), đều DB-driven.** Business Intent detail+KPI và ListScreen interactive để đợt polish cuối. Zip mới nhất: `product-factory-phase5-pattern-builder.zip`.*
