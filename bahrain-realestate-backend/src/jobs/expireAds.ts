// Job: Expire Ads & Boost - Background jobs to expire old advertisements and boosts
import { db } from "../config/database";
import { deactivateExpiredBoosts } from "../services/boost.service";

/**
 * Expire properties that have passed their expiresAt date
 * Runs every hour via setInterval
 */
export const expireAdsJob = async () => {
  try {
    console.log("[CRON] Starting expire ads job...");

    // 1. Find and expire company properties
    const expiredProperties = await db.property.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: 'expired',
        updatedAt: new Date(),
      },
    });

    if (expiredProperties.count > 0) {
      console.log(`[CRON] Expired ${expiredProperties.count} company properties`);

      // Notify companies about expired properties
      const justExpired = await db.property.findMany({
        where: {
          status: 'expired',
          updatedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // within last 5 minutes
          },
        },
        select: {
          id: true,
          title: true,
          companyId: true,
          type: true,
        },
      });

      for (const prop of justExpired) {
        try {
          await db.$queryRaw`
            INSERT INTO notifications (company_id, type, title, message, is_read, created_at)
            VALUES (
              ${prop.companyId},
              'featured_expired',
              ${'انتهت صلاحية العقار'},
              ${'انتهت صلاحية الإعلان: ' + (prop.title || prop.type || 'عقار #' + prop.id)},
              false,
              NOW()
            )
          `;
        } catch (notifError) {
          console.error(`[CRON] Failed to notify company ${prop.companyId}:`, notifError);
        }
      }
    }

    // 2. Deactivate expired boosts
    try {
      const expiredBoostsCount = await deactivateExpiredBoosts();
      if (expiredBoostsCount > 0) {
        console.log(`[CRON] Deactivated ${expiredBoostsCount} expired boosts`);
      }
    } catch (boostError) {
      console.error("[CRON] Error deactivating boosts:", boostError);
    }

    // 3. Expire featured packages
    try {
      await db.$queryRaw`
        UPDATE featured_packages
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active' AND end_date <= NOW()
      `;

      // Un-feature properties whose featured packages expired
      await db.$queryRaw`
        UPDATE properties
        SET is_featured = false, updated_at = NOW()
        WHERE is_featured = true
        AND id NOT IN (
          SELECT property_id FROM featured_packages WHERE status = 'active' AND end_date > NOW()
        )
      `;
    } catch (featuredError) {
      console.error("[CRON] Error expiring featured packages:", featuredError);
    }

    console.log("[CRON] Expire ads job completed successfully");
  } catch (error) {
    console.error("[CRON] Error in expire ads job:", error);
  }
};

/**
 * Start the cron scheduler
 * Runs expireAdsJob every hour
 */
export const startCronJobs = () => {
  // Run immediately on startup
  expireAdsJob().catch(console.error);

  // Then run every hour
  const INTERVAL = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    expireAdsJob().catch(console.error);
  }, INTERVAL);

  console.log("✓ Cron jobs started (expire ads runs every hour)");
};
