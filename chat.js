// NOTE: Do NOT store secret API keys in client-side code. Always use the server-side proxy at `/api/support`.

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

  async function sendMessage() {// Hàm này chịu trách nhiệm xử lý việc gửi tin nhắn của người dùng, nó sẽ lấy nội dung từ ô input, thêm tin nhắn của người dùng vào mảng messages, hiển thị lại tất cả các tin nhắn, sau đó gọi API của Gemini AI để nhận phản hồi và thêm phản hồi đó vào mảng messages để hiển thị trên giao diện người dùng
    const text = input.value.trim();
    if (!text) return;

    messages.push({ role: "user", content: text }); // Thêm tin nhắn của người dùng vào mảng messages với vai trò "user" và nội dung là văn bản mà người dùng đã nhập, điều này giúp lưu trữ lịch sử cuộc trò chuyện và phân biệt giữa tin nhắn của người dùng và trợ lý
    input.value = "";
    renderMessages();

    const loadingDiv = document.createElement("div");
    loadingDiv.classList.add("loading");
    loadingDiv.textContent = "Red Queen đang trả lời...";
    chatBox.appendChild(loadingDiv);

    try {
      const API_KEY = "AQ.Ab8RN6ImOagc4jTpLIHwwDwmGxigG9eMGygmF9T9RuLbgLIzVg";
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
      
      const systemInstruction = "Bạn là Nữ Hoàng Đỏ, trợ lý tư vấn bánh kem thân thiện của Thảo Vy Store. Hãy trả lời bằng tiếng Việt, ngắn gọn và hữu ích. (Nói chuyện dễ thương).";
      
      // Chuyển đổi định dạng messages sang định dạng Gemini
      const chatHistory = [];
      const chatMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      const lastUserMsg = chatMessages[chatMessages.length - 1];
      
      for (let i = 0; i < chatMessages.length - 1; i++) {
        chatHistory.push({
          role: chatMessages[i].role === 'assistant' ? 'model' : 'user',
          parts: [{ text: chatMessages[i].content }]
        });
      }

      const reqBody = {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [
            ...chatHistory,
            { role: "user", parts: [{ text: lastUserMsg.content }] }
        ]
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates[0].content.parts[0].text;
        messages.push({ role: 'assistant', content: reply });
      } else {
        const errData = await response.json().catch(()=>({}));
        console.warn("Gemini API error:", errData);
        messages.push({ role: 'assistant', content: '❌ Có lỗi xảy ra từ máy chủ AI. Vui lòng thử lại sau.' });
      }
    } catch (error) {
      console.error('Chat error', error);
      messages.push({ role: 'assistant', content: '❌ Không thể kết nối. Kiểm tra mạng hoặc API Key.' });
    }

    renderMessages(); // Gọi hàm renderMessages để cập nhật giao diện người dùng với tin nhắn mới nhất, bao gồm cả phản hồi của trợ lý hoặc thông báo lỗi nếu có, điều này đảm bảo rằng người dùng luôn nhìn thấy nội dung cuộc trò chuyện mới nhất sau khi gửi tin nhắn và nhận phản hồi từ API của Gemini AI 
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
