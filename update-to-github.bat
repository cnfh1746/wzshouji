@echo off
chcp 65001 > nul
title=GitHub ���ٸ��½ű�

echo ==================================================
echo      ���ڿ�ʼ���޸ĸ��µ� GitHub �ֿ�...
echo      Ŀ��ֿ�: https://github.com/CNFH1746/wzshouji.git
echo ==================================================
echo.

echo [1/3] �����ݴ������ļ�...
git add .
echo      ���!
echo.

echo [2/3] �����ύ���ظ���...
git commit -m "�ű��Զ������� %DATE% %TIME%"
echo      ���!
echo.

echo [3/3] �������͵� GitHub...
git push origin main
echo.

echo ==================================================
echo      ���в�������ɣ��ֿ��Ѹ��¡�
echo ==================================================
echo.
pause