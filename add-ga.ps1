$files = Get-ChildItem views/*.html
foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    
    # Add Google Analytics after the provider script comment
    $gaScript = @'
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TM2J2414Z9"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-TM2J2414Z9', {
            page_title: '{{seo.title}}',
            page_location: '{{seo.canonical}}'
        });
    </script>
    
'@
    
    # Insert GA after provider script comment
    if ($content -match '<!-- Provider script removed -->') {
        $content = $content -replace '(<!-- Provider script removed -->)', "`$1`r`n$gaScript"
    }
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Added GA: $($file.Name)"
}
Write-Host "Done! Google Analytics added."

