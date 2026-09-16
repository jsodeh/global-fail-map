/**
 * Utilities for converting database projects to map format
 */

import type { FailExample } from '@/components/fail-map/types';
import type { Project } from '@/lib/db/schema';

/**
 * Convert a database project to FailExample format for display on the map
 */
export function projectToMapExample(project: Project): FailExample {
  return {
    id: project.id,
    title: project.title,
    subtitle: project.subtitle || '',
    location: project.locationName,
    country: 'Nigeria', // All our projects are in Nigeria
    lat: parseFloat(project.lat),
    lng: parseFloat(project.lng),
    category: 'infrastructure' as const, // Default category for now
    status: project.status,
    statusDate: project.updatedAt?.toString(),
    period: formatProjectPeriod(project.startDate, project.expectedCompletion),
    year: project.startDate 
      ? new Date(project.startDate).getFullYear() 
      : new Date(project.createdAt).getFullYear(),
    summary: project.reportContent 
      ? extractSummary(project.reportContent)
      : `${project.tier} project managed by ${project.mda}`,
    lesson: '', // Database projects may not have lessons
    locationRole: project.locationRole || 'Project site',
    confidence: project.confidence || 'moderate',
    reportPath: '', // Database projects don't use file-based reports
    sources: [], // Sources will be loaded separately if needed
  };
}

/**
 * Format project period from start and end dates
 */
function formatProjectPeriod(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate && !endDate) return 'Date unknown';
  
  const start = startDate ? new Date(startDate).getFullYear() : null;
  const end = endDate ? new Date(endDate).getFullYear() : null;
  
  if (start && end) return `${start}–${end}`;
  if (start) return `${start}–present`;
  if (end) return `Until ${end}`;
  
  return 'Date unknown';
}

/**
 * Extract a summary from markdown report content (first paragraph or 200 chars)
 */
function extractSummary(markdown: string): string {
  // Remove headings and get first paragraph
  const withoutHeadings = markdown.replace(/^#+\s+.+$/gm, '').trim();
  const firstParagraph = withoutHeadings.split('\n\n')[0];
  
  if (!firstParagraph) return '';
  
  // Limit to 200 characters
  if (firstParagraph.length <= 200) return firstParagraph;
  
  return firstParagraph.substring(0, 200).trim() + '...';
}

/**
 * Map database project status to display status
 */
export function mapProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    planned: 'Planned',
    ongoing: 'Ongoing',
    completed: 'Completed',
    stalled: 'Stalled',
    abandoned: 'Abandoned',
  };
  
  return statusMap[status] || status;
}

/**
 * Determine if a project should use database fields vs static report
 */
export function isDatabaseProject(example: FailExample): boolean {
  // Database projects have UUID-style IDs (contain hyphens)
  return example.id.includes('-');
}
