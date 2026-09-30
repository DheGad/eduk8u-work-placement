import { parse } from 'csv-parse';
import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { logger } from '../config/logger';

export async function importStudentsFromCsv(
  csvContent: string,
  tenantId: string,
  createdBy: string
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    parse(csvContent, { columns: true, skip_empty_lines: true }, async (err, records: any[]) => {
      if (err) return reject(err);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of records) {
        try {
          if (!row.email || !row.first_name || !row.last_name || !row.student_number) {
            throw new Error(`Missing required fields for row: ${JSON.stringify(row)}`);
          }

          // Check email uniqueness
          const existingUser = await db.query<{ id: string }>(
            `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
            [row.email.toLowerCase().trim(), tenantId]
          );
          if (existingUser.rowCount! > 0) {
            throw new Error(`Email ${row.email} already exists`);
          }

          // Check student number uniqueness
          const existingStudent = await db.query<{ id: string }>(
            `SELECT id FROM students WHERE student_number = $1 AND tenant_id = $2`,
            [row.student_number, tenantId]
          );
          if (existingStudent.rowCount! > 0) {
            throw new Error(`Student number ${row.student_number} already exists`);
          }

          const userId = uuidv4();
          const studentId = uuidv4();
          const hash = await bcrypt.hash('TempPass123!', 10);

          await db.transaction(async (client) => {
            await client.query(
              `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, is_email_verified)
               VALUES ($1,$2,$3,$4,$5,$6,'student',true,false)`,
              [userId, tenantId, row.email.toLowerCase().trim(), hash, row.first_name, row.last_name]
            );
            await client.query(
              `INSERT INTO students (id, tenant_id, user_id, student_number, first_name, last_name, email, phone, dob, address)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [studentId, tenantId, userId, row.student_number, row.first_name, row.last_name,
               row.email.toLowerCase().trim(), row.phone ?? null, row.dob ?? null, row.address ?? null]
            );
          });

          successCount++;
        } catch (e: any) {
          errorCount++;
          errors.push(e.message);
          logger.warn('[IMPORT] Row failed', { error: e.message });
        }
      }

      resolve({ successCount, errorCount, errors });
    });
  });
}
