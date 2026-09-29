const { pool } = require("../../db/pool");
const { postFixedAssetPurchased, postDepreciationRun, postAssetDisposal } = require("../journals/postingRules");

async function list(tenantId) {
  const { rows } = await pool.query(
    "SELECT * FROM fixed_assets WHERE tenant_id = $1 ORDER BY purchase_date DESC, id DESC",
    [tenantId]
  );
  return rows;
}

async function create(tenantId, { name, category, purchaseDate, cost, usefulLifeYears, salvageValue }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO fixed_assets (tenant_id, name, category, purchase_date, cost, useful_life_years, salvage_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, name, category || null, purchaseDate, cost, usefulLifeYears, salvageValue || 0]
    );

    await postFixedAssetPurchased(client, { tenantId, assetId: rows[0].id, date: purchaseDate, cost }, userId);

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Straight-line, one month's worth per run — a tenant runs this monthly (or
// whenever they like) rather than the system guessing a schedule for them.
async function runDepreciation(tenantId, id, { date }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM fixed_assets WHERE tenant_id = $1 AND id = $2 AND disposed_at IS NULL FOR UPDATE",
      [tenantId, id]
    );
    if (!rows[0]) throw Object.assign(new Error("Asset not found or already disposed"), { status: 404 });

    const asset = rows[0];
    const depreciableBase = Number(asset.cost) - Number(asset.salvage_value);
    const monthlyAmount = Math.round((depreciableBase / Number(asset.useful_life_years) / 12) * 100) / 100;
    const remainingBase = depreciableBase - Number(asset.accumulated_depreciation);
    const amount = Math.min(monthlyAmount, Math.max(remainingBase, 0));

    if (amount <= 0) {
      await client.query("COMMIT");
      return asset;
    }

    await postDepreciationRun(client, { tenantId, assetId: id, date, amount }, userId);

    const updated = await client.query(
      `UPDATE fixed_assets SET accumulated_depreciation = accumulated_depreciation + $1 WHERE id = $2 RETURNING *`,
      [amount, id]
    );
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function dispose(tenantId, id, { date, proceeds }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM fixed_assets WHERE tenant_id = $1 AND id = $2 AND disposed_at IS NULL FOR UPDATE",
      [tenantId, id]
    );
    if (!rows[0]) throw Object.assign(new Error("Asset not found or already disposed"), { status: 404 });

    const asset = rows[0];
    await postAssetDisposal(
      client,
      {
        tenantId,
        assetId: id,
        date,
        cost: Number(asset.cost),
        accumulatedDepreciation: Number(asset.accumulated_depreciation),
        proceeds: Number(proceeds),
      },
      userId
    );

    const updated = await client.query(
      `UPDATE fixed_assets SET disposed_at = $1, disposal_proceeds = $2 WHERE id = $3 RETURNING *`,
      [date, proceeds, id]
    );
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { list, create, runDepreciation, dispose };
