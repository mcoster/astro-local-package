/**
 * Image Registry System
 * 
 * Scans content files for image references and manages the mapping
 * between required image slots and available images.
 */

import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export interface ImageSlot {
  id: string;
  component: string;
  context: string;
  currentPath?: string;
  required: boolean;
  dimensions?: {
    width: number;
    height: number;
  };
  description?: string;
  matchedImage?: string;
  relevanceScore?: number;
}

export interface ImageMetadata {
  path: string;
  filename: string;
  source: 'user' | 'stock' | 'placeholder';
  analyzed?: boolean;
  analysis?: {
    subjects: string[];
    scene: string;
    quality: number;
    colors: string[];
    isPortrait: boolean;
    hasText: boolean;
  };
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface ImageManifest {
  version: string;
  generated: string;
  slots: Record<string, ImageSlot>;
  images: Record<string, ImageMetadata>;
  config: {
    fallbackChain: ('user' | 'stock' | 'placeholder')[];
    minRelevanceScore: number;
    preferredFormats: string[];
    stockPhotoProvider: string | null;
  };
}

export class ImageRegistry {
  private manifestPath = path.join(process.cwd(), 'business-images/manifest.json');
  private manifest: ImageManifest | null = null;

  /**
   * Load or initialize the image manifest
   */
  async loadManifest(): Promise<ImageManifest> {
    try {
      const data = await fs.readFile(this.manifestPath, 'utf-8');
      this.manifest = JSON.parse(data);
      return this.manifest!;
    } catch {
      // Initialize with default manifest
      this.manifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        slots: {},
        images: {},
        config: {
          fallbackChain: ['user', 'stock', 'placeholder'],
          minRelevanceScore: 70,
          preferredFormats: ['webp', 'jpg', 'png'],
          stockPhotoProvider: null
        }
      };
      await this.saveManifest();
      return this.manifest;
    }
  }

  /**
   * Save the current manifest to disk
   */
  async saveManifest(): Promise<void> {
    if (!this.manifest) return;
    
    await fs.writeFile(
      this.manifestPath,
      JSON.stringify(this.manifest, null, 2),
      'utf-8'
    );
  }

