let duLieuHeThong = null;
let coChuHienTai = 18; // Cỡ chữ mặc định ban đầu cho lời bài hát công đoàn

// 🌟 ĐÃ ĐIỀN CHÍNH XÁC ID THƯ MỤC THỰC TẾ CỦA BẠN TỪ LINK DRIVE
const ID_THU_MUC_DRIVE_CUONG = "1tAwDh20k9cJ0bM8OnnoMc63JIOosUZMb"; //

// 1. 🚀 GIẢI THUẬT NẠP SONG SONG (MULTI-FETCH) CHỐNG CHẶN KHỐI DỮ LIỆU > 25MB TRÊN GITHUB
async function taiCoSoDuLieu() {
    try {
        // Gọi lệnh nạp song song đồng thời cả 5 file JSON con siêu nhẹ để tăng tốc độ xử lý mạng
        const [resGoc, resLoi1, resLoi2, resLoi3, resLoi4] = await Promise.all([
            fetch('dulieu_goc.json'),
            fetch('dulieu_loi_1.json'),
            fetch('dulieu_loi_2.json'),
            fetch('dulieu_loi_3.json'),
            fetch('dulieu_loi_4.json')
        ]);
        
        const dataGoc = await resGoc.json();
        const loi1 = await resLoi1.json();
        const loi2 = await resLoi2.json();
        const loi3 = await resLoi3.json();
        const loi4 = await resLoi4.json();
        
        // Khớp nối băm nhỏ dữ liệu về lại cấu trúc duLieuHeThong nguyên vẹn như cũ
        duLieuHeThong = {
            danhSachMaTong: dataGoc.danhSachMaTong,
            thuVienLink: dataGoc.thuVienLink,
            thuVienNoiDung: { ...loi1, ...loi2, ...loi3, ...loi4 }
        };
        
        console.log("Đã nạp và khớp nối thành công cấu trúc dữ liệu 35.000 bài hát từ các file JSON nhỏ.");
    } catch (error) {
        console.error("Lỗi tải dữ liệu JSON hệ thống:", error);
    }
}

// Kích hoạt nạp dữ liệu ngay khi trang web mở lên
taiCoSoDuLieu();

// Hàm làm sạch chữ cái đầu không dấu để phục vụ tìm kiếm
function chuanHoaChuoi(text) {
    if (!text) return ""; //
    return text //
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
        .replace(/đ/g, "d").replace(/Đ/g, "d") //
        .toLowerCase() //
        .replace(/\s+/g, ""); // Xóa khoảng trắng
}

const searchBox = document.getElementById('search-box'); //
const resultsDiv = document.getElementById('results'); //

// 2. GIẢI THUẬT TÌM KIẾM HAI LỚP CHUẨN XÁC THEO Ý ĐỊNH CỦA BẠN
searchBox.addEventListener('input', (e) => {
    const keyword = e.target.value.trim(); //
    if (!keyword || !duLieuHeThong) { //
        resultsDiv.innerHTML = ""; //
        return; //
    }

    const chuoiSach = chuanHoaChuoi(keyword); //
    const maTimKiemBoc = "|" + chuoiSach + "|"; // Lớp 1: Dạng bọc "|ckl|" hoặc "|stt|"
    const maTimKiemTho = chuoiSach;             // Lớp 2: Dạng chuỗi thô "ckl" hoặc "stt"
    
    let ketQuaTieuDe = []; //
    let ketQuaLoi = []; //

    const danhSachMaTong = duLieuHeThong.danhSachMaTong || []; //
    const thuVienNoiDung = duLieuHeThong.thuVienNoiDung || {}; //

    // --- LỚP 1: QUÉT TUYẾN TÍNH THEO DÒNG VỚI DẠNG BỌC |ckl| ---
    for (let i = 0; i < danhSachMaTong.length; i++) {
        const dongGoc = danhSachMaTong[i]; //
        const dongHienTai = dongGoc.toLowerCase(); //

        if (dongHienTai.includes(maTimKiemBoc)) { //
            const baiHatGiaoDien = trichXuatBaiHat(dongGoc, thuVienNoiDung); //
            if (!baiHatGiaoDien) continue; //

            const viTriKhop = dongHienTai.indexOf(maTimKiemBoc); //
            const viTriGachDauTien = dongHienTai.indexOf('|'); //

            if (viTriKhop === viTriGachDauTien) { //
                ketQuaTieuDe.push(baiHatGiaoDien); //
            } else {
                ketQuaLoi.push(baiHatGiaoDien); //
            }
        }
        if (ketQuaTieuDe.length + ketQuaLoi.length >= 20) break; //
    }

    // --- LỚP 2: NẾU KHÔNG CÓ KẾT QUẢ NÀO KHỚP BIẾN THỂ BỌC, QUÉT CHUỖI THÔ ckl ---
    if (ketQuaTieuDe.length === 0 && ketQuaLoi.length === 0) { //
        for (let i = 0; i < danhSachMaTong.length; i++) {
            const dongGoc = danhSachMaTong[i]; //
            const dongHienTai = dongGoc.toLowerCase(); //

            const viTriGach = dongHienTai.indexOf('|'); //
            if (viTriGach === -1) continue; //
            
            const phanMaPhiaSau = dongHienTai.substring(viTriGach); //

            if (phanMaPhiaSau.includes(maTimKiemTho)) { //
                const baiHatGiaoDien = trichXuatBaiHat(dongGoc, thuVienNoiDung); //
                if (baiHatGiaoDien) { //
                    ketQuaLoi.push(baiHatGiaoDien); //
                }
            }
            if (ketQuaLoi.length >= 20) break; //
        }
    }

    const ketQuaCuoiCung = [...ketQuaTieuDe, ...ketQuaLoi]; //
    hienThiDanhSach(ketQuaCuoiCung); //
});

