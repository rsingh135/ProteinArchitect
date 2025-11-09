import React from 'react';

/**
 * Utility functions to parse and clean markdown formatting
 */

/**
 * Remove markdown formatting from text
 */
export function cleanMarkdown(text) {
  if (!text) return '';
  
  // Remove markdown links but keep the link text: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove bold/italic markdown
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1'); // ***text***
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // **text**
  text = text.replace(/\*([^*]+)\*/g, '$1'); // *text*
  text = text.replace(/__([^_]+)__/g, '$1'); // __text__
  text = text.replace(/_([^_]+)_/g, '$1'); // _text_
  
  // Remove markdown headers
  text = text.replace(/^#+\s*/gm, '');
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Extract links from markdown and convert to HTML
 */
export function parseMarkdownLinks(text) {
  if (!text) return { text: '', links: [] };
  
  const links = [];
  let cleanText = text;
  
  // Find all markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  let match;
  let linkIndex = 0;
  
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      index: match.index,
      length: match[0].length
    });
  }
  
  // Replace markdown links with placeholder
  cleanText = text.replace(linkRegex, (match, linkText, url) => {
    return linkText; // Keep just the link text
  });
  
  return { text: cleanText, links };
}

/**
 * Convert markdown links to React elements
 */
export function renderMarkdownLinks(text) {
  if (!text) return text;
  
  const parts = [];
  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the link
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {match[1]}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

