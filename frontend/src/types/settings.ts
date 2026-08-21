export interface WorkshopProfile {
  workshopName: string;
  ownerName: string;
  gstNumber: string;
  address: string;
  phone: string;
  invoiceFooter: string;
  /** Data URL (base64) of an uploaded logo image. Undefined = use the letter placeholder on invoices. */
  logoDataUrl?: string;
}
