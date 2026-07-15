import { sequelize } from "../models/index.js";
import { Category, Part, StockMovement } from "../models/index.js";

const categories = [
  { name: "Brakes", description: "Brake components and safety parts" },
  { name: "Engine", description: "Engine maintenance and performance parts" },
  { name: "Electrical", description: "Electrical systems and accessories" },
];

const parts = [
  {
    name: "Brake Pads",
    description: "Front brake pads for passenger vehicles",
    category: "Brakes",
    unit_price: 45.5,
    movements: [
      { type: "IN", quantity: 50, reason: "Initial stock" },
      { type: "OUT", quantity: 5, reason: "Repair order" },
      { type: "OUT", quantity: 3, reason: "Damaged units" },
    ],
  },
  {
    name: "Disc Rotor",
    description: "Slotted disc rotor",
    category: "Brakes",
    unit_price: 62.0,
    movements: [
      { type: "IN", quantity: 20, reason: "Supplier delivery" },
      { type: "OUT", quantity: 4, reason: "Customer replacement" },
    ],
  },
  {
    name: "Caliper Kit",
    description: "Complete caliper kit",
    category: "Brakes",
    unit_price: 120.0,
    movements: [{ type: "IN", quantity: 10, reason: "Initial stock" }],
  },
  {
    name: "Brake Fluid",
    description: "High-performance brake fluid",
    category: "Brakes",
    unit_price: 12.75,
    movements: [],
  },
  {
    name: "Handbrake Cable",
    description: "Replacement handbrake cable",
    category: "Brakes",
    unit_price: 22.0,
    movements: [
      { type: "IN", quantity: 8, reason: "Restock" },
      { type: "OUT", quantity: 2, reason: "Workshop use" },
    ],
  },
  {
    name: "Engine Oil Filter",
    description: "Spin-on engine oil filter",
    category: "Engine",
    unit_price: 8.25,
    movements: [],
  },
  {
    name: "Spark Plug",
    description: "Iridium spark plug",
    category: "Engine",
    unit_price: 5.5,
    movements: [
      { type: "IN", quantity: 30, reason: "Bulk purchase" },
      { type: "OUT", quantity: 8, reason: "Service job" },
    ],
  },
  {
    name: "Timing Belt Kit",
    description: "Timing belt replacement kit",
    category: "Engine",
    unit_price: 85.0,
    movements: [],
  },
  {
    name: "Air Filter",
    description: "High-flow air filter",
    category: "Engine",
    unit_price: 18.0,
    movements: [
      { type: "IN", quantity: 15, reason: "Supplier delivery" },
      { type: "OUT", quantity: 3, reason: "Maintenance" },
    ],
  },
  {
    name: "Radiator Cap",
    description: "Pressure radiator cap",
    category: "Engine",
    unit_price: 16.5,
    movements: [],
  },
  {
    name: "Battery",
    description: "12V automotive battery",
    category: "Electrical",
    unit_price: 130.0,
    movements: [
      { type: "IN", quantity: 25, reason: "Initial stock" },
      { type: "OUT", quantity: 2, reason: "Vehicle install" },
    ],
  },
  {
    name: "Alternator",
    description: "Replacement alternator",
    category: "Electrical",
    unit_price: 210.0,
    movements: [],
  },
  {
    name: "Headlight Bulb",
    description: "Halogen headlight bulb",
    category: "Electrical",
    unit_price: 9.5,
    movements: [
      { type: "IN", quantity: 40, reason: "Restock" },
      { type: "OUT", quantity: 5, reason: "Sold retail" },
    ],
  },
  {
    name: "Fuse Box",
    description: "Compact fuse distribution box",
    category: "Electrical",
    unit_price: 35.0,
    movements: [],
  },
  {
    name: "Sensor Module",
    description: "Engine sensor module",
    category: "Electrical",
    unit_price: 74.0,
    movements: [
      { type: "IN", quantity: 12, reason: "Supplier delivery" },
      { type: "OUT", quantity: 1, reason: "Diagnostic use" },
    ],
  },
];

function getRandomDateLastMonth() {
  const now = new Date();
  // Random time within the last 30 days
  const past = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  return past;
}

async function seedDatabase() {
  try {
    await sequelize.transaction(async (t) => {
      const categoryIds = new Map();

      for (const category of categories) {
        const [cat] = await Category.upsert(
          { name: category.name, description: category.description },
          { transaction: t, returning: true }
        );
        categoryIds.set(category.name, cat.id);
      }

      for (const part of parts) {
        const categoryId = categoryIds.get(part.category);
        const partDate = getRandomDateLastMonth();

        const [dbPart, created] = await Part.upsert(
          {
            name: part.name,
            description: part.description,
            category_id: categoryId,
            quantity: 0,
            unit_price: part.unit_price,
            created_at: partDate,
            updated_at: partDate,
          },
          { transaction: t, returning: true }
        );

        let currentQuantity = 0;

        for (const movement of part.movements) {
          const movementDate = new Date(
            partDate.getTime() + Math.random() * (Date.now() - partDate.getTime())
          );
          await StockMovement.create(
            {
              part_id: dbPart.id,
              movement_type: movement.type,
              quantity: movement.quantity,
              reason: movement.reason,
              unit_price: part.unit_price,
              movement_date: movementDate,
            },
            { transaction: t }
          );

          currentQuantity +=
            movement.type === "IN" ? movement.quantity : -movement.quantity;
        }

        await dbPart.update({ quantity: currentQuantity }, { transaction: t });
      }
    });

    console.log("Database seeded successfully with 3 categories and 15 parts.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
