@echo off
:: 设置窗口标题
title=GitHub 快速更新脚本

echo ==================================================
echo      正在开始将修改更新到 GitHub 仓库...
echo      目标仓库: https://github.com/CNFH1746/wzshouji.git
echo ==================================================
echo.

:: 第一步: 添加所有更改到暂存区
echo [1/3] 正在暂存所有文件...
git add .
echo      完成!
echo.

:: 第二步: 提交更改，并自动生成提交信息
echo [2/3] 正在提交本地更改...
git commit -m "脚本自动更新于 %DATE% %TIME%"
echo      完成!
echo.

:: 第三步: 推送到 GitHub 的 main 分支
echo [3/3] 正在推送到 GitHub...
git push origin main
echo.

echo ==================================================
echo      所有操作已完成！仓库已更新。
echo ==================================================
echo.

:: 暂停窗口，以便用户能看到结果
pause