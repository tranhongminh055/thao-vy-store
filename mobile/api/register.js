export default async function handler(req, res) { // chỉ chấp nhận phương thức POST để đăng ký người dùng
    if (req.method === 'POST') { // lấy dữ liệu từ body của request
        const { name, email, password, role } = req.body; // kiểm tra nếu thiếu thông tin bắt buộc thì trả về lỗi 400 (Bad Request)

        if (!name || !email || !password || !role) { // nếu thiếu thông tin bắt buộc thì trả về lỗi 400 
            return res.status(400).json({ error: 'Name, email, password, and role are required' }); // trả về lỗi 400 nếu thiếu thông tin bắt buộc
        }

        // giả sử email '
        if (email === 'test@example.com') {
            return res.status(400).json({ error: 'User already exists' }); // trả về lỗi 400 nếu email đã tồn tại (giả sử email)
        }
        // thêm logic để lưu người dùng vào cơ sở dữ liệu ở đây (đây là ví dụ)
        return res.status(201).json({ // nếu đăng ký thành công thì trả về mã 201 (Created) và thông tin người dùng đã tạo
            message: 'User created successfully', // đưa tin nhắn thành công vào response
            user: { // thông tin trường user bao gồm name, email và role (không bao gồm password vì lý do bảo mật)
                name: name,
                email: email,
                role: role
            }
        });
    } else { // nếu phương thức không phải POST thì 
        res.setHeader('Allow', ['POST']); // thiết lập header 'Allow' để chỉ ra rằng chỉ có phương thức POST được phép
        res.status(405).end(`Method ${req.method} Not Allowed`); // trả về lỗi 405 (Method Not Allowed) nếu phương thức không được phép
    }
}

