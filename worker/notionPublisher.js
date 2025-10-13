// Notion API publisher - creates formatted strategic plan pages
const { Client } = require('@notionhq/client');

const notion = process.env.NOTION_API_KEY ? new Client({
  auth: process.env.NOTION_API_KEY
}) : null;

async function publishToNotion(plan, founderName) {
  if (!notion || !process.env.NOTION_DATABASE_ID) {
    console.warn('  → Notion not configured, skipping publish');
    return 'https://notion.so/not-configured';
  }
  
  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Name: {
          title: [{ text: { content: `Strategic Plan - ${founderName}` } }]
        },
        Status: {
          select: { name: 'Active' }
        },
        Created: {
          date: { start: new Date().toISOString() }
        }
      },
      children: buildNotionBlocks(plan)
    });
    
    return response.url;
  } catch (error) {
    console.error('  → Notion publish error:', error.message);
    return 'https://notion.so/error';
  }
}

function buildNotionBlocks(plan) {
  const blocks = [];
  
  // Executive Summary
  blocks.push(
    { object: 'block', type: 'heading_1', heading_1: { rich_text: [{ text: { content: '📋 Executive Summary' } }] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: plan.executiveSummary || 'No summary provided' } }] } },
    { object: 'block', type: 'divider', divider: {} }
  );
  
  // Top Priorities
  blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ text: { content: '🎯 Top Priorities' } }] } });
  
  const priorities = plan.topPriorities || [];
  for (const priority of priorities.slice(0, 5)) {
    blocks.push(
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: `${priority.rank}. ${priority.taskTitle}` } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: priority.rationale || '' } }] } }
    );
    
    if (priority.preworkRequired && priority.preworkRequired.length > 0) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: `Pre-work: ${priority.preworkRequired.join(', ')}` } }] }
      });
    }
  }
  
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  
  // Schedule
  blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ text: { content: '📅 Schedule' } }] } });
  
  const schedule = plan.schedule || [];
  for (const block of schedule) {
    blocks.push(
      { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: `Week ${block.week}: ${block.focus}` } }] } },
      { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: `Tasks: ${(block.tasks || []).join(', ')}` } }] } }
    );
  }
  
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  
  // Risks
  blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ text: { content: '⚠️ Risks' } }] } });
  
  const risks = plan.risks || [];
  for (const risk of risks) {
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: [{ text: { content: `${risk.type}: ${risk.description} → ${risk.mitigation}` } }] }
    });
  }
  
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  
  // Next Steps
  blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ text: { content: '✅ Next Steps' } }] } });
  
  const nextSteps = plan.nextSteps || [];
  for (const step of nextSteps) {
    blocks.push({ object: 'block', type: 'to_do', to_do: { rich_text: [{ text: { content: step } }], checked: false } });
  }
  
  return blocks;
}

module.exports = { publishToNotion };

