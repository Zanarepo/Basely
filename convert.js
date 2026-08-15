(async () => {
  try {
    const pngToIco = require('png-to-ico').default;
    const fs = require('fs');
    const buf = await pngToIco('public/logo/parzana_icon.png');
    fs.writeFileSync('src/app/favicon.ico', buf);
    console.log('Successfully generated favicon.ico');
  } catch (err) {
    console.error(err);
  }
})();
