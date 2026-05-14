import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const COST_PER_MESSAGE = 0.08; // €

export async function campaignRoutes(app: FastifyInstance) {
  app.get<{ Params: { tenantId: string }; Querystring: { from?: string; to?: string } }>(
    '/:tenantId/roi',
    async (req, reply) => {
      const { tenantId } = req.params;
      const from = req.query.from ?? new Date(Date.now() - 30 * 86400000).toISOString();
      const to = req.query.to ?? new Date().toISOString();

      // Requête unique sans N+1
      const { rows } = await db.query(
        `SELECT
           s.id AS "sequenceId",
           s.name AS "sequenceName",
           COUNT(DISTINCT sm.id) AS "messagesSent",
           COUNT(DISTINCT a.id) AS "conversions",
           COALESCE(SUM(a.order_amount), 0) AS "revenueGenerated"
         FROM sequences s
         LEFT JOIN sequence_steps ss ON ss.sequence_id = s.id
         LEFT JOIN scheduled_messages sm ON sm.step_id = ss.id
           AND sm.status = 'sent' AND sm.sent_at BETWEEN $2 AND $3
         LEFT JOIN attributions a ON a.sequence_id = s.id
           AND a.tenant_id = $1
         WHERE s.tenant_id = $1
         GROUP BY s.id, s.name`,
        [tenantId, from, to]
      );

      const sequences = rows.map(r => {
        const messagesSent = Number(r.messagesSent);
        const conversions = Number(r.conversions);
        const revenueGenerated = Number(r.revenueGenerated) / 100; // centimes → euros
        const costEstimated = messagesSent * COST_PER_MESSAGE;
        return {
          sequenceId: r.sequenceId,
          sequenceName: r.sequenceName,
          messagesSent,
          conversions,
          conversionRate: messagesSent > 0 ? conversions / messagesSent : 0,
          revenueGenerated,
          roas: costEstimated > 0 ? revenueGenerated / costEstimated : 0,
        };
      });

      const totals = sequences.reduce((acc, s) => ({
        totalMessagesSent: acc.totalMessagesSent + s.messagesSent,
        totalConversions: acc.totalConversions + s.conversions,
        totalRevenue: acc.totalRevenue + s.revenueGenerated,
        globalROAS: 0
      }), { totalMessagesSent: 0, totalConversions: 0, totalRevenue: 0, globalROAS: 0 });

      const totalCost = totals.totalMessagesSent * COST_PER_MESSAGE;
      totals.globalROAS = totalCost > 0 ? totals.totalRevenue / totalCost : 0;

      return reply.send({ tenantId, period: { from, to }, sequences, totals });
    }
  );
}