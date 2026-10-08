@echo off
rem Stops the CarbonShift development backend and frontend.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
