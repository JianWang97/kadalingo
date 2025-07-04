// scripts/afterPack.js
// 仅保留 zh-CN 和 en-US 语言包，移除 Electron 其它 locales

const fs = require('fs');
const path = require('path');

module.exports = async function (context) {
  const appOutDir = context.appOutDir;
  const localesDir = path.join(appOutDir, 'locales');
  if (fs.existsSync(localesDir)) {
    const keep = ['zh-CN.pak', 'en-US.pak'];
    const files = fs.readdirSync(localesDir);
    for (const file of files) {
      if (!keep.includes(file)) {
        fs.unlinkSync(path.join(localesDir, file));
      }
    }
    console.log('afterPack: 已移除多余 Electron 语言包，仅保留 zh-CN/en-US');
  }
};