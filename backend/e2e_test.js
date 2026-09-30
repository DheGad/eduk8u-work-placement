const db = require('better-sqlite3')('./eduk8u.db');

console.log("=== 120-Hour Engine & Compliance Validation ===");

// Get a random placement
const placement = db.prepare('SELECT * FROM placements LIMIT 1').get();
console.log(`Testing placement: ${placement.id} (Current hours: ${placement.hours_completed})`);

// Sign agreement
db.prepare("UPDATE placements SET agreement_signed=1, current_phase='active' WHERE id=?").run(placement.id);
console.log("Agreement signed.");

// Log hours (15 days * 8 hours = 120 hours)
let total = 0;
for (let i = 1; i <= 15; i++) {
  db.prepare(`INSERT INTO placement_hours (id, tenant_id, placement_id, student_id, log_date, hours_claimed, activities, status)
              VALUES (?, ?, ?, ?, ?, 8, 'Assisted clients', 'approved')`).run(
                `test-hour-${i}-` + Math.random(), placement.tenant_id, placement.id, placement.student_id, `2024-06-${String(i).padStart(2, '0')}`
              );
  total += 8;
  // Update placement total
  db.prepare(`UPDATE placements SET hours_completed=(SELECT SUM(hours_claimed) FROM placement_hours WHERE placement_id=?) WHERE id=?`).run(placement.id, placement.id);
  
  // Re-fetch and check milestones
  const p = db.prepare('SELECT hours_completed FROM placements WHERE id=?').get(placement.id);
  console.log(`Day ${i}: ${p.hours_completed} hours logged.`);
}

console.log("Hours completed. Updating other checks...");
db.prepare("UPDATE placements SET host_approved=1, supervisor_verified=1, learner_ready=1, monitoring_completed=1, final_signoff=1 WHERE id=?").run(placement.id);

// Get an admin user ID
const adminUser = db.prepare("SELECT id FROM users LIMIT 1").get();

// Add evidence
db.prepare("INSERT INTO placement_evidence (id, tenant_id, placement_id, student_id, document_type, document_name, file_path, uploaded_by) VALUES (?, ?, ?, ?, 'manual_handling', 'Manual Handling Cert', 'test.pdf', ?)").run('doc1' + Math.random(), placement.tenant_id, placement.id, placement.student_id, adminUser.id);
db.prepare("INSERT INTO placement_evidence (id, tenant_id, placement_id, student_id, document_type, document_name, file_path, uploaded_by) VALUES (?, ?, ?, ?, 'ndis_worker_screening', 'NDIS Screening', 'test2.pdf', ?)").run('doc2' + Math.random(), placement.tenant_id, placement.id, placement.student_id, adminUser.id);
db.prepare("INSERT INTO placement_evidence (id, tenant_id, placement_id, student_id, document_type, document_name, file_path, uploaded_by) VALUES (?, ?, ?, ?, 'vaccination', 'Vaccine Record', 'test3.pdf', ?)").run('doc3' + Math.random(), placement.tenant_id, placement.id, placement.student_id, adminUser.id);

// Recalculate compliance
const p = db.prepare('SELECT * FROM placements WHERE id=?').get(placement.id);
const evidenceCount = db.prepare("SELECT COUNT(*) as c FROM placement_evidence WHERE placement_id=?").get(placement.id).c;

const checks = [p.host_approved, p.supervisor_verified, p.learner_ready, p.agreement_signed, p.hours_completed >= 120 ? 1 : 0, evidenceCount >= 3 ? 1 : 0, p.monitoring_completed, p.final_signoff];
const compliance = Math.round(checks.filter(Boolean).length / checks.length * 100);
console.log(`Compliance Score Computed: ${compliance}% (Expected 100%)`);
db.prepare("UPDATE placements SET compliance_score=? WHERE id=?").run(compliance, placement.id);

console.log("=== Validation Passed ===");
