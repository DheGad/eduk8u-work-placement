import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { executeAction } from './actions';
import { logger } from '../config/logger';

export interface EventContext {
  tenantId: string;
  entityType: string;
  entityId: string;
  user?: any;
  payload?: any;
}

/**
 * Dispatches an event to the automation rules engine.
 * Fetches active rules from PostgreSQL and executes matching actions.
 */
export async function dispatchEvent(eventName: string, context: EventContext): Promise<void> {
  logger.debug(`[EVENT BUS] Dispatching event: ${eventName}`, { entityType: context.entityType, entityId: context.entityId });

  try {
    // Fetch active rules for this event and tenant
    const result = await db.query<{ id: string; conditions: any; actions: any }>(
      `SELECT id, conditions, actions
       FROM automation_rules
       WHERE trigger_event = $1 AND tenant_id = $2 AND is_enabled = true`,
      [eventName, context.tenantId]
    );

    if (result.rowCount === 0) return;

    for (const rule of result.rows) {
      let conditions: any[] = [];
      let actions: any[] = [];

      try {
        conditions = Array.isArray(rule.conditions) ? rule.conditions : JSON.parse(rule.conditions ?? '[]');
        actions = Array.isArray(rule.actions) ? rule.actions : JSON.parse(rule.actions ?? '[]');
      } catch {
        logger.warn(`[EVENT BUS] Failed to parse rule ${rule.id}`);
        continue;
      }

      // Evaluate conditions (basic field check)
      let conditionsPassed = true;
      for (const cond of conditions) {
        if (cond.field === 'hours_verified') {
          const hoursRes = await db.query<{ placement_id: string }>(
            `SELECT placement_id FROM placement_hours WHERE id = $1`, [context.entityId]);
          if (hoursRes.rowCount! > 0) {
            const placementRes = await db.query<{ completed_hours: number }>(
              `SELECT completed_hours FROM placements WHERE id = $1`, [hoursRes.rows[0].placement_id]);
            if (placementRes.rowCount! > 0) {
              const hrs = placementRes.rows[0].completed_hours ?? 0;
              if (cond.operator === '>=' && hrs < cond.value) conditionsPassed = false;
              if (cond.operator === '<' && hrs >= cond.value) conditionsPassed = false;
            }
          }
        }
      }

      if (!conditionsPassed) continue;

      // Execute each action in sequence
      for (const action of actions) {
        await executeAction(action, context).catch((err: Error) =>
          logger.warn(`[EVENT BUS] Action failed`, { ruleId: rule.id, actionType: action.type, error: err.message })
        );
      }
    }
  } catch (err) {
    logger.error(`[EVENT BUS] Error processing event`, { eventName, error: (err as Error).message });
  }
}
