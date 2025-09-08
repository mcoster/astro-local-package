/**
 * Remark plugin to process shortcodes ({{variable}}) in markdown content
 * Replaces template variables with actual values at build time for proper SSR
 */

import { visit } from 'unist-util-visit';
import type { Root, Text, HTML, InlineCode, Link, Image } from 'mdast';
import type { Plugin } from 'unified';

/**
 * Template values for shortcode replacement
 */
export interface ShortcodeValues {
  businessName?: string;
  phone?: string;
  email?: string;
  formattedPhone?: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  mainLocation?: string;
  governingState?: string;
  governingCity?: string;
  serviceRadius?: string;
  [key: string]: any;
}

/**
 * Default shortcode values that can be overridden by options
 */
const DEFAULT_VALUES: ShortcodeValues = {
  businessName: 'Your Business Name',
  phone: '(00) 0000 0000',
  email: 'info@example.com',
  formattedPhone: '0000000000',
  street: '123 Main Street',
  city: 'Your City',
  state: 'Your State',
  postcode: '0000',
  mainLocation: 'Your City, Your State 0000',
  // Legal jurisdiction is always Queensland (where Web and Glow Pty Ltd is registered)
  governingState: 'Queensland',
  governingCity: 'Brisbane',
  serviceRadius: '50',
};

/**
 * Process shortcodes in a text string
 * @param text - Text containing shortcodes
 * @param values - Values to replace shortcodes with
 * @param context - Context for debugging
 * @returns Processed text with shortcodes replaced
 */
function processShortcodes(text: string, values: ShortcodeValues, context: string = 'general'): string {
  let processed = text;
  
  // Replace all shortcodes with their values
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, String(value));
  });
  
  // Check for any remaining unprocessed shortcodes
  const unprocessed = processed.match(/{{[^}]+}}/g);
  if (unprocessed) {
    // For now, just warn about unprocessed shortcodes
    // In production, these could be validated against the registry
    console.warn(`Warning: Unprocessed shortcodes in ${context} context: ${unprocessed.join(', ')}`);
  }
  
  return processed;
}

/**
 * Remark plugin to process shortcodes
 * @param options - Shortcode values to use for replacement
 * @returns Remark transformer plugin
 */
export default function remarkShortcodes(options: ShortcodeValues = {}): Plugin<[], Root> {
  // Merge default values with provided options
  const values: ShortcodeValues = {
    ...DEFAULT_VALUES,
    ...options,
    // Computed values
    mainLocation: options.mainLocation || 
      `${options.city || DEFAULT_VALUES.city}, ${options.state || DEFAULT_VALUES.state} ${options.postcode || DEFAULT_VALUES.postcode}`,
  };
  
  return function transformer(tree: Root): Root {
    // Process all text nodes in the markdown tree
    visit(tree, 'text', (node: Text) => {
      if (node.value && node.value.includes('{{')) {
        node.value = processShortcodes(node.value, values);
      }
    });
    
    // Process HTML nodes (for any inline HTML in markdown)
    visit(tree, 'html', (node: HTML) => {
      if (node.value && node.value.includes('{{')) {
        node.value = processShortcodes(node.value, values);
      }
    });
    
    // Process code nodes that might contain shortcodes
    visit(tree, 'inlineCode', (node: InlineCode) => {
      if (node.value && node.value.includes('{{')) {
        node.value = processShortcodes(node.value, values);
      }
    });
    
    // Process link URLs that might contain shortcodes
    visit(tree, 'link', (node: Link) => {
      if (node.url && node.url.includes('{{')) {
        node.url = processShortcodes(node.url, values);
      }
      if (node.title && node.title.includes('{{')) {
        node.title = processShortcodes(node.title, values);
      }
    });
    
    // Process image URLs and alt text
    visit(tree, 'image', (node: Image) => {
      if (node.url && node.url.includes('{{')) {
        node.url = processShortcodes(node.url, values);
      }
      if (node.alt && node.alt.includes('{{')) {
        node.alt = processShortcodes(node.alt, values);
      }
      if (node.title && node.title.includes('{{')) {
        node.title = processShortcodes(node.title, values);
      }
    });
    
    return tree;
  };
}