const fs = require('node:fs');
const assert = require('node:assert/strict');
const Module = require('node:module');
const root = require('node:path').resolve(__dirname, '..');
const ts = require(root+'/node_modules/typescript');
const XLSX = require(root+'/node_modules/xlsx');
require.extensions['.ts'] = function(module, filename) {
  module.paths.push(...Module._nodeModulePaths(root));
  module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText,filename);
};
const {readEarningsWorkbook,previewImport,suggestMapping,moneyCents,monthFromText} = require(root+'/app/admin/earnings/import-workbook.ts');
function file(sheets,bookType='xlsx',extra={}) {
 const book=XLSX.utils.book_new();Object.assign(book,extra);
 for(const [name,rows] of Object.entries(sheets))XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),name);
 const buffer=XLSX.write(book,{type:'buffer',bookType});
 return readEarningsWorkbook(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength));
}
function parse(sheets) {
 const maps=sheets.map(s=>({...suggestMapping(s,'2026-11'),enabled:true}));
 return previewImport(sheets,maps);
}
for(const format of ['xlsx','xls']) {
 const sheets=file({'November 2026':[['Premier Lounge sales'],[],['Date','Net Sales','Gross Sales'],['01-11-2026',100.10,110],['01-11-2026',50.20,55],['02-11-2026',-10,0],['Grand Total',140.30,165]]},format);
 const result=parse(sheets);
 assert.deepEqual(result.errors,[]);
 assert.equal(result.months[0].totalCents,14030);
 assert.equal(result.months[0].rowCount,3);
 assert.equal(result.months[0].days.length,2);
 assert.equal(result.months[0].days[0].amountCents,15030);
 assert.equal(result.skippedTotals,1);
 console.log('PASS',format,'roundtrip, shifted header, net-sales mapping, refunds, daily aggregation, total row exclusion');
}
let result=parse(file({'All months':[['Date','Revenue'],['2026-09-01',100],['2026-10-01',200],['2026-11-01',300]]}));
assert.deepEqual(result.errors,[]);assert.deepEqual(result.months.map(m=>m.key),['2026-11','2026-10','2026-09']);
console.log('PASS combined file split across three months');
result=parse(file({'September 2026':[['Date','Amount'],['01-09-2026',90]],'October 2026':[['Date','Amount'],['01-10-2026',110]]}));
assert.equal(result.months.length,2);assert.deepEqual(result.errors,[]);
console.log('PASS multiple monthly worksheets');
result=parse(file({'Detail':[['Date','Amount'],['01-11-2026',100]],'Summary':[['Month','Revenue'],['2026-11',100]]}));
assert.ok(result.errors.some(e=>e.includes('more than one selected worksheet')));
console.log('PASS overlapping summary/detail blocked');
result=parse(file({'Month totals':[['Month','Revenue'],['September 2026',100],['2026-10',200]]}));
assert.deepEqual(result.errors,[]);assert.equal(result.months[0].days.length,0);assert.equal(result.months[0].undatedCents,20000);
console.log('PASS month-only data retains monthly grain');
let sheets=file({'Nov-2026':[['Date','Amount'],[1,20],[2,30]]});
result=parse(sheets);assert.equal(result.months[0].days[0].date,'2026-11-01');
console.log('PASS day-number dates use selected month');
sheets=file({'November 2026':[['Service','Revenue'],['Hair',100],['Nails',200],['Total',300]]});
result=parse(sheets);assert.equal(result.months[0].totalCents,30000);assert.equal(result.months[0].days.length,0);assert.equal(result.errors.length,0);
console.log('PASS report without date column uses report month');
result=parse(file({'Dates':[['Date','Amount'],[46327,10],['2026-11-01T22:00:00Z',20]]}));
assert.equal(result.months[0].days[0].date,'2026-11-01');assert.equal(result.months[0].days[1].date,'2026-11-02');
console.log('PASS Excel serial and Phnom Penh timezone');
result=parse(file({'Dates':[['Date','Amount'],[44865,10]]},'xlsx',{Workbook:{WBProps:{date1904:true}}}));
assert.equal(result.months[0].days[0].date,'2026-11-01');
console.log('PASS 1904 Excel date system');
result=parse(file({'Errors':[['Date','Amount'],['31-11-2026',10],['01-11-2026','៛ 4000'],['02-11-2026','#VALUE!']]}));
assert.equal(result.errors.length,4);assert.equal(result.months.length,0);
console.log('PASS invalid dates, wrong currency and formula errors block import');
assert.equal(moneyCents('$1,234.56'),123456);assert.equal(moneyCents('(USD 10.25)'),-1025);assert.equal(moneyCents(0),0);
assert.equal(monthFromText('11-2026'),'2026-11');assert.equal(monthFromText('November-2026'),'2026-11');
const csv=Buffer.from('Date,Revenue\n01-11-2026,12.25\n02-11-2026,20.75\nTotal,33\n');
result=parse(readEarningsWorkbook(csv.buffer.slice(csv.byteOffset,csv.byteOffset+csv.byteLength)));
assert.equal(result.months[0].totalCents,3300);assert.deepEqual(result.errors,[]);
console.log('PASS currency parsing and CSV import');
const book=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([['Date','Amount'],['01-11-2026',0]]);ws.B2={t:'e',v:15,w:'#VALUE!'};XLSX.utils.book_append_sheet(book,ws,'Errors');
const buf=XLSX.write(book,{type:'buffer',bookType:'xlsx'});result=parse(readEarningsWorkbook(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)));
assert.ok(result.errors.some(e=>e.includes('invalid earnings amount')));
console.log('PASS native Excel error cells are not imported as numbers');

// Exact structure and sub-cent values from a HangPopok Revenue by Date export.
const outletSheets = file({'Sheet1':[
 ['Sale Report - Revenue by Date',''],[],
 ['Sale Date: 31/12/2025 20:00:00 - 30/11/2026 19:59:59',''],[],
 ['Date','Main outlet'],
 ['2026/05',6190.525],['2026/06',6307.9],['2026/07',13621.135],
 ['2026/08',12471.235],['2026/09',13409.975],['2026/10',16994.58],
 ['2026/11',1892.625],['TOTAL','']
]});
const outletMapping = suggestMapping(outletSheets[0],'2026-11');
assert.equal(outletMapping.headerRow,4);
assert.equal(outletMapping.dateColumn,0);
assert.equal(outletMapping.amountColumn,1);
result = parse(outletSheets);
assert.deepEqual(result.errors,[]);
assert.equal(result.skippedTotals,1);
assert.equal(result.months.length,7);
const expectedMonthly = {'2026-05':619053,'2026-06':630790,'2026-07':1362114,'2026-08':1247124,'2026-09':1340998,'2026-10':1699458,'2026-11':189263};
for (const month of result.months) {
 assert.equal(month.totalCents,expectedMonthly[month.key],month.key);
 assert.equal(month.undatedCents,month.totalCents);
 assert.equal(month.days.length,0);
}
assert.equal(moneyCents(1.005),101);
assert.equal(moneyCents(10.075),1008);
assert.equal(moneyCents(-10.075),-1008);
assert.throws(()=>moneyCents('(-10.00)'),/invalid earnings amount/);
console.log('PASS HangPopok export: row 5 header, Main outlet mapping, seven monthly totals and exact cent rounding');
console.log('All earnings importer checks passed');
