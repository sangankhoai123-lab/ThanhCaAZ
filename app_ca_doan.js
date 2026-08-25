let duLieuHeThong = { chuoiMaTong: "", thuVienLink: {}, thuVienNoiDung: {} };
let coChuHienTai = 18; 
const ID_THU_MUC_DRIVE_CUONG = "1tAwDh20k9cJ0bM8OnnoMc63JIOosUZMb"; 

const searchBox = document.getElementById('search-box'); 
const resultsDiv = document.getElementById('results'); 

if (resultsDiv) {
    resultsDiv.innerHTML = "<div id='status-load' style='padding:15px; color:#f39c12; font-weight:bold;'>⏳ HỆ THỐNG: Đang nạp file dữ liệu JSON ngầm...</div>";
}

async function taiCoSoDuLieuNgam() {
    try {
        const resGoc = await fetch('./dulieu_goc.json');
        if (!resGoc.ok) throw new Error("Không tìm thấy file dulieu_goc.json");
        const dataGoc = await resGoc.json();
        
        if (dataGoc) {
            duLieuHeThong.chuoiMaTong = Array.isArray(dataGoc.danhSachMaTong) ? dataGoc.danhSachMaTong.join('') : (dataGoc.danhSachMaTong || "");
            duLieuHeThong.thuVienLink = dataGoc.thuVienLink || {};
        }

        const danhSachFileLoi = ['./dulieu_loi_1.json', './dulieu_loi_2.json', './dulieu_loi_3.json', './dulieu_loi_4.json'];
        for (let i = 0; i < danhSachFileLoi.length; i++) {
            try {
                const resLoi = await fetch(danhSachFileLoi[i]);
                if (resLoi.ok) {
                    const dataLoi = await resLoi.json();
                    duLieuHeThong.thuVienNoiDung = { ...duLieuHeThong.thuVienNoiDung, ...dataLoi };
                }
            } catch (e) {
                console.log("Bỏ qua tệp lời lỗi:", danhSachFileLoi[i]);
            }
        }
        
        const statusEl = document.getElementById('status-load');
        if (statusEl) {
            statusEl.innerHTML = "✅ DỮ LIỆU LÊN MẠNG OK! Hệ thống sẵn sàng tìm kiếm bài hát.";
            statusEl.style.color = "#27ae60";
        }
    } catch (error) {
        console.error("Lỗi nạp dữ liệu:", error);
        const statusEl = document.getElementById('status-load');
        if (statusEl) {
            statusEl.innerHTML = `❌ LỖI LOAD DỮ LIỆU: Không thể đọc file JSON. Chi tiết: ${error.message}`;
            statusEl.style.color = "#c0392b";
        }
    }
}

taiCoSoDuLieuNgam();

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

if (searchBox) {
    searchBox.addEventListener('input', (e) => {
        const keyword = e.target.value; 
        
        if (!keyword.trim()) { 
            resultsDiv.innerHTML = "<div style='padding:15px; color:#27ae60;'>Hệ thống sẵn sàng. Hãy nhập từ khóa!</div>"; 
            return; 
        }

        const chuoiSach = chuanHoaChuoi(keyword); 
        const coKhoangTrang = keyword.trim().includes(" "); 
        const tuKhoaTimKiemChuan = coKhoangTrang ? `|${chuoiSach.replace(/\s+/g, "")}|` : `|${chuoiSach}|`;

        let htmlBaoCaoDebug = `
            <div style="background: #34495e; color: #fff; padding: 12px; margin-bottom: 15px; border-radius: 5px; font-family: monospace; font-size: 13px; border-left: 5px solid #e67e22;">
                ⚙️ <b>MẠCH INPUT HOẠT ĐỘNG OK:</b><br>
                • Chữ đang gõ: <span style="color:#f1c40f; font-weight:bold;">"${keyword}"</span><br>
                • Giải thuật bọc chuỗi: <span style="color:#f1c40f; font-weight:bold;">"${tuKhoaTimKiemChuan}"</span>
            </div>
        `;

        let ketQuaTimKiem = []; 
        const thuVienNoiDung = duLieuHeThong.thuVienNoiDung || {}; 
        const chuoiTongChuan = chuanHoaChuoi(duLieuHeThong.chuoiMaTong);
        
        let viTriTuKhoa = chuoiTongChuan.indexOf(tuKhoaTimKiemChuan);
        let danhSachIdDaQuet = new Set(); 

        if (chuoiTongChuan) {
            while (viTriTuKhoa !== -1) {
                const viTriBatDauCat = Math.max(0, viTriTuKhoa - 40);
                const doanChuoiThoNgan = duLieuHeThong.chuoiMaTong.substring(viTriBatDauCat, viTriTuKhoa + 150);
                
                const viTriAcong = doanChuoiThoNgan.indexOf('@');
                if (viTriAcong !== -1) {
                    const chuoiSauAcong = doanChuoiThoNgan.substring(viTriAcong + 1).trim();
                    const mangSoMatch = chuoiSauAcong.match(/^\d+/);
                    
                    if (mangSoMatch) {
                        const idGocChuan = mangSoMatch[0]; 
                        if (!danhSachIdDaQuet.has(idGocChuan)) {
                            danhSachIdDaQuet.add(idGocChuan);
                            const baiHatGiaoDien = trichXuatTheoDinhDangGoc(idGocChuan, thuVienNoiDung);
                            if (baiHatGiaoDien) {
                                ketQuaTimKiem.push(baiHatGiaoDien);
                            }
                        }
                    }
                }
                if (ketQuaTimKiem.length >= 25) break;
                viTriTuKhoa = chuoiTongChuan.indexOf(tuKhoaTimKiemChuan, viTriTuKhoa + 1);
            }
        }

        hienThiDanhSachMoi(ketQuaTimKiem, htmlBaoCaoDebug); 
    });
}

