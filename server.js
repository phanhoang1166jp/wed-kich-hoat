const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình Middleware đọc dữ liệu và thư mục tĩnh (public)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Giao diện trang chủ (Microsoft Activation Wizard UI)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tuyến đường xử lý lấy CID tự động từ hệ thống đối tác
app.post('/api/activate', async (req, res) => {
    try {
        const { iid } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào trống
        if (!iid) {
            return res.status(400).json({ 
                success: false, 
                message: 'エラー: インストールIDを入力してください。' 
            });
        }

        // 2. Làm sạch chuỗi IID: Xóa bỏ khoảng trắng, dấu gạch ngang (-) và gạch dưới (_)
        const cleanIid = iid.trim().replace(/[\s-_]/g, '');

        // 3. Kiểm tra độ dài IID chuẩn của Microsoft trước khi gửi đi để tránh mất phí lỗi
        if (cleanIid.length !== 54 && cleanIid.length !== 63) {
            return res.status(400).json({ 
                success: false, 
                message: `エラー: インストールIDの桁数が正しくありません（現在 ${cleanIid.length} 桁）。54桁または63桁であることをご確認ください。` 
            });
        }

        // 4. Cấu hình Endpoint và API Key kết nối sang pidkey.com
        const apiKey = 'DDbNLDI6mqT0yGFlfGjqGcfSC';
        const apiUrl = `https://pidkey.com/ajax/cidms_api?iids=${cleanIid}&justforcheck=0&apikey=${apiKey}`;

        // 5. Gửi yêu cầu lấy mã CID đến hệ thống Server đối tác
        const apiResponse = await fetch(apiUrl);

        if (!apiResponse.ok) {
            return res.status(502).json({ 
                success: false, 
                message: `サーバーエラー: 外部 API 接続に失敗しました (HTTP ${apiResponse.status})` 
            });
        }

        const data = await apiResponse.json();

        // 6. Kiểm tra các lỗi phản hồi nội bộ từ pidkey (Ví dụ: Key blocked, API hết hạn...)
        if (data.error || data.status === 'error') {
            return res.status(200).json({
                success: false,
                message: data.message || 'エラー: この インストールID は無効であるか、Microsoft によってブロックされています。'
            });
        }

        // 7. Trả kết quả sạch về cho giao diện hiển thị thành công
        return res.json({ success: true, data });

    } catch (error) {
        console.error('Lỗi hệ thống trung gian:', error.message);
        return res.status(500).json({
            success: false,
            message: 'システムエラーが発生しました。しばらく経ってからもう一度お試しください。: ' + error.message
        });
    }
});

// Khởi chạy hệ thống Server
app.listen(PORT, () => {
    console.log(`[OK] Server đang chạy mượt mà tại cổng: http://localhost:${PORT}`);
});