# Product Factory 5.1

Hệ thống cấu hình sản phẩm cho vay (F88-style), rebuild từ prototype HTML tĩnh thành ứng dụng thật: **Java 21 + Spring Boot 3.3.4 + Maven** (backend) · **React 18 + Vite + TypeScript** (frontend) · **PostgreSQL 16** (schema + seed 43 bảng, nạp bằng Flyway).

> Chi tiết quy ước code, quy tắc vàng, trạng thái từng màn: xem `CLAUDE.md`, `PROJECT_STATUS.md`, `NEXT_WORK.md`. File này chỉ tóm tắt cách chạy dự án.

## Kiến trúc

- **Read-only 90%**: hầu hết bảng chỉ có `GET` (list phân trang + chi tiết theo khóa). Bảng thuần không cần join dùng chung `common/ReadOnlyController<T,ID>`; bảng cần join làm giàu (đếm, tên liên kết…) có controller viết tay trả `Page<Map<String,Object>>`.
- **Enum Postgres** ánh xạ bằng `@Column String` (không `@Enumerated`).
- **Frontend pixel-perfect** theo prototype `docs/Product_Factory_5_1.html` — dùng chung `ListScreen`, `StatusChip`, `Icon`, bảng màu/font cố định (Be Vietnam Pro, xanh `#0E8C5A`).
- **Simulation Engine** (chưa dựng — nợ cuối): `POST /api/simulation/run`, không ghi DB.

## Chạy bằng Docker (1 lệnh)

```bash
cd product-factory
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api/...
- PostgreSQL: localhost:5432 (`product_factory` / `pf_user` / `pf_pass`)

Dừng: `docker compose down` · Xóa cả dữ liệu: `docker compose down -v`

## Chạy tay (không Docker)

```bash
# 1) Postgres: tạo DB product_factory (user pf_user / pf_pass) — Flyway tự nạp schema+seed khi backend khởi động
# 2) Backend
cd product-factory/backend && mvn spring-boot:run
# 3) Frontend (cửa sổ khác)
cd product-factory/frontend && npm install && npm run dev
```

## Trạng thái hiện tại

**Nhóm "thư viện nền tảng" đã hoàn tất** — 13 màn đã dựng pixel-perfect, đọc dữ liệu thật qua API:

dashboard · business intent (list) · product intent (list + detail) · product pattern (builder) · block · matrix (ma trận ràng buộc) · attribute (3 tab) · obligation (3 tab) · financial obligation archetype (card grid + detail) · domain · lifecycle & state · ontology (sơ đồ) · sysmap (sơ đồ quan hệ tổng thể).

**Tiếp theo** (`NEXT_WORK.md` mục 2.7): wire builder Product Pattern về DB thật (bỏ `patternBuilderData.ts` fix cứng), sau đó dựng lớp Pipeline (template → config → variant → catalog).

**Nợ, làm cuối**: Business Intent detail+KPI, ListScreen tương tác (search/filter), màn Attribute Usage (lineage) + modal tạo/sửa Attribute, Simulation Engine, loading/error state, đóng gói Docker hoàn thiện.

## Cấu trúc thư mục

```
product-factory/
├─ docker-compose.yml
├─ docs/                                  Prototype HTML + tài liệu tham chiếu
├─ backend/
│  ├─ Dockerfile · pom.xml
│  └─ src/main/
│     ├─ java/com/f88/productfactory/
│     │  ├─ common/       ReadOnlyController, GlobalExceptionHandler
│     │  ├─ config/       WebConfig (CORS)
│     │  ├─ ontology/     Obligation Type/Element/Family, Archetype, Lifecycle
│     │  ├─ attribute/    Attribute, AttributeGroup, Domain, AttributeConstraint
│     │  ├─ structure/    Block, AnswerSlot, DataType
│     │  ├─ governance/   ConstraintMatrix, MatrixCell
│     │  └─ pipeline/     Business/Product Intent, Product Pattern, ...
│     └─ resources/
│        ├─ application.yml
│        └─ db/migration/  V1__schema.sql (43 bảng) · V2__seed.sql (Flyway)
└─ frontend/
   ├─ Dockerfile · nginx.conf · package.json · vite.config.ts
   └─ src/
      ├─ main.tsx           router + sidebar (nav key → resource path)
      ├─ api/client.ts       getList/getById/getDetail
      ├─ components/         Layout, ListScreen, StatusChip, Icon, DataTable
      └─ pages/              1 file / màn (Dashboard, Attribute, Obligation, Archetype, ...)
```
