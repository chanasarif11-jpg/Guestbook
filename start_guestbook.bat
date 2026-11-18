@echo off
title Muhammad Anas - Blockchain Guestbook
echo ===================================================
echo   Muhammad Anas - Blockchain Guestbook DApp
echo   Ethereum Sepolia Testnet
echo ===================================================
echo.
echo Starting local web server at http://localhost:3000...
echo.
start http://localhost:3000
python -m http.server 3000
pause
