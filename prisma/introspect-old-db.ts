/**
 * Introspect Old Database — Output to file
 * Usage: npx tsx prisma/introspect-old-db.ts
 */

import mysql from "mysql2/promise";
import { writeFileSync } from "fs";

async function main() {
    const conn = await mysql.createConnection({
        host: "192.168.100.8",
        port: 3306,
        user: "root",
        password: "D0hc00p@2023",
        database: "db_webdohcoop",
    });

    const output: string[] = [];
    const log = (msg: string) => { output.push(msg); };

    log("Connected to db_webdohcoop\n");

    // List all tables with row counts
    const [tables] = await conn.query("SHOW TABLES");
    log("=== ALL TABLES ===");
    for (const row of tables as Record<string, string>[]) {
        const name = Object.values(row)[0];
        const [countResult] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${name}\``);
        const count = (countResult as Record<string, number>[])[0].cnt;
        log(`  ${name.padEnd(35)} ${count} rows`);
    }

    // News table structure
    log("\n=== NEWS TABLE COLUMNS ===");
    const [cols] = await conn.query("DESCRIBE news");
    for (const col of cols as Record<string, string>[]) {
        log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(25)} ${col.Null}`);
    }

    // Get non-blob column names
    const blobTypes = ["longblob", "blob", "mediumblob"];
    const colNames = (cols as Record<string, string>[])
        .filter((c) => !blobTypes.includes(c.Type.toLowerCase()))
        .map((c) => c.Field);

    log("\n=== NEWS SAMPLE (2 rows, text columns only) ===");
    const selectCols = colNames.map((c) => `\`${c}\``).join(", ");
    const [sample] = await conn.query(`SELECT ${selectCols} FROM news ORDER BY Id DESC LIMIT 2`);
    log(JSON.stringify(sample, null, 2));

    // Count
    const [newsCount] = await conn.query("SELECT COUNT(*) as total FROM news");
    log(`\nTotal news: ${(newsCount as Record<string, number>[])[0].total}`);

    // Check if images are stored as blob
    const blobCols = (cols as Record<string, string>[])
        .filter((c) => blobTypes.includes(c.Type.toLowerCase()))
        .map((c) => c.Field);
    if (blobCols.length > 0) {
        log(`\nBlob columns (images stored in DB): ${blobCols.join(", ")}`);
        // Check sizes
        for (const bc of blobCols) {
            const [sizes] = await conn.query(
                `SELECT COUNT(*) as total, SUM(CASE WHEN \`${bc}\` IS NOT NULL AND LENGTH(\`${bc}\`) > 0 THEN 1 ELSE 0 END) as withData FROM news`
            );
            const s = (sizes as Record<string, number>[])[0];
            log(`  ${bc}: ${s.withData}/${s.total} rows have data`);
        }
    }

    await conn.end();

    // Write output
    writeFileSync("prisma/old-db-schema.txt", output.join("\n"), "utf-8");
    console.log("Done! Output written to prisma/old-db-schema.txt");
}

main().catch(console.error);
