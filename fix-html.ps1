$files = @("homepage", "football", "basketball", "tennis", "ufc", "rugby", "baseball", "american-football", "cricket", "hockey", "motor-sports", "match")

$tailwindScript = @'
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#ffcc00',
                        dark: '#1a1a1a',
                        darker: '#0f0f0f'
                    }
                }
            }
        }
    </script>
'@

foreach ($fileBase in $files) {
    $filePath = "views\$fileBase.html"
    if (Test-Path $filePath) {
        Write-Host "Processing: $filePath"
        $content = Get-Content $filePath -Raw
        
        # Add TailwindCSS if missing
        if ($content -notmatch 'tailwindcss\.com') {
            $content = $content -replace '(<!-- TailwindCSS -->)', "`$1`r`n$tailwindScript"
        }
        
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "Fixed: $fileBase.html"
    }
}

Write-Host "Done! All HTML files fixed."

