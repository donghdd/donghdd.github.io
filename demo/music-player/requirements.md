# Music Youtube Player

## Đặc tả kỹ thuật
- Style sử dụng tailwindcss, theme hỗ trợ switch dark mode và light mode, giao diện thật fancy ấn tượng khiến người khác phải "wow! thật phắn sỏn!". Nếu sử dụng icon thì hãy code SVG thay vì sử dụng file ảnh PNG.
- Theme chủ đạo kiểu glass với opacity thích hợp để tạo ấn tượng.
- Dữ liệu được lưu trong localstorage của trình duyệt. Nếu ban đầu không tìm thấy playlist trong localstorage thì nạp playlist từ playlistDefault.json
- phần chính của ứng dụng là canvas full màn hình với luồng dữ liệu từ webcam. Do vậy tại thời điểm khởi tạo cần phải hỏi người dùng cho phép sử dụng webcam.
- Mucsic player (youtube video) sẽ nằm ở góc dưới cùng bên trái và có thể di chuyển trên camera canvas khi người dùng thao tác với Gesture Controls. Khi làm việc với youtube, hãy sử dụng những cách tiếp cận public mà không cần phải sử dụng API Key.
- Danh sách nhạc mặc định sẽ ẩn đi và chỉ hiện lên nếu người dùng thao tác.
- Các modal (playlist, add/edit/delete video) cần có hiệu ứng animation bắt mắt và có opacity thích hợp.
- Sử dụng MediaPipe HandGesture Recognizer để play/pause và next/back. Yêu cầu tham khảo thư viện và code từ tài liệu hoặc ví dụ và hướng dẫn mới nhất từ Google.
- Camera canvas nên hiển thị Hand Landmarks để người dùng nhận biết thao tác control của mình.
- Gesture mapping sẽ là:
    + Khi Handedness là Right:
        - Open_Palm => nếu đang playing thì hiển thị youtube video fullscreen.
        - Closed_Fist => nếu đang fullscreen thì trở lại bình thường.
        - Thumb_Up => nếu chưa Play thì Playing.
        - Thumb_Down => nếu đang Playing thì Pause.
    + Khi Handedness là Left:
        - Open_Palm => nếu playlist đang close thì show playlist.
        - Closed_Fist => nếu playlist đang show thì close playlist.
        - Thumb_Up => Next video trong playlist, nếu là video cuối cùng thì chuyển đến video đầu tiên.
        - Thumb_Down => Back video trong playlist, nếu là video đầu tiên thì chuyển đến video cuối cùng.
	+ Sử dụng debound là 2 giây để tránh control player liên tục khi Gesture liên tục được detect.
	+ Open_Palm + (handedness = Left) => sử dụng để di chuyển Music Player trên camera canvas, ở chế độ di chuyển nên hiển thị 1 hình tròn ở lòng bàn tay trái như là indicator.
- Sử dụng HTML, javascript, css thuần để có thể launch được luôn.
    + Cấu trúc rõ ràng và comment đầy đủ để dễ dàng đọc hiểu và modify khi maintain và nâng cấp sau này.
    + Javascript cần phải có xử lý lỗi, console.log lỗi nếu có lỗi.
    + HTML phải đảm bảo thứ tự load đúng js/module/cdn. Sử dụng phiên bản ổn định mới nhất của mỗi module và đảm bảo không được lỗi 404 hoặc SomeObject is not defined. Cần có loading indicator để người dùng biết ứng dụng đang tải module.
    + Cần xử lý tốt sự phụ thuộc modules, sự khởi tạo phải được kiểm soát và quản lý. Xử lý đợi tất cả các module được load hoàn toàn nếu cần thiết, kiếm tra sự tồn tại của phụ thuộc trước khi khởi tạo. Hiển thị thông báo lỗi thân thiện nếu modules không load được.
    + Hãy thiết kế UI/UX một cách thông minh, không được sử dụng alert('a message...') hay các message tùy tiện mà người dùng sẽ tự cảm nhận UI/UX để sử dụng. Cũng không cần phải có Player Control buttons mà người dùng sẽ buộc phải sử dụng Gesture Controls.

## Tính năng
- Người dùng có thể thêm video nhạc từ youtube vào danh sách phát.
- Người dùng có thể xóa video sau khi đã thêm.
- Người dùng có thể sử dụng Hand Gesture để control player.
- Ứng dụng có UI/UX bắt mắt
    + Hiển thị modal xin quyền webcam đẹp mắt khi khởi động.
    + Hiển thị toast notifications cho mọi hành động.
    + Có empty state UI đẹp mắt cho playlist trống.
    + Có animations mượt mà cho tất cả các tương tác.
    + Hỗ trợ keyboard navigation.