// NOTE: Do NOT store secret API keys in client-side code. Always use the server-side proxy at `/api/support`.

// --- TỰ ĐỘNG CHUYỂN HƯỚNG SANG GIAO DIỆN MOBILE ---
(function() {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const currentPath = window.location.pathname;
    
    // Nếu dùng điện thoại mà chưa ở trong thư mục mobile -> Chuyển vào mobile
    if (isMobileDevice && !currentPath.includes('/mobile/')) {
        let pathParts = currentPath.split('/');
        let filename = pathParts.pop() || 'index.html';
        if (filename === '') filename = 'index.html';
        
        pathParts.push('mobile');
        pathParts.push(filename);
        window.location.replace(pathParts.join('/') + window.location.search);
    } 
    // Nếu dùng máy tính mà lại lọt vào thư mục mobile -> Chuyển về root
    else if (!isMobileDevice && currentPath.includes('/mobile/')) {
        let newPath = currentPath.replace('/mobile/', '/');
        window.location.replace(newPath + window.location.search);
    }
})();

// Tự động kích hoạt hiệu ứng chuyển trang transitions.js cho toàn bộ website
(function() {
  if (!document.getElementById('transitions-script') && !window.ThaoVyTransitions) {
    const s = document.createElement('script');
    s.id = 'transitions-script';
    s.src = 'transitions.js';
    document.head.appendChild(s);
  }
})();

function injectChatbotHtml() { // Inject chatbot HTML into the page
  if (document.querySelector('.chatbot-wrapper')) return; // already injected
  const wrapper = document.createElement('div'); // Tạo một phần tử div mới để chứa toàn bộ giao diện của chatbot, điều này giúp tổ chức mã HTML của chatbot một cách gọn gàng và dễ quản lý, đồng thời tránh xung đột với các phần tử khác trên trang web
  wrapper.className = 'chatbot-wrapper'; // Add a wrapper div for the chatbot to avoid conflicts with existing styles
  wrapper.innerHTML = `
      <div class="fa-rocketchat"></div>
      <div class="chat-container d-none">
        <div class="chat-header">
          <i class="fa-solid fa-xmark"></i>
          <span>Red Queen</span>
        </div>
        <div id="chatBox" class="chat-box"></div>
        <div class="input-area">
          <input id="userInput" type="text" placeholder="Nhập câu hỏi..." />
          <button id="sendBtn">Gửi</button>
        </div>
      </div>
    `;
  document.body.appendChild(wrapper); // Append the chatbot wrapper to the body of the page to make it available on all pages, but it will be hidden by default and only shown when the user clicks the chat icon
}

// Chat hiển thị trên tất cả các trang trừ login và register để tránh gây rối khi người dùng đang cố gắng đăng nhập hoặc đăng ký tài khoản, đảm bảo trải nghiệm người dùng tốt hơn
function shouldHideChatbotOnThisPage() {
  try {
    const p = (location.pathname || '').toLowerCase(); // Lấy đường dẫn URL hiện tại và chuyển thành chữ thường để so sánh, tránh lỗi do viết hoa không nhất quán trong URL
    const hideList = ['/login.html', '/register.html', '/login', '/register']; // Danh sách các đoạn URL để ẩn chatbot, có thể mở rộng thêm nếu cần thiết
    return hideList.some(h => p.endsWith(h) || p.indexOf(h) !== -1); // Kiểm tra nếu URL kết thúc bằng hoặc chứa các đoạn chỉ định trong hideList, nếu có thì trả về true để ẩn chatbot
  } catch (e) {
    return false;
  }
}

let messages = [
  { role: "assistant", content: "Xin chào! Tôi là Nữ Hoàng Đỏ 👋" },
];

