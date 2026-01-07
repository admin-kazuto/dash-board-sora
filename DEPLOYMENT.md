# Hướng Dẫn Deploy (Vercel + MongoDB Atlas)

Project này được thiết kế tối ưu để chạy trên Vercel và dùng MongoDB Atlas làm database.

## Bước 1: Chuẩn bị Database (MongoDB Atlas)
1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Tạo một tài khoản free và tạo một Cluster mới (Shared - Free).
3. Vào phần **Database Access**, tạo một user mới (ví dụ: `admin`), đặt password và lưu lại.
4. Vào phần **Network Access**, chọn "Allow Access from Anywhere" (0.0.0.0/0) để Vercel có thể kết nối.
5. Quay lại **Database**, bấm **Connect** -> **Drivers** -> Copy chuỗi kết nối (Connection String).
   - Chuỗi sẽ có dạng: `mongodb+srv://admin:<password>@cluster0...`
   - Nhớ thay `<password>` bằng pass bạn vừa tạo.

## Bước 2: Đẩy code lên GitHub
1. Tạo một repository mới trên GitHub (ví dụ: `sora-dashboard`).
2. Mở terminal tại thư mục `sora-dashboard` và chạy lệnh sau (nếu chưa kết nối):
   ```bash
   git remote add origin https://github.com/<username>/sora-dashboard.git
   git branch -M main
   git push -u origin main
   ```

## Bước 3: Deploy lên Vercel
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard).
2. Bấm **Add New...** -> **Project**.
3. Chọn repo `sora-dashboard` bạn vừa đẩy lên GitHub.
4. Ở phần **Environment Variables**, thêm biến sau:
   - **Key**: `MONGODB_URI`
   - **Value**: (Dán chuỗi kết nối MongoDB của bạn vào đây)
5. Bấm **Deploy**.

## Bước 4: Hoàn tất
- Sau khi deploy xong, Vercel sẽ cấp cho bạn một domain (ví dụ: `sora-dashboard.vercel.app`).
- Bạn dùng domain này để update vào `sora-app` của bạn (thay thế endpoint cũ).