// Hàm bổ trợ bóc tách thông tin bài hát an toàn từ ID (Đã sửa sạch lỗi mảng)
function trichXuatBaiHat(dongGoc, thuVienNoiDung) {
    const viTriGach = dongGoc.indexOf('|'); //
    const phanTruocGach = viTriGach !== -1 ? dongGoc.substring(0, viTriGach) : dongGoc; //
    const idGocChuan = phanTruocGach.replace('@', '').replace('_', '').trim(); //
    
    const khoiVanBanWord = thuVienNoiDung[idGocChuan]; //
    if (!khoiVanBanWord) return null; //

    let tieuDe = "Bài hát số " + idGocChuan; //
    let tacGia = "Khuyết danh"; //

    const linesContent = khoiVanBanWord.split('\n'); //
    if (linesContent.length > 0) { //
        const firstLine = linesContent[0].trim(); //
        if (firstLine.includes('_')) { //
            const mangTach = firstLine.split('_'); //
            tieuDe = mangTach[0] ? mangTach[0].trim() : "Bài hát số " + idGocChuan; //
            tacGia = mangTach[1] ? mangTach[1].trim() : "Khuyết danh"; //
        } else {
            tieuDe = firstLine; //
        }
    }

    return {
        id: idGocChuan,
        tieuDe: tieuDe,
        tacGia: tacGia
    };
}

// 3. ĐỔ DANH SÁCH KẾT QUẢ RA GIAO DIỆN CỘT TRÁI
function hienThiDanhSach(danhSach) {
    if (danhSach.length === 0) { //
        resultsDiv.innerHTML = "<div class='list-item'><div class='item-info'><p>Không tìm thấy bài hát nào phù hợp.</p></div></div>"; //
        return; //
    }
    
    let htmlOutput = '<div class="group-header">Khớp với tiêu đề bài hát</div>'; //
    
    htmlOutput += danhSach.map((bai) => {
        let tenTacGia = bai.tacGia ? bai.tacGia.trim() : "Khuyết danh"; //

        return `
            <div class="list-item" id="item-${bai.id}" onclick="xemChiTiet('${bai.id}')">
                <div class="item-id">${bai.id}</div>
                <div class="item-info">
                    <div class="item-title">${bai.tieuDe}</div>
                    <div class="item-meta">
                        <span class="badge-match">Tác giả: ${tenTacGia}</span>
                    </div>
                </div>
                <div class="view-icon">📄</div>
            </div>
        `;
    }).join(''); //
    
    resultsDiv.innerHTML = htmlOutput; //
}

// 4. HÀM HIỂN THỊ CHI TIẾT LỜI BÀI HÁT VÀ KÍCH HOẠT ĐƯỜNG LINK GOOGLE DRIVE SẠCH LỖI CHUỖI
window.xemChiTiet = function(id) {
    if (!duLieuHeThong) return; //
    
    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active')); //
    const activeItem = document.getElementById("item-" + id); //
    if (activeItem) activeItem.classList.add('active'); //

    const itemHienTai = document.getElementById("item-" + id); //
    const tieuDeBai = itemHienTai.querySelector('.item-title').innerText; //
    
    const textNhanXanh = itemHienTai.querySelector('.badge-match').innerText; //
    const tacGiaBai = textNhanXanh.replace('Tác giả:', '').trim(); //

    const khoiVanBanWord = duLieuHeThong.thuVienNoiDung[id]; //
    let loiBaiHat = ""; //
    if (khoiVanBanWord) { //
        const lines = khoiVanBanWord.split('\n'); //
        loiBaiHat = lines.slice(1).join('\n').trim(); //
    }

    document.getElementById('no-data').style.display = 'none'; //
    document.getElementById('has-data').style.display = 'block'; //

    // 🚀 GIẢI THUẬT ĐỌC LINK GOOGLE DRIVE CHUẨN ĐƯỜNG DẪN XEM PDF ĐỘC LẬP
    let linkTudongDrive = "";
    
    // Tự động kiểm tra tra cứu bảng map link của 35.000 bài nếu được đồng bộ trong file dulieu_goc.json
    if (duLieuHeThong.thuVienLink && duLieuHeThong.thuVienLink[id]) {
        linkTudongDrive = duLieuHeThong.thuVienLink[id];
    } else {
        // Cơ chế dự phòng bằng câu lệnh truy vấn tìm kiếm lọc file Drive theo định dạng của bạn
        const cauLenhLocTho = "name = '" + id + ". xxx.pdf'"; //
        const thamSoMaHoa = encodeURIComponent(cauLenhLocTho); //
        linkTudongDrive = "https://google.com" + ID_THU_MUC_DRIVE_CUONG + "?q=" + thamSoMaHoa;
    }

    // Đổ tiêu đề và ép thuộc tính CSS màu xanh dương đậm có gạch chân, con trỏ hình bàn tay bấm
    const titleEl = document.getElementById('detail-title'); //
    titleEl.innerHTML = '<a href="' + linkTudongDrive + '" target="_blank" style="color: #007bff !important; text-decoration: underline !important; cursor: pointer !important; font-weight: bold; font-size: 26px; display: inline-block;">' + tieuDeBai + ' (Xem PDF 🖨️)</a>'; //
    
    document.getElementById('detail-author').innerText = "Tác giả: " + tacGiaBai; //
    
    const detailContentEl = document.getElementById('detail-content'); //
    detailContentEl.innerText = loiBaiHat; //
