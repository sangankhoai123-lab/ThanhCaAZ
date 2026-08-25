let duLieuHeThong = null;
let coChuHienTai = 18; 
const ID_THU_MUC_DRIVE_CUONG = "1tAwDh20k9cJ0bM8OnnoMc63JIOosUZMb"; 

async function taiCoSoDuLieu() {
    try {
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
        
        duLieuHeThong = {
            danhSachMaTong: dataGoc.danhSachMaTong,
            thuVienLink: dataGoc.thuVienLink,
            thuVienNoiDung: { ...loi1, ...loi2, ...loi3, ...loi4 }
        };
        console.log("Đã nạp thành công 35.000 bài hát.");
    } catch (error) {
        console.error("Lỗi tải dữ liệu JSON hệ thống:", error);
    }
}

taiCoSoDuLieu();

// 🌟 CHUẨN HÓA CHUỖI TOÀN DIỆN CHO CẢ CHỮ HOA VÀ CHỮ THƯỜNG
function chuanHoaChuoi(text) {
    if (!text) return ""; 
    return text 
        .toLowerCase() 
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/đ/g, "d")
        .replace(/\s+/g, " ") 
        .trim(); 
}

const searchBox = document.getElementById('search-box'); 
const resultsDiv = document.getElementById('results'); 

searchBox.addEventListener('input', (e) => {
    const keyword = e.target.value; 
    if (!keyword.trim() || !duLieuHeThong) { 
        resultsDiv.innerHTML = ""; 
        return; 
    }

    const chuoiSach = chuanHoaChuoi(keyword); 
    
    // 🔍 KIỂM TRA ĐIỀU KIỆN CÓ KHOẢNG TRẮNG ĐỂ BẬT/TẮT CHẾ ĐỘ CHỮ CÁI ĐẦU
    const coKhoangTrang = keyword.trim().includes(" "); 
    
    let ketQuaTieuDe = []; 
    let ketQuaLoi = []; 

    const danhSachMaTong = duLieuHeThong.danhSachMaTong || []; 
    const thuVienNoiDung = duLieuHeThong.thuVienNoiDung || {}; 

    for (let i = 0; i < danhSachMaTong.length; i++) {
        const dongGoc = danhSachMaTong[i]; 
        const dongHienTaiChuan = chuanHoaChuoi(dongGoc); 

        let hopLe = false;
        let laKhopChuCaiDau = false;

        if (coKhoangTrang) {
            // 👉 CHẾ ĐỘ 1: CÓ KHOẢNG TRẮNG -> Khớp cụm từ HOẶC khớp các chữ cái đầu từ
            const cacPhan = dongHienTaiChuan.split('|');
            const phanChu = cacPhan.length > 1 ? cacPhan[1] : cacPhan[0];
            
            // Trích xuất chữ cái đầu (ví dụ: "con kinh lay" -> "ckl")
            const mangTu = phanChu.split(/[^a-z0-9]+/);
            const chuCaiDauCuaBai = mangTu.filter(w => w.length > 0).map(w => w[0]).join('');
            
            const tuKhoaVietTat = chuoiSach.replace(/\s+/g, "");

            if (dongHienTaiChuan.includes(chuoiSach)) {
                hopLe = true;
            } else if (chuCaiDauCuaBai.includes(tuKhoaVietTat)) {
                hopLe = true;
                laKhopChuCaiDau = true;
            }
        } else {
            // 👉 CHẾ ĐỘ 2: KHÔNG KHOẢNG TRẮNG -> Bắt buộc tìm nguyên cụm từ dính liền
            if (dongHienTaiChuan.includes(chuoiSach)) {
                hopLe = true;
            }
        }

        if (hopLe) { 
            const baiHatGiaoDien = trichXuatBaiHat(dongGoc, thuVienNoiDung); 
            if (!baiHatGiaoDien) continue; 

            const viTriGach = dongHienTaiChuan.indexOf('|');
            if (laKhopChuCaiDau || (viTriGach !== -1 && dongHienTaiChuan.indexOf(chuoiSach) < viTriGach)) { 
                ketQuaTieuDe.push(baiHatGiaoDien); 
            } else {
                ketQuaLoi.push(baiHatGiaoDien); 
            }
        }
        if (ketQuaTieuDe.length + ketQuaLoi.length >= 25) break; 
    }

    hienThiDanhSach([...ketQuaTieuDe, ...ketQuaLoi]); 
});