  /**
   * Scan all content files for image references
   */
  async scanForImageSlots(): Promise<ImageSlot[]> {
    const slots: ImageSlot[] = [];
    
    // Scan YAML files
    const yamlFiles = await glob('src/content/**/*.yaml');
    
    for (const file of yamlFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const data = yaml.load(content) as any;
      
      const fileSlots = this.extractImageSlots(data, file);
      slots.push(...fileSlots);
    }

    // Scan Markdown files
    const mdFiles = await glob('src/content/**/*.md');
    
    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (frontmatterMatch) {
        const frontmatter = yaml.load(frontmatterMatch[1]) as any;
        const fileSlots = this.extractImageSlots(frontmatter, file);
        slots.push(...fileSlots);
      }

      // Extract images from markdown content
      const imageMatches = content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);
      for (const match of imageMatches) {
        const [, alt, src] = match;
        if (src.startsWith('/images/')) {
          slots.push({
            id: `${file}:${src}`,
            component: 'markdown',
            context: alt || 'Image in markdown content',
            currentPath: src,
            required: false
          });
        }
      }
    }

    return slots;
  }

  /**
   * Extract image slots from a data structure
   */
  private extractImageSlots(data: any, sourcePath: string, prefix = ''): ImageSlot[] {
    const slots: ImageSlot[] = [];
    
    if (!data || typeof data !== 'object') return slots;

    // Handle arrays
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        slots.push(...this.extractImageSlots(item, sourcePath, `${prefix}[${index}]`));
      });
      return slots;
    }

    // Handle objects
    for (const [key, value] of Object.entries(data)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      // Check if this is an image field
      if (this.isImageField(key, value)) {
        const component = this.extractComponent(sourcePath, currentPath);
        slots.push({
          id: `${sourcePath}:${currentPath}`,
          component,
          context: this.generateContext(currentPath, data),
          currentPath: value as string,
          required: this.isRequiredImage(component, key)
        });
      } else if (typeof value === 'object') {
        // Recursively process nested objects
        slots.push(...this.extractImageSlots(value, sourcePath, currentPath));
      }
    }

    return slots;
  }

  /**
   * Determine if a field is likely an image reference
   */
  private isImageField(key: string, value: any): boolean {
    if (typeof value !== 'string') return false;
    
    const imageKeys = ['image', 'background', 'backgroundImage', 'src', 'poster', 'thumbnail', 'avatar', 'logo', 'icon'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    
    const keyMatch = imageKeys.some(imgKey => key.toLowerCase().includes(imgKey.toLowerCase()));
    const valueMatch = value.startsWith('/images/') || 
                      imageExtensions.some(ext => value.toLowerCase().endsWith(ext));
    
    return keyMatch || valueMatch;
  }

  /**
   * Extract component name from the source path and field path
   */
  private extractComponent(sourcePath: string, fieldPath: string): string {
    // Extract from file path
    if (sourcePath.includes('/homepage/')) return 'homepage';
    if (sourcePath.includes('/about/')) return 'about';
    if (sourcePath.includes('/contact/')) return 'contact';
    if (sourcePath.includes('/services/')) return 'services';
    if (sourcePath.includes('/locations/')) return 'locations';
    
    // Extract from field path
    if (fieldPath.includes('hero')) return 'hero';
    if (fieldPath.includes('gallery')) return 'gallery';
    if (fieldPath.includes('team')) return 'team';
    
    return 'general';
  }

  /**
   * Generate context description for an image slot
   */
  private generateContext(fieldPath: string, parentData: any): string {
    const parts = fieldPath.split('.');
    const lastPart = parts[parts.length - 1];
    
    // Look for adjacent text fields for context
    let context = lastPart.replace(/([A-Z])/g, ' $1').trim();
    
    if (parentData.title) {
      context = `${parentData.title} - ${context}`;
    } else if (parentData.heading) {
      context = `${parentData.heading} - ${context}`;
    } else if (parentData.description) {
      context = `${context} (${parentData.description.substring(0, 50)}...)`;
    }
    
    return context;
  }

  /**
   * Determine if an image is required based on component and field
   */
  private isRequiredImage(component: string, field: string): boolean {
    const requiredImages = {
      'hero': ['backgroundImage', 'background'],
      'homepage': ['backgroundImage'],
      'services': ['image', 'icon']
    };
    
    const componentRequirements = requiredImages[component as keyof typeof requiredImages];
    if (!componentRequirements) return false;
    
    return componentRequirements.some(req => field.toLowerCase().includes(req.toLowerCase()));
  }

  /**
   * Scan available images in the business-images directory
   */
  async scanAvailableImages(): Promise<ImageMetadata[]> {
    const images: ImageMetadata[] = [];
    
    // Scan pending images
    const pendingImages = await glob('business-images/pending/**/*.{jpg,jpeg,png,webp}');
    for (const imagePath of pendingImages) {
      images.push({
        path: imagePath,
        filename: path.basename(imagePath),
        source: 'user',
        analyzed: false
      });
    }
    
    // Scan approved images  
    const approvedImages = await glob('business-images/approved/**/*.{jpg,jpeg,png,webp}');
    for (const imagePath of approvedImages) {
      images.push({
        path: imagePath,
        filename: path.basename(imagePath),
        source: 'user',
        analyzed: true
      });
    }
    
    return images;
  }

  /**
   * Generate a report of image requirements and availability
   */
  async generateReport(): Promise<{
    totalSlots: number;
    requiredSlots: number;
    matchedSlots: number;
    unmatchedSlots: string[];
    availableImages: number;
    unusedImages: string[];
  }> {
    await this.loadManifest();
    
    const slots = Object.values(this.manifest!.slots);
    const images = Object.values(this.manifest!.images);
    
    const requiredSlots = slots.filter(s => s.required);
    const matchedSlots = slots.filter(s => s.matchedImage);
    const unmatchedSlots = slots
      .filter(s => !s.matchedImage && s.required)
      .map(s => s.id);
    
    const usedImages = new Set(slots.map(s => s.matchedImage).filter(Boolean));
    const unusedImages = images
      .filter(img => !usedImages.has(img.path))
      .map(img => img.filename);
    
    return {
      totalSlots: slots.length,
      requiredSlots: requiredSlots.length,
      matchedSlots: matchedSlots.length,
      unmatchedSlots,
      availableImages: images.length,
      unusedImages
    };
  }

  /**
   * Update the manifest with discovered slots and images
   */
  async updateRegistry(): Promise<void> {
    await this.loadManifest();
    
    // Scan for image slots
    const slots = await this.scanForImageSlots();
    for (const slot of slots) {
      this.manifest!.slots[slot.id] = slot;
    }
    
    // Scan for available images
    const images = await this.scanAvailableImages();
    for (const image of images) {
      this.manifest!.images[image.path] = image;
    }
    
    this.manifest!.generated = new Date().toISOString();
    await this.saveManifest();
  }
}

// Export singleton instance
export const imageRegistry = new ImageRegistry();