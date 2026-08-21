import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Customer } from "./models/Customer.js";
import { Vehicle } from "./models/Vehicle.js";
import { InventoryItem } from "./models/InventoryItem.js";
import { JobCard } from "./models/JobCard.js";
import { Bill } from "./models/Bill.js";
import { WorkshopProfile } from "./models/WorkshopProfile.js";
import { connectDB } from "./config/db.js";

export const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Seeding default Admin user...");
      await User.create({
        username: "admin",
        password: "workshop123",
        displayName: "Workshop Admin",
        role: "Admin",
      });
    }

    const workshopCount = await WorkshopProfile.countDocuments();
    if (workshopCount === 0) {
      console.log("Seeding default Workshop Profile...");
      await WorkshopProfile.create({
        workshopName: "Gear & Grease Motor Works",
        ownerName: "S. Vijayakumar",
        gstNumber: "33ABCDE1234F1Z5",
        address: "14 Kamaraj Road, Nagercoil, Tamil Nadu 629001",
        phone: "9843200000",
        invoiceFooter: "Thank you for servicing with us. Parts carry a 30-day workshop warranty. Please retain this invoice for warranty claims.",
      });
    }

    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      console.log("Seeding initial customers, vehicles, inventory, job cards, and bills...");

      const c1 = await Customer.create({
        name: "Arun Kumar",
        phone: "9843211234",
        whatsapp: "9843211234",
        address: "12, Kamaraj Nagar, Nagercoil",
      });

      const c2 = await Customer.create({
        name: "Priya Ramachandran",
        phone: "9976543210",
        whatsapp: "9976543210",
        address: "45 South Car Street, Nagercoil",
      });

      const c3 = await Customer.create({
        name: "Mohammed Ismail",
        phone: "9500112233",
        whatsapp: "9840099887",
        address: "8 Beach Road, Colachel",
      });

      const c4 = await Customer.create({
        name: "Lakshmi Narayanan",
        phone: "9787766554",
        whatsapp: "9787766554",
        address: "3rd Cross, Vadasery",
      });

      const v1 = await Vehicle.create({
        registrationNumber: "TN 74 AB 4521",
        brand: "Honda",
        model: "Activa 6G",
        owner: c1._id,
        engineNumber: "JF50E1234567",
        chassisNumber: "ME4JF509XL1234567",
        odometer: 18420,
      });

      const v2 = await Vehicle.create({
        registrationNumber: "TN 74 CD 9012",
        brand: "Royal Enfield",
        model: "Classic 350",
        owner: c1._id,
        engineNumber: "RE350X998812",
        chassisNumber: "ME3RE3509L998812",
        odometer: 9120,
      });

      const v3 = await Vehicle.create({
        registrationNumber: "TN 86 EF 3345",
        brand: "TVS",
        model: "Apache RTR 160",
        owner: c2._id,
        engineNumber: "TV160R445218",
        chassisNumber: "MD6TV160RL445218",
        odometer: 6210,
      });

      const v4 = await Vehicle.create({
        registrationNumber: "TN 86 GH 7788",
        brand: "Bajaj",
        model: "Pulsar NS200",
        owner: c3._id,
        engineNumber: "BJ200N778812",
        chassisNumber: "MD2BJ200NL778812",
        odometer: 24680,
      });

      const i1 = await InventoryItem.create({ name: "Engine oil (1L)", category: "Consumables", quantity: 24, purchasePrice: 320, sellingPrice: 480, lowStockLevel: 10 });
      const i2 = await InventoryItem.create({ name: "Oil filter", category: "Engine", quantity: 18, purchasePrice: 80, sellingPrice: 120, lowStockLevel: 8 });
      const i3 = await InventoryItem.create({ name: "Air filter", category: "Engine", quantity: 6, purchasePrice: 110, sellingPrice: 180, lowStockLevel: 8 });
      const i4 = await InventoryItem.create({ name: "Front brake pads", category: "Brakes", quantity: 5, purchasePrice: 420, sellingPrice: 650, lowStockLevel: 6 });
      const i5 = await InventoryItem.create({ name: "Spark plug", category: "Engine", quantity: 30, purchasePrice: 90, sellingPrice: 150, lowStockLevel: 12 });

      const j1 = await JobCard.create({
        jobCardNumber: "JC-1042",
        vehicle: v1._id,
        customer: c1._id,
        complaint: "Engine making noise while starting, poor pickup",
        inspectionNotes: "Air filter clogged. Spark plug worn. Engine oil overdue.",
        assignedMechanic: "Selvam",
        parts: [
          { inventoryItemId: i1._id, name: i1.name, quantity: 1, unitPrice: 420 },
          { inventoryItemId: i3._id, name: i3.name, quantity: 1, unitPrice: 180 },
          { inventoryItemId: i5._id, name: i5.name, quantity: 1, unitPrice: 150 },
        ],
        labourCost: 300,
        status: "In Progress",
      });

      const j2 = await JobCard.create({
        jobCardNumber: "JC-1041",
        vehicle: v3._id,
        customer: c2._id,
        complaint: "Brakes feel loose",
        inspectionNotes: "Front brake pads worn beyond limit.",
        assignedMechanic: "Karthik",
        parts: [{ inventoryItemId: i4._id, name: i4.name, quantity: 1, unitPrice: 650 }],
        labourCost: 200,
        status: "Pending",
      });

      const j3 = await JobCard.create({
        jobCardNumber: "JC-1040",
        vehicle: v4._id,
        customer: c3._id,
        complaint: "Routine service",
        inspectionNotes: "All systems checked, within normal range.",
        assignedMechanic: "Ravi",
        parts: [
          { inventoryItemId: i1._id, name: i1.name, quantity: 1, unitPrice: 480 },
          { inventoryItemId: i2._id, name: i2.name, quantity: 1, unitPrice: 120 },
        ],
        labourCost: 250,
        status: "Delivered",
      });

      await Bill.create({
        invoiceNumber: "INV-1001",
        jobCard: j3._id,
        jobCardNumber: j3.jobCardNumber,
        customerName: c3.name,
        customerPhone: c3.phone,
        customerAddress: c3.address,
        vehicleRegistration: v4.registrationNumber,
        vehicleBrand: v4.brand,
        vehicleModel: v4.model,
        parts: [
          { inventoryItemId: i1._id, name: i1.name, quantity: 1, unitPrice: 480 },
          { inventoryItemId: i2._id, name: i2.name, quantity: 1, unitPrice: 120 },
        ],
        labourCost: 250,
        discountPercent: 0,
        gstPercent: 18,
        paymentMethod: "UPI",
        status: "Paid",
      });

      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

if (process.argv[2] === "--run") {
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  });
}
