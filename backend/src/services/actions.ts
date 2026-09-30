import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { emailEngine } from './emailService';
import { logger } from '../config/logger';

export async function executeAction(action: any, context: any): Promise<{ success: boolean; error?: string }> {
  const { tenantId, entityId, entityType, user } = context;
  logger.debug(`[ACTION] Executing ${action.type}`, { entityType, entityId });

  try {
    switch (action.type) {
      case 'CREATE_DOCUMENT': {
        const docId = uuidv4();
        await db.query(
          `INSERT INTO documents (id, tenant_id, entity_type, entity_id, document_name, document_type, status, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,'draft',$7)`,
          [docId, tenantId, entityType, entityId, `Auto-generated ${action.payload?.type ?? 'document'}`, action.payload?.type ?? 'auto', user?.id ?? null]
        );
        break;
      }

      case 'NOTIFY_STUDENT':
      case 'NOTIFY_SUPERVISOR':
      case 'NOTIFY_TRAINER': {
        let targetUserId: string | null = null;

        if (entityType === 'placement') {
          const placementRes = await db.query<{ student_id: string; supervisor_id: string | null; trainer_id: string | null }>(
            `SELECT student_id, supervisor_id, trainer_id FROM placements WHERE id = $1`, [entityId]);
          if (placementRes.rowCount! > 0) {
            const pl = placementRes.rows[0];
            if (action.type === 'NOTIFY_STUDENT') {
              const stuRes = await db.query<{ user_id: string }>(`SELECT user_id FROM students WHERE id = $1`, [pl.student_id]);
              targetUserId = stuRes.rows[0]?.user_id ?? null;
            } else if (action.type === 'NOTIFY_SUPERVISOR' && pl.supervisor_id) {
              const supRes = await db.query<{ user_id: string }>(`SELECT user_id FROM supervisors WHERE id = $1`, [pl.supervisor_id]);
              targetUserId = supRes.rows[0]?.user_id ?? null;
            } else if (action.type === 'NOTIFY_TRAINER') {
              targetUserId = pl.trainer_id;
            }
          }
        } else if (entityType === 'hours') {
          const hoursRes = await db.query<{ placement_id: string }>(`SELECT placement_id FROM placement_hours WHERE id = $1`, [entityId]);
          if (hoursRes.rowCount! > 0 && action.type === 'NOTIFY_SUPERVISOR') {
            const plRes = await db.query<{ supervisor_id: string | null }>(`SELECT supervisor_id FROM placements WHERE id = $1`, [hoursRes.rows[0].placement_id]);
            if (plRes.rows[0]?.supervisor_id) {
              const supRes = await db.query<{ user_id: string }>(`SELECT user_id FROM supervisors WHERE id = $1`, [plRes.rows[0].supervisor_id]);
              targetUserId = supRes.rows[0]?.user_id ?? null;
            }
          }
        }

        if (targetUserId) {
          const notifId = uuidv4();
          await db.query(
            `INSERT INTO notifications (id, tenant_id, user_id, title, message, type, created_at)
             VALUES ($1,$2,$3,'Automated Alert',$4,'system',NOW())`,
            [notifId, tenantId, targetUserId, `Automated notification: ${action.payload?.template ?? 'update'}`]
          );

          const emailRes = await db.query<{ email: string }>(`SELECT email FROM users WHERE id = $1`, [targetUserId]);
          if (emailRes.rows[0]?.email) {
            await emailEngine.sendTemplateEmail({
              tenantId,
              to: emailRes.rows[0].email,
              subject: 'EDUK8U: Automated Alert',
              template: action.payload?.template ?? 'generic_notification',
            }).catch((e: Error) => logger.warn('Action email failed', { error: e.message }));
          }
        }
        break;
      }

      case 'RECALCULATE_TOTALS': {
        if (entityType === 'hours') {
          const hoursRes = await db.query<{ placement_id: string }>(`SELECT placement_id FROM placement_hours WHERE id = $1`, [entityId]);
          if (hoursRes.rowCount! > 0) {
            const placementId = hoursRes.rows[0].placement_id;
            const totalsRes = await db.query<{ total: string }>(
              `SELECT COALESCE(SUM(hours_claimed), 0) AS total FROM placement_hours WHERE placement_id = $1 AND status = 'approved'`, [placementId]);
            await db.query(
              `UPDATE placements SET completed_hours = $1, updated_at = NOW() WHERE id = $2`,
              [parseFloat(totalsRes.rows[0]?.total ?? '0'), placementId]
            );
          }
        }
        break;
      }

      case 'EVALUATE_MILESTONES': {
        if (entityType === 'hours') {
          const hoursRes = await db.query<{ placement_id: string; hours_claimed: number }>(
            `SELECT placement_id, hours_claimed FROM placement_hours WHERE id = $1`, [entityId]);
          if (hoursRes.rowCount! > 0) {
            const { placement_id, hours_claimed } = hoursRes.rows[0];
            const plRes = await db.query<{ completed_hours: number; required_hours: number; student_id: string; trainer_id: string | null }>(
              `SELECT completed_hours, required_hours, student_id, trainer_id FROM placements WHERE id = $1`, [placement_id]);
            if (plRes.rowCount! > 0) {
              const pl = plRes.rows[0];
              const newPct = ((pl.completed_hours ?? 0) / pl.required_hours) * 100;
              const prevPct = ((pl.completed_hours ?? 0) - hours_claimed) / pl.required_hours * 100;
              const thresholds = action.payload?.thresholds ?? [25, 50, 75, 90, 100];
              for (const t of thresholds) {
                if (newPct >= t && prevPct < t) {
                  const stuRes = await db.query<{ user_id: string }>(`SELECT user_id FROM students WHERE id = $1`, [pl.student_id]);
                  const msg = `Milestone Reached: ${t}% of required placement hours completed!`;
                  if (stuRes.rows[0]?.user_id) {
                    await db.query(
                      `INSERT INTO notifications (id, tenant_id, user_id, title, message, type, created_at) VALUES ($1,$2,$3,'Milestone Unlocked',$4,'success',NOW())`,
                      [uuidv4(), tenantId, stuRes.rows[0].user_id, msg]
                    );
                  }
                  if (pl.trainer_id) {
                    await db.query(
                      `INSERT INTO notifications (id, tenant_id, user_id, title, message, type, created_at) VALUES ($1,$2,$3,'Student Milestone',$4,'info',NOW())`,
                      [uuidv4(), tenantId, pl.trainer_id, msg]
                    );
                  }
                }
              }
            }
          }
        }
        break;
      }

      case 'MARK_READY_FOR_REVIEW': {
        if (entityType === 'hours') {
          const hoursRes = await db.query<{ placement_id: string }>(`SELECT placement_id FROM placement_hours WHERE id = $1`, [entityId]);
          if (hoursRes.rowCount! > 0) {
            await db.query(
              `UPDATE placements SET status = 'review', updated_at = NOW() WHERE id = $1`,
              [hoursRes.rows[0].placement_id]
            );
          }
        }
        break;
      }

      default:
        logger.warn(`[ACTION] Unknown action type: ${action.type}`);
    }

    return { success: true };
  } catch (err: any) {
    logger.error(`[ACTION] Error executing ${action.type}`, { error: err.message });
    return { success: false, error: err.message };
  }
}
