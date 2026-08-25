// Các biến toàn cục lưu trữ dữ liệu thô từ file phục vụ giải thuật
let duLieuTongTxt = "";
let duLieuNoiDungDoc = "";
let thuVienLinkDrive = {};
let debounceTimer;

// Hàm khởi tạo - Nạp dữ liệu từ các file JSON khi tải trang
async function khoiTaoHeThongDuLieu() {
    try {
        // 1. Tải dữ liệu từ file dulieu_goc.json
        const resGoc = await fetch('./dulieu_goc.json');
        const dataGoc = await resGoc.json();
        thuVienLinkDrive = dataGoc.thuVienLink || {};
        
        // Gộp mảng 'danhSachMaTong' thành một chuỗi văn bản lớn
        duLieuTongTxt = dataGoc.danhSachMaTong.join('\n');

        // 2. Tải song song 4 file nội dung lời để dựng lại chuỗi lớn của file noidung.doc gốc
        const tepLoi = ['dulieu_loi_1.json', 'dulieu_loi_2.json', 'dulieu_loi_3.json', 'dulieu_loi_4.json'];
        const mangTai = tepLoi.map(file => fetch(`./${file}`).then(r => r.json()));
        const danhSachKhoiLoi = await Promise.all(mangTai);
        
        const khoLoiTong = Object.assign({}, ...danhSachKhoiLoi);
        
        let buildNoiDungDoc = "";
        for (const [id, noiDungTho] of Object.entries(khoLoiTong)) {
            buildNoiDungDoc += `@${id} ${noiDungTho}\n`;
        }
        duLieuNoiDungDoc = buildNoiDungDoc;

        console.log("⚡ Hệ thống Web Thánh Ca đã nạp dữ liệu siêu tốc thành công!");
    } catch (error) {
        console.error("❌ Lỗi nạp dữ liệu hệ thống:", error);
    }
}

// Hàm chuẩn hóa loại bỏ dấu tiếng Việt (Phục vụ lấy chữ cái đầu)
function xoaDauTiengViet(str) {
    if (!str) return "";
    return str.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/đ/g, "d")
              .replace(/Đ/g, "D")
              .trim();
}

/**
 * GIẢI THUẬT XỬ LÝ TỪ KHÓA ĐẦU VÀO CỦA KHÁCH HÀNG
 */
function xuLyTuKhoaKhachGo(tuKhoaGoc) {
    let chuoiXuLy = tuKhoaGoc.trim();
    if (!chuoiXuLy) return "";

    // Nếu khách gõ có khoảng trắng (Ví dụ: "Chúa không Lầm")
    if (chuoiXuLy.includes(" ")) {
        const chuoiKhongDau = xoaDauTiengViet(chuoiXuLy);
        // Tách từ, lấy chữ cái đầu tiên của từng từ và ghép lại
        chuoiXuLy = chuoiKhongDau
            .split(" ")
            .filter(tu => tu.trim() !== "")
            .map(tu => tu.charAt(0))
            .join(""); // Biến thành "ckl"
    } else {
        // Nếu gõ liền không khoảng trắng, đưa về chữ thường không dấu
        chuoiXuLy = xoaDauTiengViet(chuoiXuLy);
    }

    // Bọc lại thành dạng |ckl| theo đúng giải thuật của bạn
    return `|${chuoiXuLy}|`;
}

/**
 * GIẢI THUẬT TÌM KIẾM TUYỆT ĐỐI - DỪNG LẠI NGAY KHI THẤY KẾT QUẢ
 */