function trichXuatTheoDinhDangGoc(idGocChuan, thuVienNoiDung) {
    const khoiVanBanWord = thuVienNoiDung[idGocChuan]; 
    if (!khoiVanBanWord) return null; 

    let tieuDe = "Bài hát số " + idGocChuan; 
    let tacGia = "Khuyết danh"; 

    const linesContent = khoiVanBanWord.split('\n'); 
    if (linesContent.length > 0) {
        const firstLine = linesContent[0].trim(); 
        const chuoiDinhDanhGoc = `@${idGocChuan} `; 

        if (firstLine.startsWith(chuoiDinhDanhGoc) || firstLine.includes(chuoiDinhDanhGoc)) {
            const viTriChuoiGoc = firstLine.indexOf(chuoiDinhDanhGoc);
            const dongTieuDeSach = firstLine.substring(viTriChuoiGoc + chuoiDinhDanhGoc.length).trim();
            
            if (dongTieuDeSach.includes('_')) { 
                const mangTach = dongTieuDeSach.split('_'); 
                tieuDe = mangTach[0] ? mangTach[0].trim() : tieuDe; 
                tacGia = mangTach[1] ? mangTach[1].trim() : "Khuyết danh"; 
            } else {
                tieuDe = dongTieuDeSach || tieuDe; 
            }
        } else {
            const dongSach = firstLine.replace(new RegExp(`^@${idGocChuan}\\s*`), '').trim();
            if (dongSach.includes('_')) {
                const mangTach = dongSach.split('_');
                tieuDe = mangTach[0] ? mangTach[0].trim() : tieuDe;
                tacGia = mangTach[1] ? mangTach[1].trim() : tacGia;
            } else {
                tieuDe = dongSach || tieuDe;
            }
        }
    }
    return { id: idGocChuan, tieuDe: tieuDe, tacGia: tacGia };
}

function hienThiDanhSachMoi(danhSach, khungDebugHtml) {
    let htmlOutput = khungDebugHtml;
    if (danhSach.length === 0) { 
        htmlOutput += "<div class='list-item' style='padding: 10px; color: #888;'><p>Mạch gõ chữ tốt. Đang đồng bộ hóa dữ liệu...</p></div>"; 
        resultsDiv.innerHTML = htmlOutput;
        return; 
    }
    htmlOutput += '<div class="group-header" style="font-weight:bold; color:#2c3e50; padding:5px 0; border-bottom:2px solid #3498db; margin-bottom:10px;">Kết quả tìm kiếm phù hợp</div>'; 
    htmlOutput += danhSach.map((bai) => {
        let tenTacGia = bai.tacGia ? bai.tacGia.trim() : "Khuyết danh"; 
        return `
            <div class="list-item" id="item-${bai.id}" onclick="xemChiTiet('${bai.id}')" style="padding:10px; border-bottom:1px solid #eee; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                <div class="item-id">${bai.id}</div>
                <div class="item-info">
                    <div class="item-title" style="font-weight:bold; color:#2980b9;">${bai.tieuDe}</div>
                    <div class="item-meta" style="font-size:12px; color:#7f8c8d;">Tác giả: ${tenTacGia}</div>
                </div>
                <div class="view-icon">📄</div>
            </div>
        `;
    }).join(''); 
    resultsDiv.innerHTML = htmlOutput; 
}

window.xemChiTiet = function(id) {
    if (!duLieuHeThong) return; 
    const activeItem = document.getElementById("item-" + id); 
    const tieuDeBai = activeItem ? activeItem.querySelector('.item-title').innerText : "Bài hát số " + id; 
    const khoiVanBanWord = duLieuHeThong.thuVienNoiDung[id]; 
    let loiBaiHat = ""; 
    let tacGiaBai = "Khuyết danh";

    if (khoiVanBanWord) { 
        const lines = khoiVanBanWord.split('\n'); 
        const firstLine = lines[0].trim();
        const chuoiDinhDanhGoc = `@${id} `;
        let dongTieuDeSach = firstLine;
        if (firstLine.includes(chuoiDinhDanhGoc)) {
            dongTieuDeSach = firstLine.substring(firstLine.indexOf(chuoiDinhDanhGoc) + chuoiDinhDanhGoc.length).trim();
        } else {
            dongTieuDeSach = firstLine.replace(new RegExp(`^@${id}\\s*`), '').trim();
        }
        if (dongTieuDeSach.includes('_')) {
            const mangTach = dongTieuDeSach.split('_');
            tacGiaBai = mangTach[1] ? mangTach[1].trim() : "Khuyết danh";
        }
        loiBaiHat = lines.slice(1).join('\n').trim(); 
    }

    const noDataEl = document.getElementById('no-data');
    const hasDataEl = document.getElementById('has-data');
    if (noDataEl) noDataEl.style.display = 'none'; 
    if (hasDataEl) hasDataEl.style.display = 'block'; 

    let linkTudongDrive = "";
    if (duLieuHeThong.thuVienLink && duLieuHeThong.thuVienLink[id]) {
        linkTudongDrive = duLieuHeThong.thuVienLink[id];
    } else {
        const cauLenhLocTho = "name = '" + id + ". xxx.pdf'"; 
        linkTudongDrive = "https://google.com" + ID_THU_MUC_DRIVE_CUONG + "?q=" + encodeURIComponent(cauLenhLocTho);
    }

    const titleEl = document.getElementById('detail-title'); 
    if (titleEl) titleEl.innerHTML = '<a href="' + linkTudongDrive + '" target="_blank" style="color: #2980b9; text-decoration: underline; font-weight: bold; font-size: 24px;">' + tieuDeBai + ' (Xem PDF 🖨️)</a>'; 
