# Parallel Corpus Frontend

Next.js frontend cho ứng dụng Parallel Corpus.

## Cài đặt và chạy

### Sử dụng Docker (Khuyến nghị)

1. **Clone repository:**
```bash
git clone <your-repo-url>
cd frontend
```

2. **Tạo file .env:**
```bash
cp env.example .env
# Chỉnh sửa NEXT_PUBLIC_API_URL trong .env theo backend URL của bạn
```

3. **Chạy với Docker Compose:**
```bash
docker-compose up -d
```

### Chạy trực tiếp (Development)

1. **Cài đặt dependencies:**
```bash
npm install
# hoặc
yarn install
```

2. **Tạo file .env và cấu hình NEXT_PUBLIC_API_URL**

3. **Chạy development server:**
```bash
npm run dev
# hoặc
yarn dev
```

4. **Build cho production:**
```bash
npm run build
npm start
```

## Deploy lên Production

### Sử dụng Docker

1. **Build image:**
```bash
docker build -t parallel-corpus-frontend .
```

2. **Chạy container:**
```bash
docker run -d \
  --name parallel-corpus-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-backend-domain.com \
  -e NODE_ENV=production \
  parallel-corpus-frontend
```

### Sử dụng Docker Compose (Production)

1. **Tạo docker-compose.prod.yml:**
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://your-backend-domain.com
      - NODE_ENV=production
    restart: unless-stopped
```

2. **Chạy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy lên Vercel

1. **Kết nối repository với Vercel**

2. **Cấu hình Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: URL của backend API

3. **Deploy tự động**

### Deploy lên Netlify

1. **Build command:**
```bash
npm run build
```

2. **Publish directory:**
```
.next
```

3. **Cấu hình Environment Variables**

## Environment Variables

- `NEXT_PUBLIC_API_URL`: URL của backend API (required)
- `NODE_ENV`: Environment (development/production)
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry

## Cấu trúc dự án

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── components/     # Shared components
│   └── ...
├── components/         # UI components
├── config/            # Configuration files
├── dao/               # Data access layer
├── redux/             # State management
└── types/             # TypeScript types
```

## Scripts

- `npm run dev`: Chạy development server
- `npm run build`: Build cho production
- `npm run start`: Chạy production server
- `npm run lint`: Chạy ESLint

## Kết nối với Backend

Frontend sẽ gọi API từ backend thông qua biến môi trường `NEXT_PUBLIC_API_URL`. Đảm bảo backend đã được cấu hình CORS để cho phép frontend domain.
