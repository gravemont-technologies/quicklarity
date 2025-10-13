import { Client } from '@notionhq/client';
import { StrategicPlan } from '../../../shared/types';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

/**
 * Publish strategic plan to Notion as a formatted page
 */
export async function publishToNotion(
  plan: StrategicPlan,
  founderName: string
): Promise<string> {
  
  if (!DATABASE_ID) {
    console.warn('Notion database ID not configured, skipping publish');
    return 'https://notion.so/placeholder';
  }
  
  try {
    // Create page in database
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `Strategic Plan - ${founderName}`,
              },
            },
          ],
        },
        Status: {
          select: {
            name: 'Active',
          },
        },
        Created: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
      children: buildNotionBlocks(plan),
    });
    
    const pageUrl = (response as any).url;
    console.log(`Published to Notion: ${pageUrl}`);
    
    return pageUrl;
    
  } catch (error: any) {
    console.error('Failed to publish to Notion:', error.message);
    // Don't fail the entire job if Notion publish fails
    return 'https://notion.so/error';
  }
}

/**
 * Build Notion blocks from strategic plan
 */
function buildNotionBlocks(plan: StrategicPlan): any[] {
  const blocks: any[] = [];
  
  // Executive Summary
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ text: { content: '📋 Executive Summary' } }],
    },
  });
  
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ text: { content: plan.executiveSummary } }],
    },
  });
  
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  
  // Top Priorities
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ text: { content: '🎯 Top Priorities' } }],
    },
  });
  
  for (const priority of plan.topPriorities) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ 
          text: { 
            content: `${priority.rank}. ${priority.taskTitle} (Impact: ${priority.impactScore.toFixed(1)})` 
          } 
        }],
      },
    });
    
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: priority.rationale } }],
      },
    });
    
    if (priority.preworkRequired.length > 0) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ text: { content: `Pre-work: ${priority.preworkRequired.join(', ')}` } }],
        },
      });
    }
    
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: `Duration: ${priority.estimatedDuration}` } }],
      },
    });
  }
  
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  
  // Schedule
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ text: { content: '📅 Execution Schedule' } }],
    },
  });
  
  for (const block of plan.schedule) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ text: { content: `Week ${block.week}: ${block.focus}` } }],
      },
    });
    
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: `Tasks: ${block.tasks.join(', ')}` } }],
      },
    });
    
    if (block.milestones.length > 0) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ text: { content: `Milestones: ${block.milestones.join(', ')}` } }],
        },
      });
    }
  }
  
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  
  // Risks
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ text: { content: '⚠️ Risks & Mitigation' } }],
    },
  });
  
  for (const risk of plan.risks) {
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ 
          text: { 
            content: `${risk.type.toUpperCase()} - ${risk.description} (${risk.likelihood}/${risk.impact})` 
          } 
        }],
      },
    });
    
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: `   → Mitigation: ${risk.mitigation}` } }],
      },
    });
  }
  
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  
  // Next Steps
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ text: { content: '✅ Next Steps' } }],
    },
  });
  
  for (const step of plan.nextSteps) {
    blocks.push({
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: step } }],
        checked: false,
      },
    });
  }
  
  return blocks;
}

