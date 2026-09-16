/**
 * Test script for creating sample submissions
 * Run with: pnpm test:submissions
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SubmissionData {
  submitterName?: string;
  submitterContact?: string;
  claimText: string;
  sourceUrl?: string;
  submissionType?: string;
}

const testSubmissions: SubmissionData[] = [
  {
    submitterName: 'Chidi Okafor',
    submitterContact: 'chidi@example.com',
    claimText: `Lagos-Ibadan Railway Modernization Project

The Nigerian Railway Corporation is currently modernizing the Lagos-Ibadan railway line. 
The project includes:
- 156km standard gauge rail line
- 10 new stations
- Modern signaling systems
- Estimated cost: ₦500 billion

Construction started in 2017 and was initially scheduled for completion in 2020, but has been delayed several times.

Current status appears to be ongoing with test runs being conducted.`,
    sourceUrl: 'https://www.premiumtimesng.com/news/railway-project',
  },
  {
    submitterName: 'Amina Yusuf',
    submitterContact: 'amina.y@gmail.com',
    claimText: `Second Niger Bridge Construction

The Second Niger Bridge project connecting Asaba and Onitsha is nearing completion. 

Key details:
- Total length: 1.6km
- Contract sum: ₦206 billion
- Started: 2018
- Expected completion: 2022 (now delayed to 2023)

The bridge will significantly reduce traffic congestion and improve interstate commerce between the Southeast and South-South regions.`,
    sourceUrl: 'https://www.vanguardngr.com/2023/niger-bridge',
  },
  {
    submitterName: 'Tunde Adeyemi',
    claimText: `Lekki Deep Sea Port Development

The Lekki Deep Sea Port is one of the largest port projects in West Africa.

Project scope:
- 3 container berths initially (expandable to 6)
- Annual capacity: 2.7 million TEUs
- Investment: $1.5 billion
- Status: Construction ongoing, expected commissioning in 2023

This will position Nigeria as a major maritime hub in the region.`,
    sourceUrl: 'https://businessday.ng/lekki-port-project',
  },
  {
    claimText: `Mambilla Hydropower Plant - Taraba State

I heard that the Mambilla hydropower project in Taraba has been awarded to a Chinese firm. This is supposed to be a 3,050 MW plant that will help solve Nigeria's power problems. 

Can you confirm if this project is really happening? I've heard about it for years but not sure of current status.`,
  },
  {
    submitterName: 'Ngozi Eze',
    submitterContact: '0803-555-1234',
    claimText: `Abuja Light Rail System

The Abuja Light Rail was completed but I noticed many stations are not operational. Only Idu to Airport route seems to be running.

Some observations:
- Built at huge cost (over $800 million)
- Most stations remain closed
- Very few passengers using it
- Maintenance issues reported

Is this project being tracked? Many Abuja residents feel it was a waste of money.`,
  },
];

async function submitOne(data: SubmissionData): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Failed: ${error.error}`);
      return;
    }

    const result = await response.json();
    console.log(`✅ Submitted: "${data.claimText.substring(0, 50)}..." - ID: ${result.submissionId}`);
  } catch (error) {
    console.error(`❌ Error:`, error);
  }
}

async function submitAll() {
  console.log(`🚀 Submitting ${testSubmissions.length} test submissions to ${API_URL}\n`);

  for (const submission of testSubmissions) {
    await submitOne(submission);
    // Small delay between submissions
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n✨ Done! Check /admin/submissions to review them.');
}

// Run if called directly
if (require.main === module) {
  submitAll().catch(console.error);
}

export { submitAll, submitOne, testSubmissions };
