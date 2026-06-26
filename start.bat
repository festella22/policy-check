@echo off
title Policy Compliance QA

:: ── Check Python ─────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo Python is not installed on this computer.
    echo Download it from: https://www.python.org/downloads/
    echo.
    pause
    exit /b
)

:: ── First-time setup ─────────────────────────────────────────
if not exist ".env" (
    echo.
    echo =========================================
    echo  First-time setup
    echo =========================================
    echo.
    set /p FIRM="Enter your firm name (e.g. PI Partners): "
    echo.
    set /p APIKEY="Paste your API key and press Enter: "
    echo.

    :: Auto-detect provider from key format
    echo !APIKEY! | findstr /b "sk-ant-" >nul 2>&1
    if not errorlevel 1 (
        echo FIRM_NAME=!FIRM!> .env
        echo ANTHROPIC_API_KEY=!APIKEY!>> .env
    ) else (
        echo FIRM_NAME=!FIRM!> .env
        echo OPENAI_API_KEY=!APIKEY!>> .env
    )

    echo Setup complete. Starting...
    echo.
)

:: ── Install dependencies ──────────────────────────────────────
echo Checking dependencies...
python -m pip install -r requirements.txt -q --no-warn-script-location

:: ── Launch ───────────────────────────────────────────────────
echo.
echo Starting — browser will open in a moment.
echo Press Ctrl+C to stop the server.
echo.
start "" cmd /c "timeout /t 3 >nul && start http://localhost:8080"
python -m uvicorn server:app --port 8080
pause
