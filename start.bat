@echo off
title Policy Compliance QA

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
findstr /r "^ANTHROPIC_API_KEY=sk" .env >nul 2>&1
if not errorlevel 1 goto keyfound
findstr /r "^OPENAI_API_KEY=sk" .env >nul 2>&1
if not errorlevel 1 goto keyfound
findstr /r "^GOOGLE_API_KEY=." .env >nul 2>&1
if not errorlevel 1 goto keyfound

echo.
echo Your API key is not set yet.
echo Open the .env file, find your provider line, remove the # from the front,
echo and make sure your key is there.
echo.
start notepad .env
pause
exit /b

:keyfound

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
