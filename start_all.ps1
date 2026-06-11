# 🚀 Temiz Dunya - Startup Script
Write-Host "Starting Temiz Dunya Ecosystem..." -ForegroundColor Cyan

# 1. Start Web Server in a minimized PowerShell window
Write-Host "Launching React Web Server (http://localhost:5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; npm run dev" -WindowStyle Minimized

# 2. Start Flutter Windows Application in a separate PowerShell window
Write-Host "Launching Flutter App (Windows) in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd flutter; flutter run -d windows"
