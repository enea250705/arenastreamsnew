@echo off
echo ========================================
echo    Push Homepage Fix to GitHub
echo ========================================
echo.

cd /d "C:\Users\eneam\Downloads\arenastreams100-2"

echo Checking if Git is installed...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed or not in PATH.
    echo Please install Git from: https://git-scm.com/download/win
    echo Or use GitHub web interface to upload the file.
    pause
    exit /b 1
)

echo Git found! Continuing...
echo.

echo Step 1: Initialize git repository...
git init

echo.
echo Step 2: Add the fixed homepage.html file...
git add views/homepage.html

echo.
echo Step 3: Create a commit...
git commit -m "Fix homepage HTML structure - add missing closing tags"

echo.
echo Step 4: Connect to GitHub repository...
git remote add origin https://github.com/enea250705/arenastreams100.git

echo.
echo Step 5: Setting branch to main...
git branch -M main

echo.
echo Step 6: Push to GitHub...
echo Enter your GitHub username and password when prompted.
git push -u origin main

echo.
echo ========================================
echo Done! Check https://github.com/enea250705/arenastreams100
echo ========================================
pause

