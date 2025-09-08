/**
 * Image Analysis Service
 * 
 * Integrates with AI vision APIs to analyze image content
 * and match images to appropriate website sections
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { loadImageConfig } from '../config/image-config';

export interface ImageAnalysis {
  subjects: string[];
  scene: string;
  quality: number;
  colors: string[];
  isPortrait: boolean;
  hasText: boolean;
  confidence: number;
  tags: string[];
  description: string;
  businessRelevance?: {
    isTeamPhoto: boolean;
    isServiceAction: boolean;
    isBeforeAfter: boolean;
    isEquipment: boolean;
    isBuilding: boolean;
    isCertificate: boolean;
  };
}

export interface AnalysisCache {
  [imagePath: string]: {
    hash: string;
    analysis: ImageAnalysis;
    timestamp: string;
  };
}

export class ImageAnalysisService {
  private cacheFile = path.join(process.cwd(), 'business-images/analysis-cache.json');
  private cache: AnalysisCache = {};
  private config: any;
  
  constructor() {
    this.loadCache();
    this.loadConfig();
  }

  /**
   * Load configuration
   */
  private async loadConfig(): Promise<void> {
    this.config = await loadImageConfig();
  }

  /**
   * Load analysis cache from disk
   */
  private async loadCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      this.cache = JSON.parse(data);
    } catch {
      this.cache = {};
    }
  }

  /**
   * Save analysis cache to disk
   */
  private async saveCache(): Promise<void> {
    await fs.writeFile(
      this.cacheFile,
      JSON.stringify(this.cache, null, 2),
      'utf-8'
    );
  }

  /**
   * Calculate hash of image file for caching
   */
  private async getImageHash(imagePath: string): Promise<string> {
    const buffer = await fs.readFile(imagePath);
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Analyze an image using configured AI vision API with fallback chain
   */
  async analyzeImage(imagePath: string): Promise<ImageAnalysis> {
    // Check cache first
    const hash = await this.getImageHash(imagePath);
    if (this.cache[imagePath] && this.cache[imagePath].hash === hash) {
      return this.cache[imagePath].analysis;
    }

    // Ensure config is loaded
    if (!this.config) {
      await this.loadConfig();
    }

    // Try each provider in the chain
    let analysis: ImageAnalysis | null = null;
    const providers = this.config.providers.vision.chain;
    
    for (const provider of providers) {
      try {
        console.log(`Attempting image analysis with ${provider}...`);
        
        switch (provider) {
          case 'openai':
            if (this.config.providers.vision.apiKeys.openai) {
              analysis = await this.analyzeWithOpenAI(imagePath);
            } else {
              console.log('OpenAI API key not configured, skipping...');
              continue;
            }
            break;
          case 'anthropic':
            if (this.config.providers.vision.apiKeys.anthropic) {
              analysis = await this.analyzeWithAnthropic(imagePath);
            } else {
              console.log('Anthropic API key not configured, skipping...');
              continue;
            }
            break;
          case 'mock':
            analysis = await this.mockAnalysis(imagePath);
            break;
        }
        
        if (analysis) {
          console.log(`Successfully analyzed with ${provider}`);
          break;
        }
      } catch (error) {
        console.warn(`Failed to analyze with ${provider}:`, error.message);
        // Continue to next provider
      }
    }

    if (!analysis) {
      // If all providers failed, use mock as final fallback
      console.log('All providers failed, using mock analysis as fallback');
      analysis = await this.mockAnalysis(imagePath);
    }

    // Cache the result
    this.cache[imagePath] = {
      hash,
      analysis,
      timestamp: new Date().toISOString()
    };
    await this.saveCache();

    return analysis;
  }

  /**
   * Mock analysis for development/testing
   */
  private async mockAnalysis(imagePath: string): Promise<ImageAnalysis> {
    const filename = path.basename(imagePath).toLowerCase();
    
    // Detect based on filename patterns
    const isTeamPhoto = filename.includes('team') || filename.includes('staff') || filename.includes('group');
    const isServiceAction = filename.includes('action') || filename.includes('work') || filename.includes('service');
    const isBeforeAfter = filename.includes('before') || filename.includes('after') || filename.includes('comparison');
    const isEquipment = filename.includes('equipment') || filename.includes('tool') || filename.includes('machine');
    const isBuilding = filename.includes('building') || filename.includes('storefront') || filename.includes('exterior');
    const isCertificate = filename.includes('cert') || filename.includes('license') || filename.includes('award');
    
    // Detect roof cleaning specific patterns
    const isRoofRelated = filename.includes('roof') || filename.includes('tile') || filename.includes('metal');
    const isGutterRelated = filename.includes('gutter') || filename.includes('downpipe');
    const isSolarRelated = filename.includes('solar') || filename.includes('panel');
    const isCleaningRelated = filename.includes('clean') || filename.includes('wash') || filename.includes('pressure');

    const subjects: string[] = [];
    const tags: string[] = [];
    
    if (isTeamPhoto) {
      subjects.push('people', 'group', 'team');
      tags.push('team', 'staff', 'employees');
    }
    if (isServiceAction) {
      subjects.push('person working', 'service in progress');
      tags.push('service', 'work', 'professional');
    }
    if (isRoofRelated) {
      subjects.push('roof', 'building exterior');
      tags.push('roof', 'roofing', 'tiles', 'shingles');
    }
    if (isGutterRelated) {
      subjects.push('gutter', 'drainage');
      tags.push('gutter', 'downpipe', 'drainage');
    }
    if (isSolarRelated) {
      subjects.push('solar panels', 'renewable energy');
      tags.push('solar', 'panels', 'clean energy');
    }
    if (isCleaningRelated) {
      subjects.push('cleaning equipment', 'pressure washing');
      tags.push('cleaning', 'washing', 'maintenance');
    }
    if (isBuilding) {
      subjects.push('building', 'architecture');
      tags.push('building', 'property', 'exterior');
    }
    
    // Generate a mock description
    let description = 'Professional image showing ';
    if (isTeamPhoto) description += 'team members in uniform';
    else if (isServiceAction) description += 'service work being performed';
    else if (isBeforeAfter) description += 'before and after comparison';
    else if (isRoofRelated && isCleaningRelated) description += 'roof cleaning service';
    else if (isGutterRelated) description += 'gutter maintenance work';
    else if (isSolarRelated) description += 'solar panel cleaning';
    else description += 'business-related content';

    return {
      subjects: subjects.length > 0 ? subjects : ['general content'],
      scene: isTeamPhoto ? 'group photo' : isServiceAction ? 'action shot' : 'static scene',
      quality: 85, // Mock quality score
      colors: ['#4f46e5', '#7c3aed', '#ffffff'],
      isPortrait: isTeamPhoto,
      hasText: isCertificate,
      confidence: 0.75,
      tags: tags.length > 0 ? tags : ['business', 'professional'],
      description,
      businessRelevance: {
        isTeamPhoto,
        isServiceAction,
        isBeforeAfter,
        isEquipment,
        isBuilding,
        isCertificate
      }
    };
  }

  /**
   * Analyze with OpenAI Vision API using Chat Completions
   */
  private async analyzeWithOpenAI(imagePath: string): Promise<ImageAnalysis> {
    const apiKey = this.config.providers.vision.apiKeys.openai;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Read the image file
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      // Prepare the request to OpenAI Chat Completions API with vision
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.config.providers.vision.models.openai || 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image for a ${this.config.businessType || 'professional service'} business website. Please identify:
1. Main subjects in the image
2. The scene type (e.g., action shot, group photo, static scene)
3. Image quality (1-100)
4. Dominant colors (up to 3 hex codes)
5. Whether it's a portrait-oriented image
6. Whether there's text visible
7. Relevant tags for the business
8. A brief description
9. Business relevance: is this a team photo, service action shot, before/after comparison, equipment, building, or certificate?

Return the analysis in JSON format with these exact fields:
{
  "subjects": ["array of subjects"],
  "scene": "scene type",
  "quality": number,
  "colors": ["hex colors"],
  "isPortrait": boolean,
  "hasText": boolean,
  "tags": ["relevant tags"],
  "description": "brief description",
  "businessRelevance": {
    "isTeamPhoto": boolean,
    "isServiceAction": boolean,
    "isBeforeAfter": boolean,
    "isEquipment": boolean,
    "isBuilding": boolean,
    "isCertificate": boolean
  }
}`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                    detail: 'low' // Use 'low' for cost efficiency, 'high' for better accuracy
                  }
                }
              ]
            }
          ],
          max_completion_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse OpenAI response as JSON');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        subjects: analysis.subjects || ['general content'],
        scene: analysis.scene || 'static scene',
        quality: analysis.quality || 80,
        colors: analysis.colors || ['#000000'],
        isPortrait: analysis.isPortrait || false,
        hasText: analysis.hasText || false,
        confidence: 0.95, // High confidence for OpenAI
        tags: analysis.tags || [],
        description: analysis.description || '',
        businessRelevance: analysis.businessRelevance || {
          isTeamPhoto: false,
          isServiceAction: false,
          isBeforeAfter: false,
          isEquipment: false,
          isBuilding: false,
          isCertificate: false
        }
      };
    } catch (error) {
      console.error('OpenAI Vision API failed:', error);
      throw error;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Analyze with Anthropic Claude Vision
   */
  private async analyzeWithAnthropic(imagePath: string): Promise<ImageAnalysis> {
    const apiKey = this.config.providers.vision.apiKeys.anthropic;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      // Read the image file
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      // Prepare the request to Anthropic Messages API with vision
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.providers.vision.models.anthropic || 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: base64Image
                  }
                },
                {
                  type: 'text',
                  text: `Analyze this image for a ${this.config.businessType || 'professional service'} business website. Please identify:
1. Main subjects in the image
2. The scene type (e.g., action shot, group photo, static scene)
3. Image quality (1-100)
4. Dominant colors (up to 3 hex codes)
5. Whether it's a portrait-oriented image
6. Whether there's text visible
7. Relevant tags for the business
8. A brief description
9. Business relevance: is this a team photo, service action shot, before/after comparison, equipment, building, or certificate?

Return the analysis in JSON format with these exact fields:
{
  "subjects": ["array of subjects"],
  "scene": "scene type",
  "quality": number,
  "colors": ["hex colors"],
  "isPortrait": boolean,
  "hasText": boolean,
  "tags": ["relevant tags"],
  "description": "brief description",
  "businessRelevance": {
    "isTeamPhoto": boolean,
    "isServiceAction": boolean,
    "isBeforeAfter": boolean,
    "isEquipment": boolean,
    "isBuilding": boolean,
    "isCertificate": boolean
  }
}`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse Anthropic response as JSON');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        subjects: analysis.subjects || ['general content'],
        scene: analysis.scene || 'static scene',
        quality: analysis.quality || 80,
        colors: analysis.colors || ['#000000'],
        isPortrait: analysis.isPortrait || false,
        hasText: analysis.hasText || false,
        confidence: 0.90, // High confidence for Claude
        tags: analysis.tags || [],
        description: analysis.description || '',
        businessRelevance: analysis.businessRelevance || {
          isTeamPhoto: false,
          isServiceAction: false,
          isBeforeAfter: false,
          isEquipment: false,
          isBuilding: false,
          isCertificate: false
        }
      };
    } catch (error) {
      console.error('Anthropic Vision API failed:', error);
      throw error;
    }
  }

  /**
   * Calculate relevance score for an image against a context
   */
  calculateRelevanceScore(analysis: ImageAnalysis, context: string): number {
    let score = 0;
    const lowerContext = context.toLowerCase();

    // Check subject matches
    for (const subject of analysis.subjects) {
      if (lowerContext.includes(subject.toLowerCase())) {
        score += 20;
      }
    }

    // Check tag matches
    for (const tag of analysis.tags) {
      if (lowerContext.includes(tag.toLowerCase())) {
        score += 15;
      }
    }

    // Check description relevance
    const descWords = analysis.description.toLowerCase().split(' ');
    const contextWords = lowerContext.split(' ');
    const matches = descWords.filter(word => contextWords.includes(word));
    score += matches.length * 5;

    // Boost for specific business relevance
    if (analysis.businessRelevance) {
      if (lowerContext.includes('team') && analysis.businessRelevance.isTeamPhoto) score += 30;
      if (lowerContext.includes('service') && analysis.businessRelevance.isServiceAction) score += 25;
      if (lowerContext.includes('hero') && analysis.businessRelevance.isBuilding) score += 20;
      if ((lowerContext.includes('before') || lowerContext.includes('after')) && 
          analysis.businessRelevance.isBeforeAfter) score += 35;
    }

    // Quality adjustment
    score = score * (analysis.quality / 100);

    // Confidence adjustment
    score = score * analysis.confidence;

    return Math.min(100, Math.round(score));
  }

  /**
   * Find best matching image for a given context
   */
  async findBestMatch(
    images: string[],
    context: string,
    minScore: number = 70
  ): Promise<{ image: string; score: number } | null> {
    let bestMatch: { image: string; score: number } | null = null;

    for (const imagePath of images) {
      const analysis = await this.analyzeImage(imagePath);
      const score = this.calculateRelevanceScore(analysis, context);

      if (score >= minScore && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { image: imagePath, score };
      }
    }

    return bestMatch;
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyze(imagePaths: string[]): Promise<Map<string, ImageAnalysis>> {
    const results = new Map<string, ImageAnalysis>();

    for (const imagePath of imagePaths) {
      try {
        const analysis = await this.analyzeImage(imagePath);
        results.set(imagePath, analysis);
      } catch (error) {
        console.error(`Failed to analyze ${imagePath}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate alt text from image analysis
   */
  generateAltText(analysis: ImageAnalysis): string {
    if (analysis.businessRelevance?.isTeamPhoto) {
      return 'Professional team members providing quality service';
    }
    
    if (analysis.businessRelevance?.isServiceAction) {
      return `Professional ${analysis.tags.join(' and ')} service in progress`;
    }

    if (analysis.businessRelevance?.isBeforeAfter) {
      return 'Before and after comparison showing service results';
    }

    // Default to description or subject-based alt text
    if (analysis.description) {
      return analysis.description;
    }

    return `Image showing ${analysis.subjects.join(', ')}`;
  }
}

// Export singleton instance for default use
export const imageAnalysis = new ImageAnalysisService();