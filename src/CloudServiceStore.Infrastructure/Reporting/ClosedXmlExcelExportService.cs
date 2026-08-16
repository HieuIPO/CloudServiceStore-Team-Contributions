using ClosedXML.Excel;
using CloudServiceStore.Application.Reporting;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Infrastructure.Reporting;

public sealed class ClosedXmlExcelExportService : IExcelExportService
{
    private const int TitleRow = 1;
    private const int SubtitleRow = 2;
    private const int HeaderRow = 4;
    private const int FirstDataRow = HeaderRow + 1;
    private const int ColumnCount = 15;
    private const int StatusColumn = 14;

    public byte[] CreateOrderWorkbook(IReadOnlyList<OrderExportRow> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Order Requests");

        sheet.ShowGridLines = false;

        var titleRange = sheet.Range(TitleRow, 1, TitleRow, ColumnCount);
        titleRange.Merge();
        sheet.Cell(TitleRow, 1).Value = "DANH SÁCH YÊU CẦU ĐẶT DỊCH VỤ";
        titleRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#0f3b67");
        titleRange.Style.Font.FontColor = XLColor.White;
        titleRange.Style.Font.Bold = true;
        titleRange.Style.Font.FontSize = 16;
        titleRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        titleRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

        var subtitleRange = sheet.Range(SubtitleRow, 1, SubtitleRow, ColumnCount);
        subtitleRange.Merge();
        sheet.Cell(SubtitleRow, 1).Value = $"CloudServiceStore • {rows.Count} yêu cầu • Sắp xếp mới nhất trước";
        subtitleRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#eaf3ff");
        subtitleRange.Style.Font.FontColor = XLColor.FromHtml("#315477");
        subtitleRange.Style.Font.FontSize = 10;
        subtitleRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        subtitleRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

        sheet.Row(TitleRow).Height = 30;
        sheet.Row(SubtitleRow).Height = 22;
        sheet.Row(3).Height = 8;

        var headers = new[]
        {
            "STT", "Mã yêu cầu", "Ngày tạo", "Khách hàng", "Email", "Điện thoại", "Công ty", "Gói dịch vụ",
            "Chu kỳ", "Giá gốc", "Giá báo", "Tiền tệ", "Khuyến mãi", "Trạng thái", "Ghi chú"
        };
        for (var column = 0; column < headers.Length; column++)
        {
            sheet.Cell(HeaderRow, column + 1).Value = headers[column];
        }

        var headerRange = sheet.Range(HeaderRow, 1, HeaderRow, ColumnCount);
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#0f172a");
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        headerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        headerRange.Style.Alignment.WrapText = true;
        headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
        headerRange.Style.Border.BottomBorderColor = XLColor.FromHtml("#2563eb");
        sheet.Row(HeaderRow).Height = 28;

        for (var index = 0; index < rows.Count; index++)
        {
            var row = rows[index];
            var line = FirstDataRow + index;

            sheet.Cell(line, 1).Value = index + 1;
            sheet.Cell(line, 2).Value = row.Id.ToString();
            sheet.Cell(line, 3).Value = row.CreatedAt.UtcDateTime;
            sheet.Cell(line, 4).Value = row.CustomerName;
            sheet.Cell(line, 5).Value = row.Email;
            sheet.Cell(line, 6).Value = row.PhoneNumber;
            sheet.Cell(line, 7).Value = row.CompanyName ?? string.Empty;
            sheet.Cell(line, 8).Value = row.PlanName;
            sheet.Cell(line, 9).Value = FormatBillingCycle(row.BillingCycle);
            sheet.Cell(line, 10).Value = row.OriginalAmount;
            sheet.Cell(line, 11).Value = row.QuotedAmount;
            sheet.Cell(line, 12).Value = row.Currency;
            sheet.Cell(line, 13).Value = row.PromotionCode ?? string.Empty;
            sheet.Cell(line, StatusColumn).Value = FormatStatus(row.Status);
            sheet.Cell(line, 15).Value = row.Note ?? string.Empty;

            if (index % 2 == 1)
            {
                sheet.Range(line, 1, line, ColumnCount).Style.Fill.BackgroundColor = XLColor.FromHtml("#f8fafc");
            }

            sheet.Range(line, 1, line, ColumnCount).Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            sheet.Range(line, 1, line, ColumnCount).Style.Border.BottomBorderColor = XLColor.FromHtml("#e2e8f0");
            sheet.Range(line, 1, line, ColumnCount).Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            sheet.Cell(line, StatusColumn).Style.Font.Bold = true;
            ApplyStatusStyle(sheet.Cell(line, StatusColumn), row.Status);
            sheet.Row(line).Height = 24;
        }

        var lastRow = Math.Max(HeaderRow, HeaderRow + rows.Count);
        sheet.Range(HeaderRow, 1, lastRow, ColumnCount).SetAutoFilter();
        sheet.SheetView.FreezeRows(HeaderRow);

        if (rows.Count > 0)
        {
            var dataLastRow = FirstDataRow + rows.Count - 1;
            sheet.Range(FirstDataRow, 3, dataLastRow, 3).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
            sheet.Range(FirstDataRow, 10, dataLastRow, 11).Style.NumberFormat.Format = "#,##0";
            sheet.Range(FirstDataRow, 1, dataLastRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Range(FirstDataRow, 3, dataLastRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Range(FirstDataRow, 9, dataLastRow, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Range(FirstDataRow, 10, dataLastRow, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            sheet.Range(FirstDataRow, 12, dataLastRow, 14).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Range(FirstDataRow, 15, dataLastRow, 15).Style.Alignment.WrapText = true;
        }

        var widths = new[] { 7d, 38d, 18d, 24d, 28d, 16d, 20d, 34d, 14d, 16d, 16d, 10d, 15d, 15d, 36d };
        for (var column = 0; column < widths.Length; column++)
        {
            sheet.Column(column + 1).Width = widths[column];
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string FormatBillingCycle(BillingCycle billingCycle) => billingCycle switch
    {
        BillingCycle.Monthly => "Theo tháng",
        BillingCycle.Yearly => "Theo năm",
        _ => billingCycle.ToString()
    };

    private static string FormatStatus(OrderRequestStatus status) => status switch
    {
        OrderRequestStatus.Pending => "Chờ xử lý",
        OrderRequestStatus.Contacted => "Đã liên hệ",
        OrderRequestStatus.Approved => "Đã duyệt",
        OrderRequestStatus.Rejected => "Từ chối",
        OrderRequestStatus.Cancelled => "Đã hủy",
        _ => status.ToString()
    };

    private static void ApplyStatusStyle(IXLCell cell, OrderRequestStatus status)
    {
        var (background, foreground) = status switch
        {
            OrderRequestStatus.Pending => ("#fef3c7", "#92400e"),
            OrderRequestStatus.Contacted => ("#dbeafe", "#1d4ed8"),
            OrderRequestStatus.Approved => ("#dcfce7", "#166534"),
            OrderRequestStatus.Rejected => ("#fee2e2", "#b91c1c"),
            OrderRequestStatus.Cancelled => ("#e5e7eb", "#374151"),
            _ => ("#f1f5f9", "#334155")
        };

        cell.Style.Fill.BackgroundColor = XLColor.FromHtml(background);
        cell.Style.Font.FontColor = XLColor.FromHtml(foreground);
    }
}
