// Script to add popup on every click to all HTML pages

const fs = require('fs');
const path = require('path');

const POPUP_SCRIPT = `
    <!-- Click Anywhere Popup Ad Script -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var clickCount = 0;
        document.addEventListener('click', function(e) {
            clickCount++;
            // Every click triggers a popup ad
            if (clickCount % 1 === 0) {
                try {
                    var popup = window.open('https://google.com', '_blank');
                    if (popup) {
                        popup.blur();
                        window.focus();
                    }
                } catch(err) {
                    console.log('Popup blocked');
                }
            }
        });
    });
    </script>`;

const VIEWS_DIR = './views';

// Get all HTML files in views directory
const files = fs.readdirSync(VIEWS_DIR).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(VIEWS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if popup script already exists
    if (content.includes('Click Anywhere Popup Ad Script')) {
        console.log(`⏭️  ${file} already has popup script`);
        return;
    }
    
    // Find the position after the ad script
    const adScriptPos = content.indexOf('/*]]>/* */\n</script>');
    
    if (adScriptPos !== -1) {
        // Insert popup script after ad script
        const insertPos = adScriptPos + 12; // length of '/*]]>/* */\n</script>'
        content = content.slice(0, insertPos) + POPUP_SCRIPT + '\n' + content.slice(insertPos);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added popup script to ${file}`);
    } else {
        console.log(`⚠️  Could not find ad script position in ${file}`);
    }
});

console.log('\n✨ Done! Popup script added to all pages');

