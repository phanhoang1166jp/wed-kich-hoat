import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Key chính thức của bạn
const API_KEY = "bpU6d35gEsklVkvduG5UfhDI3";

app.post('/api/get-cid', async (req, res) => {
    try {
        const { iid } = req.body;

        // Kiểm tra độ dài chuỗi ký tự đầu vào
        if (!iid || iid.length !== 63) {
            return res.json({ 
                success: false, 
                message: "インストールIDは63桁の数字で入力してください。" 
            });
        }

        // Gọi API đến hệ thống pidkey.com
        const response = await axios.get('https://pidkey.com/ajax/cidms_api', {
            params: {
                iids: iid,
                justforcheck: 0,
                apikey: API_KEY
            },
            timeout: 25000 
        });

        const apiResponse = response.data;

        // Kiểm tra phản hồi trả về từ API
        if (apiResponse && apiResponse.have_cid === 1) {
            // Trường hợp THÀNH CÔNG: Trả về mã CID nhận được
            return res.json({
                success: true,
                cid: apiResponse.confirmationid
            });
        } else {
            // Trường hợp THẤT BẠI: Lấy thông báo lỗi trực tiếp từ hệ thống API
            let errorMsg = apiResponse.error_executing || "インストールID、またはAPIキーが無効です。";
            
            // Lọc và chuẩn hóa lại chuỗi thông báo nếu dính ký tự lạ
            if (errorMsg.includes("thích hợp") || errorMsg.includes("invalid")) {
                errorMsg = "インストールID、またはAPIキーが無効です。";
            }

            return res.json({
                success: false,
                message: errorMsg
            });
        }

    } catch (error) {
        console.error("Pidkey API Error:", error.message);
        return res.json({
            success: false,
            message: "サーバーに接続できませんでした。時間をおいて再度お試しください。"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});