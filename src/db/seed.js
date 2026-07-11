import { pool } from "./db.js";

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

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const categoryIds = new Map();

    for (const category of categories) {
      const result = await client.query(
        `INSERT INTO categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id`,
        [category.name, category.description],
      );
      categoryIds.set(category.name, result.rows[0].id);
    }

    for (const part of parts) {
      const categoryId = categoryIds.get(part.category);

      const partResult = await client.query(
        `INSERT INTO parts (name, description, category_id, quantity, unit_price)
         VALUES ($1, $2, $3, 0, $4)
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           category_id = EXCLUDED.category_id,
           unit_price = EXCLUDED.unit_price
         RETURNING id`,
        [part.name, part.description, categoryId, part.unit_price],
      );

      const partId = partResult.rows[0].id;
      let currentQuantity = 0;

      for (const movement of part.movements) {
        await client.query(
          `INSERT INTO stock_movements (part_id, movement_type, quantity, reason)
           VALUES ($1, $2, $3, $4)`,
          [partId, movement.type, movement.quantity, movement.reason],
        );

        currentQuantity +=
          movement.type === "IN" ? movement.quantity : -movement.quantity;
      }

      await client.query(`UPDATE parts SET quantity = $1 WHERE id = $2`, [
        currentQuantity,
        partId,
      ]);
    }

    await client.query("COMMIT");
    console.log("Database seeded successfully with 3 categories and 15 parts.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

seedDatabase();
