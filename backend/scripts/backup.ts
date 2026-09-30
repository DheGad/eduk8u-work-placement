import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const { VULTR_ACCESS_KEY, VULTR_SECRET_KEY, VULTR_ENDPOINT, VULTR_BUCKET_NAME, VULTR_REGION } = process.env;

if (!VULTR_ACCESS_KEY || !VULTR_SECRET_KEY || !VULTR_ENDPOINT || !VULTR_BUCKET_NAME) {
  console.error("Missing required Vultr Object Storage credentials for backup.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: VULTR_REGION || 'sgp1',
  endpoint: VULTR_ENDPOINT,
  credentials: {
    accessKeyId: VULTR_ACCESS_KEY,
    secretAccessKey: VULTR_SECRET_KEY,
  },
});

const DB_TYPE = process.env.DB_HOST ? "postgres" : "sqlite";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFileName = `eduk8u-backup-${DB_TYPE}-${timestamp}.sql.gz`;
const backupFilePath = path.join(__dirname, backupFileName);

try {
  console.log(`Starting ${DB_TYPE} backup...`);
  
  if (DB_TYPE === "sqlite") {
    // SQLite backup
    execSync(`sqlite3 eduk8u.db ".backup 'eduk8u_temp.db'"`);
    execSync(`gzip -c eduk8u_temp.db > ${backupFilePath}`);
    fs.unlinkSync('eduk8u_temp.db');
  } else {
    // PostgreSQL backup (Requires pg_dump installed)
    const pgUser = process.env.DB_USER || "eduk8u";
    const pgDb = process.env.DB_NAME || "eduk8u_prod";
    const pgHost = process.env.DB_HOST || "localhost";
    const pgPass = process.env.DB_PASSWORD || "";
    
    execSync(`PGPASSWORD="${pgPass}" pg_dump -U ${pgUser} -h ${pgHost} ${pgDb} | gzip > ${backupFilePath}`);
  }

  console.log(`Backup created at ${backupFilePath}`);
  console.log("Uploading to Vultr Object Storage...");

  const fileStream = fs.createReadStream(backupFilePath);
  
  const uploadParams = {
    Bucket: VULTR_BUCKET_NAME,
    Key: `backups/${backupFileName}`,
    Body: fileStream,
  };

  s3Client.send(new PutObjectCommand(uploadParams)).then(() => {
    console.log(`Successfully uploaded backup to Vultr Object Storage: backups/${backupFileName}`);
    fs.unlinkSync(backupFilePath);
    console.log("Cleaned up local backup file.");
  }).catch((err) => {
    console.error("Failed to upload backup to Vultr:", err);
    process.exit(1);
  });

} catch (error) {
  console.error("Backup process failed:", error);
  process.exit(1);
}
