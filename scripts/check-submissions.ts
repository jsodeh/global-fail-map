/**
 * Check submissions status in database
 * Run with: pnpm check:submissions
 */

import { db } from '../src/lib/db';
import { pendingSubmissions, admins } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkSubmissions() {
  try {
    console.log('📊 Checking submissions in database...\n');

    const submissions = await db
      .select({
        id: pendingSubmissions.id,
        submitterName: pendingSubmissions.submitterName,
        status: pendingSubmissions.status,
        claimText: pendingSubmissions.claimText,
        reviewedBy: pendingSubmissions.reviewedBy,
        reviewedAt: pendingSubmissions.reviewedAt,
        projectId: pendingSubmissions.projectId,
        submittedAt: pendingSubmissions.submittedAt,
      })
      .from(pendingSubmissions)
      .orderBy(pendingSubmissions.submittedAt);

    console.log(`Total submissions: ${submissions.length}\n`);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    for (const sub of submissions) {
      statusCounts[sub.status as keyof typeof statusCounts]++;

      const statusEmoji =
        sub.status === 'pending' ? '⏳' : sub.status === 'approved' ? '✅' : '❌';

      console.log(`${statusEmoji} ${sub.status.toUpperCase()}`);
      console.log(`   Submitter: ${sub.submitterName || 'Anonymous'}`);
      console.log(`   Text: ${sub.claimText.substring(0, 60)}...`);
      console.log(`   Submitted: ${sub.submittedAt.toLocaleString()}`);

      if (sub.status !== 'pending') {
        console.log(`   Reviewed: ${sub.reviewedAt?.toLocaleString()}`);
        if (sub.projectId) {
          console.log(`   Project ID: ${sub.projectId}`);
        }
      }

      console.log('');
    }

    console.log('📈 Summary:');
    console.log(`   Pending: ${statusCounts.pending}`);
    console.log(`   Approved: ${statusCounts.approved}`);
    console.log(`   Rejected: ${statusCounts.rejected}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSubmissions();
