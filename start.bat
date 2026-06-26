@echo off
title Policy & Compliance Q&A — PI Partners

:: ── Check Python ────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed.
    echo Download it from https://www.python.org/downloads/
    pause
    exit /b
)

:: ── First-time setup: create .env if missing ────────────────
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo.
    echo First-time setup:
    echo Open the .env file in this folder and replace "your-key-here"
    echo with your Anthropic API key, then run this file again.
    echo.
    start notepad .env
    pause
    exit /b
)

:: ── Check API key is filled in ───────────────────────────────
findstr /c:"your-key-here" .env >nul
if not errorlevel 1 (
    echo.
    echo Your API key is not set yet.
    echo Open the .env file and replace "your-key-here" with your key.
    echo.
    start notepad .env
    pause
    exit /b
)

:: ── Install dependencies (silent after first run) ───────────
echo Installing / checking dependencies...
python -m pip install -r requirements.txt -q

:: ── Open browser after short delay ──────────────────────────
echo.
echo Starting server — opening browser in 3 seconds...
echo Press Ctrl+C in this window to stop.
echo.
start "" cmd /c "timeout /t 3 >nul && start http://localhost:8080"

:: ── Run server ───────────────────────────────────────────────
python -m uvicorn server:app --port 8080
pause
