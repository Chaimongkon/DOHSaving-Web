/**
 * Migrate News from db_webdohcoop → db_dohsaving
 *
 * Old schema:
 *   Id, Title, Details, Image (longblob), ImagePath, File (longblob), PdfPath,
 *   CreateDate, CreateBy, UpdateDate, UpdateBy
 *
 * New schema:
 *   id, title, details, imagePath, pdfPath, category, viewCount,
 *   isPinned, isActive, createdBy, updatedBy, createdAt, updatedAt
 *
 * Strategy:
 *   1. If blob data exists → extract and save to public/uploads/news/
 *   2. If no blob but has path → keep the old path reference
 *   3. Map remaining fields directly
 *
 * Usage: npx tsx prisma/migrate-news.ts
 *        npx tsx prisma/migrate-news.ts --dry-run   (preview only)
 */

import mysql from "mysql2/promise";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
    // Connect to old database
    const oldDb = await mysql.createConnection({
        host: "192.168.100.8",
        port: 3306,
        user: "root",
        password: "D0hc00p@2023",
        database: "db_webdohcoop",
    });

    // Connect to new database
    const newDb = await mysql.createConnection({
        host: "192.168.100.8",
        port: 3306,
        user: "root",
        password: "D0hc00p@2023",
        database: "db_dohsaving",
    });

    console.log("✅ Connected to both databases");

    // Check existing news in new DB
    const [existingCount] = await newDb.query("SELECT COUNT(*) as cnt FROM news");
    const existing = (existingCount as Record<string, number>[])[0].cnt;
    console.log(`📌 New DB already has ${existing} news records`);

    if (existing > 0 && !DRY_RUN) {
        console.log("⚠️  New DB already has news. Skipping duplicates by checking Title + CreateDate.");
    }

    // Fetch all old news (including blobs)
    const [oldNews] = await oldDb.query(
        "SELECT Id, Title, Details, Image, ImagePath, `File`, PdfPath, CreateDate, CreateBy, UpdateDate, UpdateBy FROM news ORDER BY Id ASC"
    );
    const rows = oldNews as Record<string, unknown>[];
    console.log(`📰 Found ${rows.length} news in old DB\n`);

    // Prepare upload directories
    const imgDir = path.join(process.cwd(), "public", "uploads", "news");
    const pdfDir = path.join(process.cwd(), "public", "uploads", "news");
    if (!DRY_RUN) {
        await mkdir(imgDir, { recursive: true });
        await mkdir(pdfDir, { recursive: true });
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
        try {
            const title = (row.Title as string) || "";
            const details = (row.Details as string) || "";
            const createDate = row.CreateDate as Date;
            const createBy = (row.CreateBy as string) || null;
            const updateDate = row.UpdateDate as Date | null;
            const updateBy = (row.UpdateBy as string) || null;

            // Check if already exists in new DB
            if (existing > 0) {
                const [dup] = await newDb.query(
                    "SELECT id FROM news WHERE title = ? AND createdAt = ? LIMIT 1",
                    [title, createDate]
                );
                if ((dup as unknown[]).length > 0) {
                    skipped++;
                    continue;
                }
            }

            // Handle image
            let imagePath: string | null = null;
            const imageBlob = row.Image as Buffer | null;
            const oldImagePath = row.ImagePath as string | null;

            if (imageBlob && imageBlob.length > 0) {
                // Save blob to file
                const ext = detectImageExt(imageBlob) || ".jpg";
                const fileName = `old-${row.Id}${ext}`;
                const filePath = path.join(imgDir, fileName);
                if (!DRY_RUN) {
                    await writeFile(filePath, imageBlob);
                }
                imagePath = `/uploads/news/${fileName}`;
                console.log(`  📷 [${row.Id}] Extracted image blob → ${imagePath} (${(imageBlob.length / 1024).toFixed(0)}KB)`);
            } else if (oldImagePath) {
                // Keep old path reference (might need to copy files separately)
                imagePath = oldImagePath;
                console.log(`  🔗 [${row.Id}] Using old image path: ${oldImagePath}`);
            }

            // Handle PDF
            let pdfPath: string | null = null;
            const fileBlob = row.File as Buffer | null;
            const oldPdfPath = row.PdfPath as string | null;

            if (fileBlob && fileBlob.length > 0) {
                const fileName = `old-${row.Id}.pdf`;
                const filePath = path.join(pdfDir, fileName);
                if (!DRY_RUN) {
                    await writeFile(filePath, fileBlob);
                }
                pdfPath = `/uploads/news/${fileName}`;
                console.log(`  📄 [${row.Id}] Extracted PDF blob → ${pdfPath} (${(fileBlob.length / 1024).toFixed(0)}KB)`);
            } else if (oldPdfPath) {
                pdfPath = oldPdfPath;
                console.log(`  🔗 [${row.Id}] Using old PDF path: ${oldPdfPath}`);
            }

            // Insert into new DB
            if (!DRY_RUN) {
                await newDb.query(
                    `INSERT INTO news (title, details, imagePath, pdfPath, category, viewCount, isPinned, isActive, createdBy, updatedBy, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'general', 0, false, true, ?, ?, ?, ?)`,
                    [
                        title,
                        details,
                        imagePath,
                        pdfPath,
                        createBy,
                        updateBy,
                        createDate,
                        updateDate || createDate,
                    ]
                );
            }

            migrated++;
            if (DRY_RUN) {
                console.log(`  ✅ [DRY] Would migrate: "${title.slice(0, 50)}..." (${createDate})`);
            }
        } catch (err) {
            errors++;
            console.error(`  ❌ Error migrating news Id=${row.Id}:`, err);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`📊 Migration Summary${DRY_RUN ? " (DRY RUN)" : ""}:`);
    console.log(`  ✅ Migrated: ${migrated}`);
    console.log(`  ⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log("=".repeat(50));

    await oldDb.end();
    await newDb.end();
}

function detectImageExt(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return ".jpg";
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return ".png";
    if (buffer[0] === 0x47 && buffer[1] === 0x49) return ".gif";
    if (buffer[0] === 0x52 && buffer[1] === 0x49) return ".webp";
    return ".jpg"; // default
}

main().catch(console.error);
