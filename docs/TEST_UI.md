# UI Testing Cheat Sheet (Phase 0)

## Run UI

```powershell
Set-Location "$HOME\OneDrive\Desktop\windowsBurpeSuite\src"
python -m http.server 5173
# separate terminal
Start-Process "http://localhost:5173/"
```
