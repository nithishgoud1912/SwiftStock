import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const generateInvoice = async (
  transactionData: any,
  organizationData: any,
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (organizationData.logoUrl) {
    try {
      // Fetch the image as a blob to bypass jsPDF remote url issues
      const response = await fetch(organizationData.logoUrl);
      const blob = await response.blob();

      // Convert the blob to a base64 Data URL
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Load it into an Image object to get its natural dimensions
      const img = new Image();
      img.src = base64data;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Max dimensions for the logo
      const ratio = Math.min(40 / img.width, 15 / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;

      // Draw at the top right, above the reference number
      doc.addImage(
        img,
        "PNG",
        pageWidth - 14 - newWidth,
        14,
        newWidth,
        newHeight,
      );
    } catch (e) {
      console.error("Failed to load logo", e);
    }
  }

  doc.setFontSize(22);
  doc.text(organizationData.name || "SwiftStock", 14, 25);
  doc.setFontSize(12);
  const addressLines = [
    organizationData.address || "123",
    organizationData.city || "Tech",
    organizationData.contact || "support@example.com",
  ];
  doc.text(addressLines, 14, 32);

  doc.setFontSize(16);
  doc.text("Invoice", pageWidth / 2, 50, { align: "center" });

  doc.setFontSize(12);
  doc.text("Invoice Number: " + transactionData.invoiceNumber, 14, 60);
  doc.text("Invoice Date: " + format(new Date(), "dd/MM/yyyy"), 14, 65);
  const invoiceDate = format(new Date(), "PPp");
  const invoiceNumber = transactionData.id
    ? `INV-${transactionData.id.slice(0, 8).toUpperCase()}`
    : `INV-${Date.now()}`;

  doc.text(`Reference: ${invoiceNumber}`, pageWidth - 14, 32, {
    align: "right",
  });
  doc.text(`Date: ${invoiceDate}`, pageWidth - 14, 37, { align: "right" });
  // Draw a subtle separator line
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(14, 45, pageWidth - 14, 45);
  // ---------------------------------------------------------
  // 3. Middle Section (Transaction Table)
  // ---------------------------------------------------------

  // Prepare Table Data (If it's an array of transactions, map over it. If standalone, make it a single row)
  const isArray = Array.isArray(transactionData);
  const txs = isArray ? transactionData : [transactionData];
  const tableColumn = ["Date", "Product", "SKU", "Action", "Quantity"];
  const tableRows = txs.map((tx: any) => [
    format(new Date(tx.createdAt || new Date()), "MMM d, yyyy"),
    tx.product?.name || "Unknown Product",
    tx.product?.sku || "N/A",
    tx.type === "IN" ? "Stock Added" : "Stock Removed",
    tx.type === "IN" ? `+ ${tx.quantity}` : `- ${tx.quantity}`,
  ]);
  autoTable(doc, {
    startY: 55, // Start table below the header
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    headStyles: {
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: "auto" }, // Product Name takes remaining space
      2: { cellWidth: 30 },
      3: { cellWidth: 35, halign: "center" },
      4: { cellWidth: 25, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [249, 249, 250], // Very subtle gray for readability
    },
  });
  // ---------------------------------------------------------
  // 4. Bottom Section (Footer)
  // ---------------------------------------------------------

  // Get the Y coordinate where the table finished
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text("Thank you for your business.", 14, finalY);
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);

  const footerNote = `Generated automatically via SwiftStock • ${organizationData.name || "Your Company"}`;
  doc.text(footerNote, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, {
    align: "center",
  });
  // ---------------------------------------------------------
  // 5. Output PDF
  // ---------------------------------------------------------
  doc.save(`${invoiceNumber}.pdf`);
};
