// Valida .xlsx com o Open XML SDK (Microsoft), nas versões do Office 2007 a Microsoft 365.
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;
int total = 0;
foreach (var arq in args) {
  using var doc = SpreadsheetDocument.Open(arq, false);
  foreach (var ver in new[] { FileFormatVersions.Office2007, FileFormatVersions.Office2016, FileFormatVersions.Microsoft365 }) {
    var v = new OpenXmlValidator(ver);
    var erros = v.Validate(doc).ToList();
    total += erros.Count;
    Console.WriteLine($"{Path.GetFileName(arq)} [{ver}]: {erros.Count} erro(s)");
    foreach (var e in erros.Take(15)) Console.WriteLine($"   {e.Part?.Uri} | {e.Path?.XPath} | {e.Description}");
  }
}
return total == 0 ? 0 : 1;
