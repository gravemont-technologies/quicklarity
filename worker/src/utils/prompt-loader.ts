import fs from 'fs';
import path from 'path';

/**
 * Load prompt template from prompts/ directory
 * Supports variable substitution using {{variableName}} syntax
 */
export function loadPrompt(
  promptName: string,
  type: 'system' | 'user',
  variables?: Record<string, string>
): string {
  const filePath = path.join(__dirname, '../../../prompts', `${promptName}.txt`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = parsePromptFile(content);
  
  let prompt = sections[type] || '';
  
  // Substitute variables
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(placeholder, value);
    }
  }
  
  return prompt.trim();
}

/**
 * Parse prompt file with sections
 * Format:
 * === SYSTEM ===
 * system prompt text
 * 
 * === USER ===
 * user prompt text
 */
function parsePromptFile(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  
  const systemMatch = content.match(/===\s*SYSTEM\s*===\s*([\s\S]*?)(?===\s*USER\s*===|$)/i);
  const userMatch = content.match(/===\s*USER\s*===\s*([\s\S]*?)$/i);
  
  if (systemMatch) {
    sections.system = systemMatch[1].trim();
  }
  
  if (userMatch) {
    sections.user = userMatch[1].trim();
  }
  
  return sections;
}

