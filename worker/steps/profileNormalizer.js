// Step 1: Profile Normalization (gpt-5-nano)
const { callOpenAI } = require('../utils/openaiClient');
const fs = require('fs');
const path = require('path');

async function normalizeProfile(payload) {
  // Load prompt template
  const promptPath = path.join(__dirname, '../../prompts/profile-summarize.txt');
  const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  
  // Parse system and user prompts
  const systemMatch = promptTemplate.match(/===\s*SYSTEM\s*===\s*([\s\S]*?)(?===\s*USER\s*===|$)/i);
  const userMatch = promptTemplate.match(/===\s*USER\s*===\s*([\s\S]*?)$/i);
  
  const systemPrompt = systemMatch ? systemMatch[1].trim() : '';
  let userPrompt = userMatch ? userMatch[1].trim() : '';
  
  // Substitute variables
  userPrompt = userPrompt
    .replace(/{{founderName}}/g, payload.name || 'Not provided')
    .replace(/{{founderEmail}}/g, payload.email)
    .replace(/{{companyName}}/g, payload.company || 'Not provided')
    .replace(/{{companyStage}}/g, payload.stage || 'idea')
    .replace(/{{founderRole}}/g, 'Founder')
    .replace(/{{founderSkills}}/g, (payload.founder_skills || []).join(', ') || 'Not specified')
    .replace(/{{contextNotes}}/g, (payload.biggest_unknowns || []).join('; ') || 'None');
  
  // Call OpenAI with gpt-5-nano (ultra-cheap)
  const result = await callOpenAI({
    model: process.env.SUMMARIZATION_MODEL || 'gpt-5-nano',
    temperature: 0.1,
    maxTokens: 200,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });
  
  return {
    profile: {
      name: payload.name,
      email: payload.email,
      company: payload.company,
      stage: payload.stage,
      skills: payload.founder_skills || [],
      experience_years: payload.founder_experience_years || 0,
      summary: result.content.trim()
    },
    cost: result.cost,
    tokens: result.usage.total_tokens
  };
}

module.exports = { normalizeProfile };