function setupChat() { // Bỏ qua việc inject chatbot trên các trang login và register để tránh gây rối khi người dùng đang cố gắng đăng nhập hoặc đăng ký tài khoản, đảm bảo trải nghiệm người dùng tốt hơn

  if (shouldHideChatbotOnThisPage()) return;

  injectChatbotHtml();

  const chatBox = document.getElementById("chatBox");
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById('sendBtn');

  function renderMessages() { // Hàm này chịu trách nhiệm hiển thị tất cả các tin nhắn trong mảng messages lên giao diện người dùng, nó sẽ xóa nội dung cũ và tạo lại toàn bộ danh sách tin nhắn mỗi khi có tin nhắn mới được thêm vào để đảm bảo hiển thị luôn cập nhật và chính xác
    chatBox.innerHTML = ""; // Xóa nội dung cũ trước khi render lại toàn bộ tin nhắn để tránh trùng lặp hoặc lỗi hiển thị
    messages.forEach((m) => { // Duyệt qua tất cả các tin nhắn trong mảng messages và tạo phần tử div mới cho mỗi tin nhắn, phân biệt giữa tin nhắn của người dùng và trợ lý bằng cách thêm class tương ứng, sau đó thêm phần tử này vào chatBox để hiển thị trên giao diện người dùng
      const div = document.createElement("div");// Tạo một phần tử div mới cho mỗi tin nhắn để hiển thị nội dung của tin nhắn đó trên giao diện người dùng
      div.classList.add("message", m.role); // Thêm class "message" và class tương ứng với vai trò của tin nhắn (user hoặc assistant) vào phần tử div để có thể áp dụng các kiểu dáng khác nhau cho tin nhắn của người dùng và trợ lý
      div.textContent = m.content; //   Đặt nội dung của phần tử div bằng nội dung của tin nhắn để hiển thị văn bản của tin nhắn đó trên giao diện người dùng
      chatBox.appendChild(div); // Thêm phần tử div mới vào chatBox để hiển thị tin nhắn trên giao diện người dùng, mỗi tin nhắn sẽ được thêm vào cuối danh sách để đảm bảo thứ tự hiển thị đúng theo thời gian gửi
    });
    chatBox.scrollTop = chatBox.scrollHeight; // Tự động cuộn xuống cuối chatBox mỗi khi có tin nhắn mới được thêm vào để đảm bảo người dùng luôn nhìn thấy tin nhắn mới nhất mà không cần phải cuộn thủ công
  }

  input.addEventListener("keydown", function (e) { //   Lắng nghe sự kiện "keydown" trên ô input để phát hiện khi người dùng nhấn phím Enter, nếu phím được nhấn là Enter thì gọi hàm sendMessage để gửi tin nhắn, điều này giúp cải thiện trải nghiệm người dùng bằng cách cho phép họ gửi tin nhắn nhanh chóng mà không cần phải nhấn nút gửi
    if (e.key === "Enter") {
      sendMessage();
    }
  });
  // Lắng nghe sự kiện click trên nút gửi để gọi hàm sendMessage khi người dùng nhấn nút gửi, điều này cung cấp một cách khác để người dùng có thể gửi tin nhắn ngoài việc nhấn phím Enter, giúp tăng tính tiện dụng và linh hoạt trong giao diện người dùng
  sendBtn.addEventListener('click', sendMessage);

  // System instruction cho chatbot - đặt ngoài hàm sendMessage để tránh tạo lại mỗi lần gửi
  const systemInstruction = `Bạn là Nữ Hoàng Đỏ (Red Queen) - Trợ lý chăm sóc khách hàng độc quyền và thông minh nhất của tiệm bánh Thảo Vy Store. Bạn được đích thân chủ quán training để có thể tự động xử lý toàn bộ các tình huống như một nhân viên xuất sắc. Tuyệt đối không bao giờ tiết lộ bạn là AI hay mô hình máy học, bạn là nhân viên thật tên Nữ Hoàng Đỏ.

--- QUY TẮC GIAO TIẾP VÀ THÁI ĐỘ ---
1. Xưng hô: Luôn xưng là "Mình" hoặc "Nữ Hoàng Đỏ", gọi khách là "Bạn", "Anh/Chị".
2. Thái độ: Luôn thân thiện, dễ thương, thấu hiểu, kiên nhẫn. Luôn dạ/vâng/ạ. Thêm các emoji như ❤️, 🍰, ✨, 🥰 để tạo sự gần gũi.
3. Nguyên tắc: Lấy khách hàng làm trung tâm. Luôn đưa ra giải pháp thay vì chỉ trả lời "Có/Không".

--- THÔNG TIN CỬA HÀNG ---
- Tên cửa hàng: Thảo Vy Store
- Hotline hỗ trợ: 1800 2097
- Email: support@thaovystore.vn
- Giờ mở cửa: 08:00 - 22:00 tất cả các ngày trong tuần.
- Điểm nổi bật: Bánh luôn tươi mới mỗi ngày, nguyên liệu cao cấp, an toàn sức khỏe, nhận làm bánh theo yêu cầu với độ hoàn thiện cực cao.

--- KIẾN THỨC SẢN PHẨM & TƯ VẤN ---
1. Bánh Sinh Nhật: 
   - Khách mua cho bé: Tư vấn bánh hình thú, búp bê, siêu nhân (Màu sắc tươi sáng).
   - Khách mua cho người yêu/vợ: Tư vấn bánh vẽ hình chibi, bánh kem hoa hồng, trái tim (Tone màu pastel lãng mạn).
   - Khách mua cho bố mẹ/người lớn tuổi: Tư vấn bánh kem bắp, bánh trà xanh, ít ngọt (Trang nhã, sang trọng, tốt cho sức khỏe).
2. Bánh Tiramisu: Vị cafe Ý kết hợp phô mai Mascarpone béo ngậy. Rất hợp cho các tín đồ mê đồ ngọt dịu và đắng nhẹ.
3. Bánh Cupcake: Phù hợp mua theo set (4-6 chiếc) làm quà tặng nhỏ hoặc đặt số lượng lớn cho tiệc trà, teabreak.
4. Bánh Gato/Sự kiện (20/10, Valentine): Trang trí theo concept độc quyền của tiệm, cháy hàng rất nhanh.
* Giá bán: Các mẫu nhỏ từ 150.000đ - 250.000đ. Các mẫu thiết kế lớn hoặc 2-3 tầng từ 300.000đ - 500.000đ+.

--- CROSS-SELLING (BÁN CHÉO SẢN PHẨM) ---
- Luôn tinh tế hỏi khách xem có cần mua thêm nến số (10k/số), pháo hoa sinh nhật (15k/cây), mũ chóp (15k/chiếc) hay bộ dao nĩa đĩa thêm không.
- Nếu khách mua bánh sinh nhật, nhắc nhở: "Dạ tiệm có tặng kèm 10 cây nến nhỏ và 1 bộ dao nĩa cơ bản rồi ạ. Bạn có muốn đổi sang nến số hoặc mua thêm nón sinh nhật không ạ?"

--- ĐẶT HÀNG, THANH TOÁN & GIAO HÀNG ---
1. Đặt hàng: Hướng dẫn khách chọn bánh trên website, bấm "Thêm vào giỏ" và điền thông tin. Đặt trước ít nhất 24 tiếng cho bánh thiết kế phức tạp.
2. Thanh toán: Khách có thể thanh toán Tiền mặt khi nhận hàng (COD) hoặc quét mã VNPay trên web.
3. Giao hàng: Giao hàng bằng xe máy có thùng giữ nhiệt. Phí ship tính theo khoảng cách. Shipper luôn gọi báo trước.

--- KỊCH BẢN XỬ LÝ TÌNH HUỐNG (CRISIS MANAGEMENT) ---
1. Khách chê bánh dở/Không đúng mẫu: 
   - "Dạ Nữ Hoàng Đỏ vô cùng xin lỗi vì trải nghiệm chưa tốt của bạn. Bạn vui lòng cho mình xin hình ảnh bánh và mã đơn hàng (hoặc số điện thoại) để mình lập tức báo cáo với Quản lý. Tiệm cam kết sẽ có phương án đền bù hoặc hoàn tiền xứng đáng cho bạn ạ!"
2. Khách hối giao hàng (Ship chậm):
   - "Dạ bạn cho mình xin mã đơn hàng để mình check định vị với anh Shipper ngay lập tức nhé. Chắc do đường xá hơi đông nên anh ấy chậm một chút, mong bạn thông cảm giúp tiệm nha ❤️"
3. Bánh bị móp méo khi giao tới:
   - Tuyệt đối không đổ lỗi ngay cho shipper. Nhận lỗi về phía cửa hàng, yêu cầu ảnh chụp và hứa đổi bánh mới hoặc hoàn tiền ngay lập tức. Cung cấp Hotline 1800 2097 để ưu tiên giải quyết.
4. Yêu cầu hủy đơn/Đổi mẫu phút chót:
   - Nếu khách báo hủy trước 12 tiếng: Vui vẻ đồng ý và hỗ trợ hủy/hoàn tiền.
   - Nếu khách báo hủy lúc bánh đã làm xong hoặc đang giao: "Dạ mong bạn thông cảm, bánh của bạn thợ nhà mình đã làm xong (hoặc đang giao) theo đúng yêu cầu riêng của bạn rồi ạ. Nên tiệm không thể hỗ trợ hủy lúc này được, mong bạn nhận bánh giúp Thảo Vy Store nha."

Bạn phải đóng vai một nhân viên CSKH hoàn hảo, kết hợp khéo léo những thông tin này để chat với khách. Đừng bao giờ trả lời như một cái máy.`;

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    messages.push({ role: "user", content: text });
    input.value = "";
    renderMessages();

    const loadingDiv = document.createElement("div");
    loadingDiv.classList.add("loading");
    loadingDiv.textContent = "Red Queen đang trả lời...";
    chatBox.appendChild(loadingDiv);

    try {
      // Gọi qua server proxy đang chạy ở port 3000
      const PROXY_URL = 'http://localhost:3000/api/support';

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          systemInstruction: systemInstruction
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.result || '❌ Không nhận được phản hồi.';
        messages.push({ role: 'assistant', content: reply });
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('API error:', errData);
        messages.push({ role: 'assistant', content: '❌ Lỗi kết nối server. Xin vui lòng thử lại sau.' });
      }
    } catch (error) {
      console.error('Network error:', error);
      messages.push({ role: 'assistant', content: '❌ Không thể kết nối tới server. Vui lòng kiểm tra server đang chạy.' });
    }

    renderMessages();
  }

  const toggleBtn = document.querySelector(".fa-rocketchat"); // Lắng nghe sự kiện click trên biểu tượng trò chuyện để hiển thị hoặc ẩn hộp thoại trò chuyện, điều này giúp người dùng có thể dễ dàng truy cập vào chatbot khi cần thiết và ẩn nó đi khi không sử dụng để
  toggleBtn.addEventListener("click", () => {
    const chatContainer = document.querySelector(".chat-container"); // Khi người dùng nhấn vào biểu tượng trò chuyện, tìm phần tử chứa hộp thoại trò chuyện và chuyển đổi lớp "d-none" để hiển thị hoặc ẩn nó, điều này giúp cải thiện trải nghiệm người dùng bằng cách cho phép họ kiểm soát việc hiển thị của chatbot một cách dễ dàng
    chatContainer.classList.toggle("d-none"); // Sử dụng class "d-none" để ẩn hoặc hiển thị hộp thoại trò chuyện, điều này giúp giữ cho giao diện người dùng gọn gàng và không
  });

  const closeBtn = document.querySelector(".fa-xmark"); // Lắng nghe sự kiện click trên nút đóng để ẩn hộp thoại trò chuyện, điều này cung cấp một cách dễ dàng cho người dùng để đóng chatbot khi họ không muốn sử dụng nó nữa, giúp cải thiện trải nghiệm người dùng bằng cách cho phép họ kiểm soát việc hiển thị của chatbot một cách linh hoạt
  closeBtn.addEventListener("click", () => {
    const chatContainer = document.querySelector(".chat-container"); // Khi người dùng nhấn vào nút đóng, tìm phần tử chứa hộp thoại trò chuyện và thêm lớp "d-none" để ẩn nó, điều này giúp cải thiện trải nghiệm người dùng bằng cách cho phép họ dễ dàng đóng chatbot khi không cần thiết mà không làm gián đoạn trải nghiệm của họ trên trang web
    chatContainer.classList.add("d-none");
  });

  renderMessages(); // Gọi hàm renderMessages để hiển thị tất cả các tin nhắn hiện có trong mảng messages lên giao diện người dùng ngay khi chatbot
}

// khởi tạo chatbot khi trang web được tải để đảm bảo rằng chatbot sẵn sàng để sử dụng ngay khi người dùng truy cập vào trang web, điều này giúp cải thiện trải nghiệm người dùng bằng cách cung cấp một công cụ hỗ trợ trực tuyến có thể truy cập dễ dàng từ bất kỳ trang nào trên website
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupChat);
} else {
  setupChat();
}
