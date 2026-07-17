$root = 'c:\Users\jmvil\Downloads\ubik360-website-complete\ubik360-website'
$files = Get-ChildItem -Path $root -Recurse -Filter *.html
foreach ($file in $files) {
    $text = Get-Content -Raw -Path $file.FullName
    $updated = $text -replace '\\"', '"'
    if ($updated -ne $text) {
        Set-Content -Path $file.FullName -Value $updated
        Write-Host "Updated $($file.FullName)"
    }
}
