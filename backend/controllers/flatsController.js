import db from "../config/db.js";

/**
 * ✅ Get all flats
 */
export const getAllFlats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        flat_id, 
        flat_number, 
        owner_name, 
        phone_number, 
        floor, 
        flat_type, 
        ownership_type, 
        maintenance_amount, 
        status
      FROM flats
      ORDER BY flat_number ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching flats:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Get one flat by ID
 */
export const getFlatById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM flats WHERE flat_id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Flat not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching flat:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Add a new flat (supports "Vacant")
 */
export const addFlat = async (req, res) => {
  const {
    flat_number,
    owner_name = "",
    phone_number = "",
    floor = null,
    flat_type = "1BHK",
    ownership_type = "Owned",
    maintenance_amount = 0,
    status = "Active",
  } = req.body;

  // ✅ Allow only "Owned", "Rented", or "Vacant"
  const validOwnership = ["Owned", "Rented", "Vacant"];
  if (!validOwnership.includes(ownership_type)) {
    return res.status(400).json({
      error: `Invalid ownership_type. Must be one of: ${validOwnership.join(", ")}`,
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO flats 
        (flat_number, owner_name, phone_number, floor, flat_type, ownership_type, maintenance_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        flat_number,
        owner_name,
        phone_number,
        floor,
        flat_type,
        ownership_type,
        maintenance_amount,
        status,
      ]
    );

    res
      .status(201)
      .json({ id: result.insertId, message: "Flat added successfully" });
  } catch (err) {
    console.error("❌ Error adding flat:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Update an existing flat
 */
export const updateFlat = async (req, res) => {
  const { id } = req.params;
  const {
    flat_number,
    owner_name,
    phone_number,
    floor,
    flat_type,
    ownership_type,
    maintenance_amount,
    status,
  } = req.body;

  // ✅ Allow only "Owned", "Rented", or "Vacant"
  const validOwnership = ["Owned", "Rented", "Vacant"];
  if (!validOwnership.includes(ownership_type)) {
    return res.status(400).json({
      error: `Invalid ownership_type. Must be one of: ${validOwnership.join(", ")}`,
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE flats SET
         flat_number = ?,
         owner_name = ?,
         phone_number = ?,
         floor = ?,
         flat_type = ?,
         ownership_type = ?,
         maintenance_amount = ?,
         status = ?
       WHERE flat_id = ?`,
      [
        flat_number,
        owner_name,
        phone_number,
        floor,
        flat_type,
        ownership_type,
        maintenance_amount,
        status,
        id,
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Flat not found" });

    res.json({ message: "Flat updated successfully" });
  } catch (err) {
    console.error("❌ Error updating flat:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Delete a flat
 */
export const deleteFlat = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM flats WHERE flat_id = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Flat not found" });
    res.json({ message: "Flat deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting flat:", err);
    res.status(500).json({ error: err.message });
  }
};
