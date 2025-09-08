/**
 * Remark plugin to wrap H2 sections in divs with alternating classes
 * Each section from an H2 to the next H2 (or end of content) gets wrapped
 */

import { visit } from 'unist-util-visit';
import type { Root, Heading } from 'mdast';
import type { Plugin } from 'unified';

/**
 * Wraps H2 sections with div elements for styling
 * @returns Remark transformer plugin
 */
export function remarkSectionWrapper(): Plugin<[], Root> {
  return function transformer(tree: Root): Root {
    const h2Indices: number[] = [];
    
    // Find all H2 positions
    visit(tree, 'heading', (node: Heading, index?: number) => {
      if (node.depth === 2 && index !== undefined) {
        h2Indices.push(index);
      }
    });
    
    // If no H2s found, return unchanged
    if (h2Indices.length === 0) {
      return tree;
    }
    
    // Process sections in reverse order to maintain indices
    for (let i = h2Indices.length - 1; i >= 0; i--) {
      const startIndex = h2Indices[i];
      const endIndex = i < h2Indices.length - 1 ? h2Indices[i + 1] : tree.children.length;
      
      // Extract the section nodes
      const sectionNodes = tree.children.slice(startIndex, endIndex);
      
      // Create wrapper div with class
      const wrapper = {
        type: 'html' as const,
        value: `<div class="h2-section h2-section--${i + 1}" data-section-index="${i}">`
      };
      
      const closingDiv = {
        type: 'html' as const,
        value: '</div>'
      };
      
      // Replace the section with wrapped version
      tree.children.splice(
        startIndex, 
        endIndex - startIndex,
        wrapper,
        ...sectionNodes,
        closingDiv
      );
    }
    
    return tree;
  };
}