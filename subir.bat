@echo off
echo [AUTO-UPDATE] Iniciando sincronizacao...
git add .
git commit -m "Update automatico: %date% %time%"
git push origin master
echo.
echo [SUCESSO] Seus arquivos ja estao no GitHub!
pause
