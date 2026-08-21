import mongoose from "mongoose";

const workshopProfileSchema = new mongoose.Schema(
  {
    workshopName: {
      type: String,
      required: [true, "Workshop name is required"],
      trim: true,
      default: "Gear & Grease Motor Works",
    },
    ownerName: {
      type: String,
      trim: true,
      default: "S. Vijayakumar",
    },
    gstNumber: {
      type: String,
      trim: true,
      default: "33ABCDE1234F1Z5",
    },
    address: {
      type: String,
      trim: true,
      default: "14 Kamaraj Road, Nagercoil, Tamil Nadu 629001",
    },
    phone: {
      type: String,
      trim: true,
      default: "9843200000",
    },
    invoiceFooter: {
      type: String,
      trim: true,
      default: "Thank you for servicing with us. Parts carry a 30-day workshop warranty. Please retain this invoice for warranty claims.",
    },
    logoDataUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const WorkshopProfile = mongoose.model("WorkshopProfile", workshopProfileSchema);
