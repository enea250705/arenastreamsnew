$files = Get-ChildItem views/*.html
foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    
    # Remove all ad scripts
    $content = $content -replace "(?s)<!-- Provider script.*?}\);\s*</script>", "<!-- Provider script removed -->"
    $content = $content -replace "(?s)<script.*?x7i0\.com.*?</script>", ""
    $content = $content -replace "(?s)<script.*?bvtpk\.com.*?</script>", ""
    $content = $content -replace "(?s)<script.*?extroverted-shine\.com.*?</script>", ""
    $content = $content -replace "(?s)<script.*?vignette\.min\.js.*?</script>", ""
    $content = $content -replace "(?s)<!-- Ad Zone Script -->", ""
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Cleaned: $($file.Name)"
}
Write-Host "Done! All ad scripts removed."
