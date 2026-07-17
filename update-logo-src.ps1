$files = Get-ChildItem 'c:\Users\jmvil\Downloads\ubik360-website-complete\ubik360-website' -Recurse -Filter *.html
foreach ($file in $files) {
    (Get-Content $file.FullName) -replace '/assets/images/ubik360logo.png', 'https://ubik360.com/assets/images/Ubik%20360%20logo.jpg' | Set-Content $file.FullName
}