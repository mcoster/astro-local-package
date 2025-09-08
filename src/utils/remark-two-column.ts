/**
 * Remark plugin to process two-column layout shortcodes in markdown
 * Converts [two-column] shortcodes to HTML structure for side-by-side layouts
 */

import { getFallbackImage } from '../config/image-fallback-mappings';
import type { Root, Paragraph, Heading, List, BlockContent } from 'mdast';
import type { Plugin } from 'unified';

interface TwoColumnAttributes {
  image?: string;
  position?: 'left' | 'right';
  variant?: string;
  imageAlt?: string;
}

/**
 * Generate alt text from an image path
 */
function generateAltFromPath(imagePath: string): string {
  if (!imagePath) return 'Section image';
  
  // Extract filename from path
  const parts = imagePath.split('/');
  const filename = parts[parts.length - 1];
  
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i, '');
  
  // Replace special characters with spaces and capitalize
  const altText = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return altText || 'Section image';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Convert AST node to HTML string
 */
function nodeToHtml(node: BlockContent): string {
  switch (node.type) {
    case 'heading':
      const level = node.depth;
      const text = node.children
        .map((child: any) => child.value || '')
        .join('');
      return `<h${level}>${escapeHtml(text)}</h${level}>`;
    
    case 'paragraph':
      const content = node.children
        .map((child: any) => {
          if (child.type === 'text') return escapeHtml(child.value);
          if (child.type === 'strong') {
            return `<strong>${escapeHtml(child.children[0]?.value || '')}</strong>`;
          }
          if (child.type === 'emphasis') {
            return `<em>${escapeHtml(child.children[0]?.value || '')}</em>`;
          }
          if (child.type === 'link') {
            const linkText = child.children[0]?.value || '';
            return `<a href="${child.url}">${escapeHtml(linkText)}</a>`;
          }
          return child.value || '';
        })
        .join('');
      return `<p>${content}</p>`;
    
    case 'list':
      const tag = node.ordered ? 'ol' : 'ul';
      const items = node.children
        .map((item: any) => {
          const itemContent = item.children
            .map((child: any) => nodeToHtml(child))
            .join('');
          return `<li>${itemContent}</li>`;
        })
        .join('\n');
      return `<${tag}>\n${items}\n</${tag}>`;
    
    case 'html':
      return node.value;
    
    default:
      return '';
  }
}

/**
 * Parse attributes from shortcode string
 */
function parseAttributes(attrString: string): TwoColumnAttributes {
  const attrs: TwoColumnAttributes = {};
  
  // Handle both standard quotes and smart quotes (8220/8221)
  // Smart quotes: " = \u201C (8220), " = \u201D (8221)
  const imageMatch = attrString.match(/image=[""\u201C]([^""\u201D]+)[""\u201D]/);
  if (imageMatch) {
    attrs.image = imageMatch[1];
  }
  
  const positionMatch = attrString.match(/position=[""\u201C]?(left|right)[""\u201D]?/);
  if (positionMatch) {
    attrs.position = positionMatch[1] as 'left' | 'right';
  }
  
  const variantMatch = attrString.match(/variant=[""\u201C]([^""\u201D]+)[""\u201D]/);
  if (variantMatch) {
    attrs.variant = variantMatch[1];
  }
  
  const imageAltMatch = attrString.match(/imageAlt=[""\u201C]([^""\u201D]+)[""\u201D]/);
  if (imageAltMatch) {
    attrs.imageAlt = imageAltMatch[1];
  }
  
  return attrs;
}

/**
 * Remark plugin to process two-column layout shortcodes
 */
export function remarkTwoColumn(): Plugin<[], Root> {
  return function transformer(tree: Root): Root {
    // Remove console logs and test with a simple change
    const newChildren: BlockContent[] = [];
    let i = 0;
    
    while (i < tree.children.length) {
      const node = tree.children[i];
      let processed = false;
      
      // Check if this node contains a two-column opening tag
      if (node.type === 'paragraph' && 
          node.children && 
          node.children[0] && 
          node.children[0].type === 'text') {
        
        const text = (node.children[0] as any).value;
        
        // Check for opening tag
        const openMatch = text.match(/\[two-column([^\]]*)\]/);
        if (openMatch) {
          // Parse attributes
          const attrString = openMatch[1] || '';
          const attrs = parseAttributes(attrString);
          
          // Collect content until closing tag
          const contentHtml: string[] = [];
          let j = i + 1;
          let foundClose = false;
          
          while (j < tree.children.length) {
            const checkNode = tree.children[j];
            
            // Check for closing tag
            if (checkNode.type === 'paragraph' && 
                checkNode.children && 
                checkNode.children[0] && 
                checkNode.children[0].type === 'text' &&
                (checkNode.children[0] as any).value.includes('[/two-column]')) {
              
              // Check if there's content before the closing tag
              const closeText = (checkNode.children[0] as any).value;
              const beforeClose = closeText.split('[/two-column]')[0].trim();
              if (beforeClose) {
                contentHtml.push(`<p>${escapeHtml(beforeClose)}</p>`);
              }
              foundClose = true;
              break;
            }
            
            // Convert node to HTML
            contentHtml.push(nodeToHtml(checkNode));
            j++;
          }
          
          if (foundClose) {
            // Create the two-column HTML
            let image = attrs.image || '/images/placeholder.jpg';
            
            // Generate alt text: use provided alt, or generate from path
            const imageAlt = attrs.imageAlt && attrs.imageAlt.trim() 
              ? attrs.imageAlt 
              : generateAltFromPath(image);
            
            const position = attrs.position || 'right';
            const variant = attrs.variant || '';
            
            // Use fallback image if configured
            if (image && !image.includes('placeholder')) {
              image = getFallbackImage(image);
            }
            
            // URL encode the image path to handle spaces
            const encodedImage = encodeURI(image);
            
            const variantClass = variant ? ` two-column--${variant}` : '';
            
            // Create two-column section without wrapper
            const html = `
<section class="two-column${variantClass}" data-position="${position}">
  <div class="two-column__container">
    <div class="two-column__grid two-column__grid--${position}">
      <div class="two-column__content">
        ${contentHtml.join('\n')}
      </div>
      <div class="two-column__image-wrapper">
        <img src="${encodedImage}" alt="${escapeHtml(imageAlt)}" class="two-column__image" loading="lazy" />
      </div>
    </div>
  </div>
</section>`;
            
            // Add the HTML node
            newChildren.push({
              type: 'html',
              value: html
            });
            
            // Skip all nodes we've processed (including closing tag)
            i = j + 1;
            processed = true;
          }
        }
      }
      
      // If not processed, keep the node as is
      if (!processed) {
        newChildren.push(node);
        i++;
      }
    }
    
    tree.children = newChildren;
    return tree;
  };
}