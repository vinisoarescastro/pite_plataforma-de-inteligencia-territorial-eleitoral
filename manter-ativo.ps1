Add-Type @"
using System;
using System.Runtime.InteropServices;

public class SleepPreventer {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint esFlags);

    public const uint ES_CONTINUOUS       = 0x80000000;
    public const uint ES_SYSTEM_REQUIRED  = 0x00000001;
    public const uint ES_DISPLAY_REQUIRED = 0x00000002;
}
"@

# Mantém sistema e tela ativos (impede hibernação e desligamento do monitor)
[SleepPreventer]::SetThreadExecutionState(
    [SleepPreventer]::ES_CONTINUOUS -bor
    [SleepPreventer]::ES_SYSTEM_REQUIRED -bor
    [SleepPreventer]::ES_DISPLAY_REQUIRED
) | Out-Null

Write-Host "Sistema mantido ativo. Pressione Ctrl+C para liberar."

try {
    while ($true) {
        Write-Host "Ativo em $(Get-Date -Format 'HH:mm:ss')"
        Start-Sleep -Seconds 60
    }
} finally {
    # Ao encerrar (Ctrl+C), remove o bloqueio
    [SleepPreventer]::SetThreadExecutionState([SleepPreventer]::ES_CONTINUOUS) | Out-Null
    Write-Host "Bloqueio removido. Sistema pode hibernar normalmente."
}
