@echo off
echo Cleaning Expo/Metro cache...

REM Kill any running Metro bundler
taskkill /F /IM node.exe 2>nul

REM Clear Metro bundler cache
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Cache cleared!
echo.
echo Starting Expo with clean cache...
echo.

npx expo start -c --web
