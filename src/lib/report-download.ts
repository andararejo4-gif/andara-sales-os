import {type DailyReport,reportCsv,reportHeaders,reportRows} from '@/lib/daily-report';

export type ReportFormat='pdf'|'xlsx'|'csv';
export async function createReportFile(report:DailyReport,day:string,format:ReportFormat,title='Laporan Harian'):Promise<Blob>{
 if(format==='csv')return new Blob([reportCsv(report)],{type:'text/csv;charset=utf-8'});
 const rows=reportRows(report);
 if(format==='xlsx'){
  const {default:ExcelJS}=await import('exceljs');
  const workbook=new ExcelJS.Workbook();
  workbook.creator='Andara Sales OS';
  const sheet=workbook.addWorksheet('Laporan');
  sheet.addRow([`ANDARA SALES OS — ${title}`,day]);sheet.addRow(reportHeaders);
  rows.forEach(row=>sheet.addRow(row));
  sheet.getRow(2).font={bold:true,name:'Arial'};
  sheet.columns.forEach(column=>{column.width=24;});
  sheet.eachRow(row=>{row.alignment={vertical:'top',wrapText:true};});
  sheet.views=[{state:'frozen',ySplit:2}];
  const buffer=await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 }
 const [{jsPDF},{default:autoTable}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
 const doc=new jsPDF({orientation:'landscape'});
 doc.setFontSize(16);doc.text('ANDARA SALES OS',14,16);doc.setFontSize(10);
 doc.text(`${title} | ${day} (WIB) | ${report.staff.length} staf | ${rows.length} catatan`,14,24);
 autoTable(doc,{head:[reportHeaders],body:rows,startY:30,styles:{fontSize:8,overflow:'linebreak'},theme:'grid',didDrawPage:()=>{doc.setFontSize(8);doc.text(`Andara Sales OS | ${day} | Halaman ${doc.getNumberOfPages()}`,14,doc.internal.pageSize.height-8);}});
 return doc.output('blob');
}
export async function deliverReport(blob:Blob,filename:string){
 const file=new File([blob],filename,{type:blob.type});
 if(matchMedia('(pointer: coarse)').matches&&navigator.canShare?.({files:[file]})){
  try{await navigator.share({files:[file],title:filename});return;}catch(error){if(error instanceof DOMException&&error.name==='AbortError')return;}
 }
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}