// 🛠️ ĐÃ FIX LỖI CÚ PHÁP ĐOẠN INDEX MẢNG TẠI ĐÂY
function trichXuatBaiHat(dongGoc, thuVienNoiDung) {
    const viTriGach = dongGoc.indexOf('|'); 
    const phanTruocGach = viTriGach !== -1 ? dongGoc.substring(0, viTriGach) : dongGoc; 
    const idGocChuan = phanTruocGach.replace('@', '').replace('_', '').trim(); 
    
    const khoiVanBanWord = thuVienNoiDung[idGocChuan]; 
    if (!khoiVanBanWord) return null; 

    let tieuDe = "Bài hát số " + idGocChuan; 
    let tacGia = "Khuyết danh"; 

    const linesContent = khoiVanBanWord.split('\n'); 
    if (linesContent.length > 0) { 
        const firstLine = linesContent[0].trim(); // Sửa lỗi 1: Lấy phần tử index 0
        if (firstLine.includes('_')) { 
            const mangTach = firstLine.split('_'); 
            tieuDe = mangTach[0] ? mangTach[0].trim() : "Bài hát số " + idGocChuan; // Sửa lỗi 2: Lấy index mảng [0]
            tacGia = mangTach[1] ? mangTach[1].trim() : "Khuyết danh"; // Sửa lỗi 3: Lấy index mảng [1]
        } else {
            tieuDe = firstLine; 
        }
    }
    return { id: idGocChuan, tieuDe: tieuDe, tacGia: tacGia };
}

function hienThiDanhSach(danhSach) {
    if (danhSach.length === 0) { 
        resultsDiv.innerHTML = "<div class='list-item'><div class='item-info'><p>Không tìm thấy bài hát nào phù hợp.</p></div></div>"; 
        return; 
    }
    let htmlOutput = '<div class="group-header">Kết quả tìm kiếm phù hợp</div>'; 
    htmlOutput += danhSach.map((bai) => {
        let tenTacGia = bai.tacGia ? bai.tacGia.trim() : "Khuyết danh"; 
        return `
            <div class="list-item" id="item-${bai.id}" onclick="xemChiTiet('${bai.id}')">
                <div class="item-id">${bai.id}</div>
                <div class="item-info">
                    <div class="item-title">${bai.tieuDe}</div>
                    <div class="item-meta"><span class="badge-match">Tác giả: ${tenTacGia}</span></div>
                </div>
                <div class="view-icon">📄</div>
            </div>
        `;
    }).join(''); 
    resultsDiv.innerHTML = htmlOutput; 
}

window.xemChiTiet = function(id) {
    if (!duLieuHeThong) return; 
    
    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active')); 
    const activeItem = document.getElementById("item-" + id); 
    if (activeItem) activeItem.classList.add('active'); 

    const tieuDeBai = activeItem.querySelector('.item-title').innerText; 
    const textNhanXanh = activeItem.querySelector('.badge-match').innerText; 
    const tacGiaBai = textNhanXanh.replace('Tác giả:', '').trim(); 

    const khoiVanBanWord = duLieuHeThong.thuVienNoiDung[id]; 
    let loiBaiHat = ""; 
    if (khoiVanBanWord) { 
        const lines = khoiVanBanWord.split('\n'); 
        loiBaiHat = lines.slice(1).join('\n').trim(); 
    }

    document.getElementById('no-data').style.display = 'none'; 
    document.getElementById('has-data').style.display = 'block'; 

    let linkTudongDrive = "";
    if (duLieuHeThong.thuVienLink && duLieuHeThong.thuVienLink[id]) {
        linkTudongDrive = duLieuHeThong.thuVienLink[id];
    } else {
        const cauLenhLocTho = "name = '" + id + ". xxx.pdf'"; 
        linkTudongDrive = "https://google.com" + ID_THU_MUC_DRIVE_CUONG + "?q=" + encodeURIComponent(cauLenhLocTho);
    }

    const titleEl = document.getElementById('detail-title'); 
    titleEl.innerHTML = '<a href="' + linkTudongDrive + '" target="_blank" style="color: #007bff !important; text-decoration: underline !important; cursor: pointer !important; font-weight: bold; font-size: 26px; display: inline-block;">' + tieuDeBai + ' (Xem PDF 🖨️)</a>'; 
    
    document.getElementById('detail-author').innerText = "Tác giả: " + tacGiaBai; 
    
    const detailContentEl = document.getElementById('detail-content'); 
    detailContentEl.innerText = loiBaiHat; 
    detailContentEl.style.fontSize = coChuHienTai + "px"; 
}

window.thayDoiCoChu = function(giaTri) {
    coChuHienTai += giaTri;
    if (coChuHienTai < 12) coChuHienTai = 12; 
    if (coChuHienTai > 40) coChuHienTai = 40; 
    
    const detailContentEl = document.getElementById('detail-content');
    if (detailContentEl) {
        detailContentEl.style.fontSize = coChuHienTai + "px";
    }
}
