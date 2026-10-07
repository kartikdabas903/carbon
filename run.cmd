@echo off
rem Runs the whole project from Command Prompt or a double-click. Options: -Reload -NoBrowser
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" %*
