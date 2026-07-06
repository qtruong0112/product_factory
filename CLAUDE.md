# CLAUDE.md — Product Factory 5.1 (bàn giao cho Claude Code)

> File này Claude Code đọc mỗi phiên. Nó KHÔNG thay thế `PROJECT_STATUS.md` và `NEXT_WORK.md` — hai file đó là **nguồn sự thật đầy đủ**. Luôn đọc cả ba trước khi code.

## QUY TẮC VÀNG
- **Code là chuẩn.** MD lệch với code thật → tin code. Trước khi làm gì: quét code trong `product-factory/`.
- **Không hỏi lại những gì MD đã trả lời.** Không đoán tên cột — lấy từ `Product_Factory.sql` (DDL) hoặc canonical JSON.
- **Không tự bịa dữ liệu.** Data hiển thị = data thật từ DB qua API — kể cả Dashboard KPI tổng hợp (Giai đoạn 26: viết lại 100%, không còn ngoại lệ).

## VỊ TRÍ THƯ MỤC (quan trọng)
Gốc dự án nằm ở **`product-factory/`** (thư mục lồng), KHÔNG ở gốc repo:
- `product-factory/backend/`   → Java 21 + Spring Boot 3.3.4 + Maven, **Clean Architecture layer-first** (Giai đoạn 27): package `com.f88.productfactory.{domain.model.<feature>|domain.repository.<feature>|application.service.<feature>|application.common|application.dto.<feature>|infrastructure.config|presentation.controller.<feature>|presentation.common}`. Entity → `domain.model`, Spring Data repo → `domain.repository`, business/join/enrichment logic → `application.service` (Service class), REST endpoint → `presentation.controller` (Controller THIN, chỉ gọi Service). Tài nguyên đọc-only thuần dùng chung `application.common.ReadOnlyService<T,ID>` + `presentation.common.ReadOnlyController<T,ID>`.
- `product-factory/frontend/`  → React 18 + Vite + TS, cấu trúc theo layer (Giai đoạn 28): `src/infrastructure/` (api client, `icons.ts`, `nav.ts`, `tables.ts` — kết nối hạ tầng/config) + `src/presentation/{components,pages}/` (toàn bộ UI). `main.tsx` ở gốc `src/` (entry + router).
- `product-factory/docker-compose.yml`
Mọi lệnh build phải `cd product-factory/...` cho đúng cấp (lỗi hay gặp: "no configuration file provided" do đứng sai thư mục).

## FILE NGUỒN (bắt buộc có trong repo — KHÔNG được đoán thay)
- **Prototype UI:** `Product_Factory_5_1.html` — trích markup pixel-perfect cho MỌI màn mới. Nếu không thấy file này trong repo → DỪNG, báo user bổ sung, KHÔNG tự chế markup.
- **DDL:** `backend/src/main/resources/db/migration/V1__schema.sql` (43 bảng) — nguồn tên cột chính xác.
- **Seed:** `backend/src/main/resources/db/migration/V2__seed.sql` — data thật để verify.
- **Canonical (nếu có):** `product_factory_canonical_v3_semantic.json` — cấu trúc logic 43 bảng.
> Cách trích markup từ prototype: mục 8.5 PROJECT_STATUS (tìm mốc `openBuilder`/`BLOCKS(){`/tên view, unescape thủ công, KHÔNG dùng `unicode_escape`).

## LUẬT CỨNG (mục 2 & 7 PROJECT_STATUS)
- **Read-only 90%.** Backend chỉ `GET`. Entity chỉ getter, `@Entity @Table` (nằm ở `domain.model.<feature>`). Read-only thuần → Controller (`presentation.controller.<feature>`) extends `presentation.common.ReadOnlyController<T,ID>`, override `service()` trả `new ReadOnlyService<>(repo)`; cần join làm giàu list → tách riêng `application.service.<feature>.XxxService` (chứa logic) + Controller thin gọi Service, trả `Page<Map<String,Object>>`. Composite PK → `@IdClass` + `Serializable` (đặt cùng `domain.model` với entity).
- **Enum PostgreSQL map bằng `@Column String`** (KHÔNG `@Enumerated`). Resource path kebab số nhiều: `/api/product-patterns`.
- **Frontend pixel-perfect từ prototype** (`Product_Factory_5_1.html`), inline style trích nguyên — không chế lại. Màn list dùng `ListScreen` (signature THẬT: `rows: ReactNode[][]`), `StatusChip`, `Icon` (35 icon, **không có** lock/history/grid). Bảng màu: xanh `#0E8C5A` / đậm `#0B7349` / sidebar `#0B3B2E→#082A20`; chữ `#122019`/`#5E6F66`; viền `#E6ECE8`; nền `#F4F7F5`. Font `Be Vietnam Pro`.
- **Màn builder/biểu đồ KHÔNG rút gọn thành detail thường** (bài học Pattern). Trích đúng markup builder.
- **nav key ≠ resource path**: intent→`/api/product-intents`, businessintent→`/api/business-intents`, pattern→`/api/product-patterns`. Route detail đặt TRƯỚC `/:view` trong `main.tsx`.
- Nút CUD: giữ giao diện, no-op, tooltip "read-only".

