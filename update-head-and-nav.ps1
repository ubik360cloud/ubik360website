$root = 'c:\Users\jmvil\Downloads\ubik360-website-complete\ubik360-website'
$files = Get-ChildItem -Path $root -Recurse -Filter *.html

$fontRegex = '<link rel="preconnect" href="https://fonts.googleapis.com">\s*<link href="https://fonts.googleapis.com/css2\?family=Inter:[^"]*" rel="stylesheet">'
$fontBlock = @'
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800;900&family=Barlow+Semi+Condensed:wght@500;600;700;800&display=swap" rel="stylesheet">
'@
$styleLine = '  <link rel="stylesheet" href="/assets/css/main.css">'
$comment = '  <!-- Shared head scripts / Google Tag Manager placeholder -->'

$englishNav = @"
      <nav class=\"main-nav\">
        <ul class=\"nav-links\">
          <li><a href=\"/en/\">Home</a></li>
          <li><a href=\"/en/about.html\">About</a></li>
          <li><a href=\"/en/services/marketing-growth.html\">Marketing & Growth</a></li>
          <li><a href=\"/en/services/market-entry.html\">Market Entry</a></li>
          <li><a href=\"/en/case-studies/marketing.html\">Case Studies</a></li>
          <li><a href=\"/en/contact.html\">Contact</a></li>
        </ul>
        <div class=\"lang-toggle\">
          <a href=\"/\">ES</a>
          <a href=\"/en/\" class=\"active\">EN</a>
        </div>
      </nav>
"@

$spanishNav = @"
      <nav class=\"main-nav\">
        <ul class=\"nav-links\">
          <li><a href=\"/\">Inicio</a></li>
          <li><a href=\"/es/about.html\">Acerca de</a></li>
          <li><a href=\"/es/servicios/marketing-crecimiento.html\">Marketing y Crecimiento</a></li>
          <li><a href=\"/es/servicios/entrada-mercado.html\">Entrada a Mercados</a></li>
          <li><a href=\"/es/casos-estudio/marketing.html\">Casos de Éxito</a></li>
          <li><a href=\"/es/contacto.html\">Contacto</a></li>
        </ul>
        <div class=\"lang-toggle\">
          <a href=\"/\" class=\"active\">ES</a>
          <a href=\"/en/\">EN</a>
        </div>
      </nav>
"@

foreach ($file in $files) {
    $text = Get-Content -Raw -Path $file.FullName
    $text = [regex]::Replace($text, $fontRegex, $fontBlock)
    $text = [regex]::Replace($text, '<link rel="stylesheet" href="/assets/css/main.css">', "$styleLine`n$comment")
    $text = $text -replace '<div class="logo-icon"></div>', '<img src="/assets/images/ubik360logo.png" alt="Ubik 360 logo" class="logo-mark" />'
    if ($file.FullName -match '\\en\\') {
        $text = [regex]::Replace($text, '(?s)<nav class="main-nav">.*?</nav>', $englishNav)
    } else {
        $text = [regex]::Replace($text, '(?s)<nav class="main-nav">.*?</nav>', $spanishNav)
    }
    $text = [regex]::Replace($text, '[📊🎯🤝🌎📈🌍📥📅📧📱📍]', '')
    Set-Content -Path $file.FullName -Value $text
}
