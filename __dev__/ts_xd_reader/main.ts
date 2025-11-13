import AdmZip from 'adm-zip';

// 讀取 ZIP 檔案
const zip = new AdmZip('./__xd__/fork.zip');

// // 列出所有檔案
// const zipEntries = zip.getEntries();
// zipEntries.forEach((entry) => {
//   console.log(entry.entryName) // 檔案路徑
// });

const fileContent = zip.readAsText('resources/graphics/graphicContent.agc')

const xdAssets = JSON.parse(fileContent) as Record<string, any>
const assetsNameList = xdAssets.resources.meta.ux.documentLibrary.elements.map((e: any) => e.name).sort((a: any, b: any)=> {
    // 提取編號部分，移除前面的 "xxx號色"
    const regex = /([a-zA-Z]+)(\d+)/;

    const matchA = a.match(regex);
    const matchB = b.match(regex);

    if (!matchA || !matchB) {
      return a.localeCompare(b); // Fallback to normal string compare
    }

    const [_, prefixA, numA] = matchA; // 分為前綴與數字
    const [__, prefixB, numB] = matchB;

    if (prefixA !== prefixB) {
      // 比較字母前綴
      return prefixA.localeCompare(prefixB);
    }

    // 比較數字部分
    return parseInt(numA, 10) - parseInt(numB, 10);
  }
)
console.log(assetsNameList)

// // 讀取特定檔案內容
// const fileContent = zip.readAsText('folder/file.txt');
// console.log(fileContent);
//
// // 修改檔案內容
// zip.updateFile('folder/file.txt', Buffer.from('新的內容'));
//
// // 新增檔案
// zip.addFile('new-file.txt', Buffer.from('檔案內容'));
//
// // 刪除檔案
// zip.deleteFile('folder/old-file.txt');
//
// // 儲存修改後的 ZIP
// zip.writeZip('./modified.zip');