## QUY TRÌNH MỖI MÀN
code → `cd product-factory/frontend && npm install && npm run build` (0 lỗi TS) → render kiểm chứng so khớp prototype → mới coi là xong → cập nhật `PROJECT_STATUS.md` + `NEXT_WORK.md`.
**Khác với môi trường web trước:** máy local này **build được backend thật** (`mvn` / `docker compose up --build`) — không còn giới hạn "sandbox chặn Maven 403". Vẫn giữ kỷ luật verify. Không cần đóng zip mỗi lượt nữa — dùng **git commit** từng màn thay cho zip trọn vẹn.

## MÀN KẾ TIẾP
**TẤT CẢ 18 MÀN + Simulation Engine ĐÃ HOÀN TẤT, đợt polish cuối đã xong 5.1 (BI detail+KPI) + 5.2 (ListScreen interactive).** Vừa xong **Giai đoạn 22 — audit toàn diện sample data**: user yêu cầu kiểm tra 7 khu vực (BI/PI/Pattern/Template/Config/Block+AnswerSlot/Attribute) xem quan hệ N:1/N:M nào còn trống dòng con. Query trực tiếp DB thật đếm theo FK (không chỉ đọc seed file) phát hiện 5 lỗ hổng thật: `business_intent_kpi` (5/7 BI trống), `product_intent_element` (4/6 PI trống), `template_frame` (5/6 template trống), `fragment` (6/7 config trống — **vi phạm bất biến DDL** "mỗi config-slot phải có ≥1 fragment default"), `attribute_enum_value` của `occupation` (DT_ENUM nhưng 0 giá trị). Bổ sung toàn bộ, suy diễn từ cấu trúc thật có sẵn (`obligation_type_composition`, `pattern_block`, `answer_slot.default_value`) — không bịa số. Bài học quan trọng: **luôn query DB thật đếm dòng con theo FK để tìm lỗ hổng, đừng chỉ tin cấu trúc seed file nhìn có vẻ đủ** — nhiều bảng chỉ 1 dòng cha có dữ liệu mẫu đại diện (vd trước đây chỉ CFG-0042 có fragment) trong khi các dòng cha khác cùng bảng bị bỏ trống hoàn toàn không ai để ý vì UI chỉ test 1 dòng đại diện. Trước đó đã **VIẾT LẠI Product Config (Giai đoạn 21)** sau khi user đối chiếu trực tiếp file prototype gốc và phát hiện bản Giai đoạn 15 rút gọn sai (thiếu builder Fragment 3 cột + panel Resolution) — bài học: **luôn trích đúng markup gốc, không tự rút gọn dù đã "xong" từ trước** — nếu user chỉ ra khác biệt, đối chiếu lại ngay, đừng giả định bản cũ đúng. Chỉ còn: **5.3 loading/error states nhất quán + Docker hoàn thiện**, và 5.4 màn "Attribute Usage" (lineage, vẫn cố tình hoãn theo quyết định gốc). Luôn kiểm tra bundler JS xem view liên quan có dùng state tĩnh không trước khi quyết định list-only hay list+detail; cũng kiểm xem cột nào trông như fabricate thực ra suy ra được thật (bài học "Kênh" ở Variant/Activity Log; bài học Simulation: verify tổng tiền phải khớp seed từng đồng).

## NỢ — LÀM CUỐI, KHÔNG XEN GIỮA (← ĐANG Ở ĐÂY)
5.3: loading/error states nhất quán; Docker hoàn thiện.
5.4: Màn "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant, Selector Scope values, where-used) + modal tạo/sửa Attribute — backend Pipeline + `fragment`/`selector_scope` đã đủ (Giai đoạn 14-16), vẫn để cuối theo quyết định gốc.

## ĐÃ XONG
dashboard, businessintent(list + detail/KPI, route `/businessintent/:id`), intent(list+detail), pattern(builder, đã WIRE về DB thật), block(list + backend `structure`), matrix(4-tab + backend `governance`), attribute(list 3-tab + backend `Domain`/`AttributeGroup`/`AttributeConstraint`), obligation(list 3-tab, join làm giàu ontology có sẵn), archetype(card grid + detail, route `/archetype/:code`), domain(list, read-only thuần), lifecycle(list, join stateCount), ontology(ER-chain + decomposition + vocab, không backend mới — tổng hợp client-side từ API đã có), sysmap(pipeline + foundations + bảng quan hệ, không backend mới), template(list + detail `/template/:code`, backend `pipeline.ProductTemplate`/`CustomerSegment`/`TemplateSegment`/`TemplateFrame`), config(builder Fragment+Resolution pixel-perfect `/config/:code`, backend `pipeline.ProductConfig`/`SelectorScope`/`Fragment` — VIẾT LẠI Giai đoạn 21), variant(list, backend `pipeline.ProductVariant`/`ProductCatalog`/`CatalogListing`), catalog(card grid, backend `pipeline.ProductCatalogController`), release(stepper 8 bước + swimlane, backend `release.MakerCheckerProcess`/`ProcessStep`/`ProcessStepChecklist`), activity(list, backend `activity.ActivityLog`), simulation(form + annuity engine thật, backend `simulation.SimulationEngine`, `POST /api/simulation/run` — nút DUY NHẤT gọi tính toán thật, không no-op). **`ListScreen` (dùng chung mọi màn list) nay có search + filter dropdown THẬT chạy client-side (`components/ListScreen.tsx`, không cần sửa page nào khác).** TẤT CẢ 18 MÀN + Simulation Engine ĐÃ HOÀN TẤT. Chỉ còn 5.3 (loading/error, Docker) + 5.4 (Attribute Usage, hoãn).
