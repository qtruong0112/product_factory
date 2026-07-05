# CLAUDE.md — Product Factory 5.1 (bàn giao cho Claude Code)

> File này Claude Code đọc mỗi phiên. Nó KHÔNG thay thế `PROJECT_STATUS.md` và `NEXT_WORK.md` — hai file đó là **nguồn sự thật đầy đủ**. Luôn đọc cả ba trước khi code.

## QUY TẮC VÀNG
- **Code là chuẩn.** MD lệch với code thật → tin code. Trước khi làm gì: quét code trong `product-factory/`.
- **Không hỏi lại những gì MD đã trả lời.** Không đoán tên cột — lấy từ `Product_Factory.sql` (DDL) hoặc canonical JSON.
- **Không tự bịa dữ liệu.** Data hiển thị = data thật từ DB qua API (trừ Dashboard KPI tổng hợp).

## VỊ TRÍ THƯ MỤC (quan trọng)
Gốc dự án nằm ở **`product-factory/`** (thư mục lồng), KHÔNG ở gốc repo:
- `product-factory/backend/`   → Java 21 + Spring Boot 3.3.4 + Maven, package `com.f88.productfactory.{ontology|pipeline|attribute|structure|governance|common|config}`
- `product-factory/frontend/`  → React 18 + Vite + TS
- `product-factory/docker-compose.yml`
Mọi lệnh build phải `cd product-factory/...` cho đúng cấp (lỗi hay gặp: "no configuration file provided" do đứng sai thư mục).

## FILE NGUỒN (bắt buộc có trong repo — KHÔNG được đoán thay)
- **Prototype UI:** `Product_Factory_5_1.html` — trích markup pixel-perfect cho MỌI màn mới. Nếu không thấy file này trong repo → DỪNG, báo user bổ sung, KHÔNG tự chế markup.
- **DDL:** `backend/src/main/resources/db/migration/V1__schema.sql` (43 bảng) — nguồn tên cột chính xác.
- **Seed:** `backend/src/main/resources/db/migration/V2__seed.sql` — data thật để verify.
- **Canonical (nếu có):** `product_factory_canonical_v3_semantic.json` — cấu trúc logic 43 bảng.
> Cách trích markup từ prototype: mục 8.5 PROJECT_STATUS (tìm mốc `openBuilder`/`BLOCKS(){`/tên view, unescape thủ công, KHÔNG dùng `unicode_escape`).

## LUẬT CỨNG (mục 2 & 7 PROJECT_STATUS)
- **Read-only 90%.** Backend chỉ `GET`. Entity chỉ getter, `@Entity @Table`. Read-only thuần → extends `common/ReadOnlyController<T,ID>`; cần join làm giàu list → tự viết controller (không extends), trả `Page<Map<String,Object>>`. Composite PK → `@IdClass` + `Serializable`.
- **Enum PostgreSQL map bằng `@Column String`** (KHÔNG `@Enumerated`). Resource path kebab số nhiều: `/api/product-patterns`.
- **Frontend pixel-perfect từ prototype** (`Product_Factory_5_1.html`), inline style trích nguyên — không chế lại. Màn list dùng `ListScreen` (signature THẬT: `rows: ReactNode[][]`), `StatusChip`, `Icon` (35 icon, **không có** lock/history/grid). Bảng màu: xanh `#0E8C5A` / đậm `#0B7349` / sidebar `#0B3B2E→#082A20`; chữ `#122019`/`#5E6F66`; viền `#E6ECE8`; nền `#F4F7F5`. Font `Be Vietnam Pro`.
- **Màn builder/biểu đồ KHÔNG rút gọn thành detail thường** (bài học Pattern). Trích đúng markup builder.
- **nav key ≠ resource path**: intent→`/api/product-intents`, businessintent→`/api/business-intents`, pattern→`/api/product-patterns`. Route detail đặt TRƯỚC `/:view` trong `main.tsx`.
- Nút CUD: giữ giao diện, no-op, tooltip "read-only".

## QUY TRÌNH MỖI MÀN
code → `cd product-factory/frontend && npm install && npm run build` (0 lỗi TS) → render kiểm chứng so khớp prototype → mới coi là xong → cập nhật `PROJECT_STATUS.md` + `NEXT_WORK.md`.
**Khác với môi trường web trước:** máy local này **build được backend thật** (`mvn` / `docker compose up --build`) — không còn giới hạn "sandbox chặn Maven 403". Vẫn giữ kỷ luật verify. Không cần đóng zip mỗi lượt nữa — dùng **git commit** từng màn thay cho zip trọn vẹn.

## MÀN KẾ TIẾP
**Nhóm "thư viện nền tảng" đã XONG, builder Pattern đã WIRE về DB thật, Product Template đã XONG (Giai đoạn 14 — list only, xác nhận không phải builder).** Tiếp theo: **Product Config** (NEXT_WORK mục 3.2, nav key `config`) — kiểm tra prototype xem có phải builder không trước khi rút gọn.

## NỢ — LÀM CUỐI, KHÔNG XEN GIỮA
Business Intent detail+KPI (5.1); ListScreen interactive (5.2); Simulation Engine (`POST /api/simulation/run`, gần cuối); loading/error states; Docker hoàn thiện.
Màn "Attribute Usage" (lineage Attribute→Answer Slot→Template→Config→Variant, Selector Scope values, where-used) + modal tạo/sửa Attribute — hoãn tới khi Pipeline (template/config/variant) + `fragment`/`selector_scope` có backend (tránh lặp lại fix cứng như Pattern builder).

## ĐÃ XONG
dashboard, businessintent(list), intent(list+detail), pattern(builder, đã WIRE về DB thật), block(list + backend `structure`), matrix(4-tab + backend `governance`), attribute(list 3-tab + backend `Domain`/`AttributeGroup`/`AttributeConstraint`), obligation(list 3-tab, join làm giàu ontology có sẵn), archetype(card grid + detail, route `/archetype/:code`), domain(list, read-only thuần), lifecycle(list, join stateCount), ontology(ER-chain + decomposition + vocab, không backend mới — tổng hợp client-side từ API đã có), sysmap(pipeline + foundations + bảng quan hệ, không backend mới), template(list, backend `pipeline.ProductTemplate`/`CustomerSegment`/`TemplateSegment`, xác nhận không phải builder). **Nhóm thư viện nền tảng đã hoàn tất, builder Pattern đã hết fix cứng — `patternBuilderData.ts` đã xóa. Pipeline sản phẩm đã bắt đầu.**
