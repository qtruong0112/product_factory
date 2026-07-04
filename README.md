# Product Factory 5.1 — Web (Giai đoạn 0)

Read-only data explorer (90% chỉ đọc) + Simulation Engine (10% tính toán).

- **Backend**: Java 21 · Spring Boot 3.3 · Maven
- **Frontend**: React 18 · Vite · TypeScript
- **Database**: PostgreSQL 16 (schema + seed 43 bảng nạp bằng Flyway)

## Giai đoạn 0 gồm gì

Khung dự án chạy được đầu-cuối, kèm **1 lát cắt mẫu** (`attribute`) xuyên suốt DB → API → UI để kiểm chứng kiến trúc trước khi nhân ra 43 bảng.

- Database tự nạp schema (`V1__schema.sql`) và seed (`V2__seed.sql`) khi khởi động — đã test: 43/43 bảng có dữ liệu, bảng `attribute` có 31 dòng.
- Backend: `GET /api/attributes` (phân trang) và `GET /api/attributes/{code}`.
- Frontend: màn "Attributes" đọc API và hiển thị bảng.

## Chạy bằng Docker (1 lệnh)

```bash
docker compose up --build
```

Sau khi build xong:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api/attributes
- PostgreSQL: localhost:5432 (product_factory / pf_user / pf_pass)

Dừng: `docker compose down` · Xóa cả dữ liệu: `docker compose down -v`

## Chạy tay (không Docker)

```bash
# 1) Postgres: tạo DB product_factory (user pf_user / pf_pass) — Flyway sẽ tự nạp schema+seed
# 2) Backend
cd backend && mvn spring-boot:run
# 3) Frontend (cửa sổ khác)
cd frontend && npm install && npm run dev
```

## Kiến trúc (đã chốt)

- **Read-only**: mỗi bảng chỉ có 2 endpoint GET, dùng chung `ReadOnlyController` để đồng nhất.
- **Simulation** (giai đoạn sau): `GET /api/simulation/configs` lấy tham số mặc định từ một Config; `POST /api/simulation/run` nhận tham số đã chỉnh, chạy engine annuity, trả lịch trả nợ + LTV. `POST` không ghi DB.

## Lộ trình tiếp theo

- **Giai đoạn 1**: sinh entity/repo/controller cho toàn bộ 43 bảng (dùng lại `ReadOnlyController`).
- **Giai đoạn 2**: Simulation Engine (port công thức annuity từ prototype).
- **Giai đoạn 3**: dựng đủ 18 màn hình React theo prototype HTML.
- **Giai đoạn 4**: xử lý lỗi/loading, hoàn thiện đóng gói.

## Cấu trúc thư mục

```
product-factory/
├─ docker-compose.yml
├─ backend/
│  ├─ Dockerfile · pom.xml
│  └─ src/main/
│     ├─ java/com/f88/productfactory/
│     │  ├─ ProductFactoryApplication.java
│     │  ├─ config/WebConfig.java              (CORS)
│     │  ├─ common/ReadOnlyController.java      (base GET cho mọi bảng)
│     │  ├─ common/GlobalExceptionHandler.java
│     │  └─ attribute/                          (lát cắt mẫu: Entity·Repo·Controller)
│     └─ resources/
│        ├─ application.yml
│        └─ db/migration/V1__schema.sql · V2__seed.sql   (Flyway)
└─ frontend/
   ├─ Dockerfile · nginx.conf · package.json · vite.config.ts
   └─ src/
      ├─ main.tsx (router + sidebar)
      ├─ api/client.ts · api/types.ts
      └─ pages/AttributesPage.tsx
```
