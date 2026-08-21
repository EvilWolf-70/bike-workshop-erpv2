import { WorkshopProfile } from "../models/WorkshopProfile.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getOrCreateProfile() {
  let profile = await WorkshopProfile.findOne({});
  if (!profile) {
    profile = await WorkshopProfile.create({
      workshopName: "Gear & Grease Motor Works",
      ownerName: "S. Vijayakumar",
      gstNumber: "33ABCDE1234F1Z5",
      address: "14 Kamaraj Road, Nagercoil, Tamil Nadu 629001",
      phone: "9843200000",
      invoiceFooter:
        "Thank you for servicing with us. Parts carry a 30-day workshop warranty. Please retain this invoice for warranty claims.",
      logoDataUrl: "",
    });
  }
  return profile;
}

export const getWorkshopProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile();
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        workshopName: profile.workshopName,
        ownerName: profile.ownerName,
        gstNumber: profile.gstNumber,
        address: profile.address,
        phone: profile.phone,
        invoiceFooter: profile.invoiceFooter,
        logoDataUrl: profile.logoDataUrl || undefined,
      },
      "Workshop profile fetched successfully"
    )
  );
});

export const updateWorkshopProfile = asyncHandler(async (req, res) => {
  const { workshopName, ownerName, gstNumber, address, phone, invoiceFooter, logoDataUrl } = req.body;

  if (!workshopName || !workshopName.trim()) {
    throw new ApiError(400, "Workshop name is required.");
  }
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length !== 10) {
    throw new ApiError(400, "Enter a valid 10-digit phone number.");
  }

  const profile = await getOrCreateProfile();

  profile.workshopName = workshopName.trim();
  profile.ownerName = (ownerName || "").trim();
  profile.gstNumber = (gstNumber || "").trim();
  profile.address = (address || "").trim();
  profile.phone = (phone || "").trim();
  profile.invoiceFooter = (invoiceFooter || "").trim();
  if (logoDataUrl !== undefined) {
    profile.logoDataUrl = logoDataUrl;
  }

  await profile.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        workshopName: profile.workshopName,
        ownerName: profile.ownerName,
        gstNumber: profile.gstNumber,
        address: profile.address,
        phone: profile.phone,
        invoiceFooter: profile.invoiceFooter,
        logoDataUrl: profile.logoDataUrl || undefined,
      },
      "Workshop profile updated successfully"
    )
  );
});