function thucHienTimKiemThanhCa(tuKhoaKhach) {
    if (!tuKhoaKhach.trim()) {
        hienThiDanhSachKetQua([]);
        return;
    }

    // 1. Bọc từ khóa thành dạng |ckl| (Ví dụ: |ckl|)
    const chuoiCklBoc = xuLyTuKhoaKhachGo(tuKhoaKhach);
    const ketQuaTimKiem = [];

    // 2. Tìm kiếm chuỗi bọc |ckl| này trong chuỗi dữ liệu tong.txt
    const viTriCkl = duLieuTongTxt.indexOf(chuoiCklBoc);
    
    // Nếu tìm thấy chuỗi đã bọc trong file tong.txt
    if (viTriCkl !== -1) {
        // Tìm dấu @ ở ngay TRƯỚC vị trí chuỗi |ckl| vừa tìm thấy
        const doanTruoc = duLieuTongTxt.substring(0, viTriCkl);
        const viTriDauAconHopLe = doanTruoc.lastIndexOf('@');

        if (viTriDauAconHopLe !== -1) {
            // Xác định dòng chứa kết quả từ dấu @ đến ký tự xuống dòng gần nhất
            const viTriXuongDong = duLieuTongTxt.indexOf('\n', viTriDauAconHopLe);
            const dongTho = duLieuTongTxt.substring(viTriDauAconHopLe, viTriXuongDong !== -1 ? viTriXuongDong : duLieuTongTxt.length).trim();
            
            // Trích xuất ID nằm ở cuối chuỗi sau dấu | (Ví dụ dòng thô: @ckl|123 hoặc @chuoi|ckl|123)
            const mangPhanTach = dongTho.split('|');
            const idBaiHat = mangPhanTach[mangPhanTach.length - 1].trim();

            if (idBaiHat) {
                // 3. Tìm chuỗi định dạng "@ID " trong noidung.doc (Ví dụ: "@123 ")
                const mocID = `@${idBaiHat} `;
                const viTriIdTrongDoc = duLieuNoiDungDoc.indexOf(mocID);

                if (viTriIdTrongDoc !== -1) {
                    // Cắt đoạn nội dung từ sau chuỗi mốc "@123 "
                    let doanNoiDungBai = duLieuNoiDungDoc.substring(viTriIdTrongDoc + mocID.length);
                    
                    // Giới hạn dữ liệu bài hát cho đến dấu @ của bài hát tiếp theo
                    const viTriBaiTiep = doanNoiDungBai.indexOf('@');
                    if (viTriBaiTiep !== -1) {
                        doanNoiDungBai = doanNoiDungBai.substring(0, viTriBaiTiep);
                    }

                    // 4. Phân tách lấy Tựa bài (kế tiếp mốc ID, kết thúc bằng _) và Tên tác giả (sau dấu _)
                    let tuaBai = "";
                    let tacGia = "Chưa rõ";
                    let loiBaiHat = "";

                    if (doanNoiDungBai.includes('_')) {
                        const phanTachThongTin = doanNoiDungBai.split('_');
                        tuaBai = phanTachThongTin[0].trim(); // Tựa bài ngay sau @123 và trước dấu _
                        
                        // Phần còn lại sau dấu _ chứa tên tác giả ở dòng đầu và lời bài hát ở các dòng dưới
                        const phanConLai = phanTachThongTin[1];
                        const cacDongConLai = phanConLai.split('\n');
                        
                        tacGia = cacDongConLai[0].trim(); // Tên tác giả ngay sau dấu _
                        loiBaiHat = cacDongConLai.slice(1).join('\n').trim(); // Lời bài hát chi tiết
                    } else {
                        const cacDong = doanNoiDungBai.split('\n');
                        tuaBai = cacDong[0].trim();
                        loiBaiHat = cacDong.slice(1).join('\n').trim();
                    }

                    // Đẩy bài hát tìm được vào mảng kết quả duy nhất
                    ketQuaTimKiem.push({
                        id: idBaiHat,
                        tuaBai: tuaBai,
                        tacGia: tacGia,
                        loiBaiHat: loiBaiHat,
                        linkPdf: thuVienLinkDrive[idBaiHat] || null
                    });
                }
            }
        }
        // 🔥 ĐIỂM CỐT LÕI: Ngừng ngay việc tìm kiếm, không quét thêm chuỗi gần đúng hay chạy tiếp vòng lặp!
    }

    // Kết xuất hiển thị kết quả duy nhất ra màn hình
    hienThiDanhSachKetQua(ketQuaTimKiem);
}

/**
 * LẮNG NGHE SỰ KIỆN Ô INPUT VÀ HIỂN THỊ GIAO DIỆN HTML
 */
function onSearchInput(event) {
    const giaTriOInput = event.target.value;
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        thucHienTimKiemThanhCa(giaTriOInput);
    }, 200); 
}

function hienThiDanhSachKetQua(danhSach) {
    const container = document.getElementById("lyric-container");
    if (!container) return;
    
    if (danhSach.length === 0) {
        container.innerHTML = "<p>Chọn một bài hát từ danh sách để xem lời bài hát chi tiết</p>";
        return;
    }
    
    let html = "";
    danhSach.forEach(baiHat => {
        html += `
            <div class="item-bai-hat" style="padding: 12px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="xemChiTietBaiHat('${baiHat.id}')">
                <span style="font-weight: bold; color: #1a0dab; font-size: 1.1em;">${baiHat.tuaBai}</span>
                <span style="color: #555; font-size: 0.9em;"> — Tác giả: ${baiHat.tacGia}</span>
            </div>
        `;
        window[`thanhca_${baiHat.id}`] = baiHat;
    });
    
    container.innerHTML = html;
}

function xemChiTietBaiHat(id) {
    const baiHat = window[`thanhca_${id}`];
    if (baiHat) {
        const container = document.getElementById("lyric-container");
        let nutPdfHtml = baiHat.linkPdf ? `<a href="${baiHat.linkPdf}" target="_blank" style="display:inline-block; margin-left:15px; padding:5px 10px; background:#d9534f; color:#fff; text-decoration:none; border-radius:4px;">📄 XEM FILE PDF</a>` : '';
        
        container.innerHTML = `
            <button onclick="document.getElementById('txt-search').value=''; hienThiDanhSachKetQua([]);" style="margin-bottom: 15px; padding: 5px 10px; cursor: pointer;">⬅ QUAY LẠI</button>
            ${nutPdfHtml}
            <h2 style="color: #b30000; margin-bottom: 5px;">${baiHat.tuaBai}</h2>
            <p style="margin-top: 0; color: #666;"><strong>Tác giả:</strong> ${baiHat.tacGia}</p>
            <hr>
            <pre style="font-size: 18px; line-height: 1.7; font-family: sans-serif; white-space: pre-wrap;">${baiHat.loiBaiHat}</pre>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    khoiTaoHeThongDuLieu();
    
    const oInputSearch = document.getElementById("txt-search") || document.querySelector("input[type='text']");
    if (oInputSearch) {
        oInputSearch.addEventListener("input", onSearchInput);
    }
});
