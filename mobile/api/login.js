export default async function handler(req, res) { // chỉ chấp nhận phương thức POST để đăng nhập người dùng
    if (req.method === 'POST') { // lấy dữ liệu từ body của request
        const { email, password } = req.body; // kiểm tra nếu thiếu thông tin bắt buộc thì trả về lỗi 400 (Bad Request)

        if (!email || !password) { // nếu email và password bị thiếu thì trả về lỗi 
            return res.status(400).json({ error: 'Email and password are required' }); // trả về lỗi 400 nếu thiếu email hoặc password
        }

        // Simulate user authentication (replace with your logic)
        if (email === 'test@example.com' && password === 'test123') { // nếu email giả sử và password đúng thì trả về thông tin người dùng và token (đây là ví dụ, bạn nên thay thế bằng logic xác thực thực tế)
            return res.status(200).json({ // nếu đăng nhập thành công thì trả về mã 200 (OK) và thông tin người dùng cùng token (test postman sẽ thấy)
                message: 'Login successful', // đưa ra tin nhắn thành công vào response
                user: {
                    email: email,
                    role: 'user'
                },
                token: 'fake-jwt-token' // trả vè token
            });
        } else { // nếu email và password không đúng thì trả về lỗi 401 (Unauthorized)
            return res.status(401).json({ error: 'Invalid credentials' }); // trả về lỗi 401 nếu thông tin đăng nhập không hợp lệ
        }
    } else { // nếu 
        res.setHeader('Allow', ['POST']); // phương thức không phải post
        res.status(405).end(`Method ${req.method} Not Allowed`); // trả về trạng thái 405 (Method Not Allowed) nếu phương thức không được phép
    }
}