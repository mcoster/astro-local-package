/**
 * Stock Photo Service
 * 
 * Fetches stock photos from multiple providers with fallback support
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { loadImageConfig } from '../config/image-config';

export interface StockPhoto {
  id: string;
  url: string;
  downloadUrl: string;
  photographer: string;
  photographerUrl?: string;
  source: 'unsplash' | 'pexels' | 'pixabay';
  description?: string;
  altText: string;
  width: number;
  height: number;
  license?: string;
  attribution?: string;
}

export interface StockPhotoSearchResult {
  photos: StockPhoto[];
  totalResults: number;
  provider: string;
}

export class StockPhotoService {
  private config: any = null;
  private cacheFile = path.join(process.cwd(), 'business-images/stock-cache.json');
  private cache: Record<string, StockPhotoSearchResult> = {};
  private initialized = false;

  constructor() {
    // Configuration will be loaded on first use
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    await this.loadConfig();
    await this.loadCache();
    this.initialized = true;
  }

  /**
   * Load configuration
   */
  private async loadConfig(): Promise<void> {
    this.config = await loadImageConfig();
  }

  /**
   * Load cache from disk
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
   * Save cache to disk
   */
  private async saveCache(): Promise<void> {
    await fs.writeFile(
      this.cacheFile,
      JSON.stringify(this.cache, null, 2),
      'utf-8'
    );
  }

  /**
   * Search for stock photos with fallback chain
   */
  async searchPhotos(query: string, limit: number = 10): Promise<StockPhotoSearchResult | null> {
    // Ensure service is initialized
    await this.ensureInitialized();
    
    // Check cache first
    const cacheKey = `${query}-${limit}`;
    if (this.cache[cacheKey]) {
      const cached = this.cache[cacheKey];
      // Check if cache is less than 24 hours old
      const cacheTime = new Date(cached.cachedAt || 0).getTime();
      if (Date.now() - cacheTime < 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    // Try each provider in the chain
    const providers = this.config.providers.stock.chain;
    let result: StockPhotoSearchResult | null = null;

    for (const provider of providers) {
      try {
        console.log(`Searching ${provider} for: ${query}`);
        
        switch (provider) {
          case 'unsplash':
            if (this.config.providers.stock.apiKeys.unsplash) {
              result = await this.searchUnsplash(query, limit);
            } else {
              console.log('Unsplash API key not configured, skipping...');
              continue;
            }
            break;
          case 'pexels':
            if (this.config.providers.stock.apiKeys.pexels) {
              result = await this.searchPexels(query, limit);
            } else {
              console.log('Pexels API key not configured, skipping...');
              continue;
            }
            break;
          case 'pixabay':
            if (this.config.providers.stock.apiKeys.pixabay) {
              result = await this.searchPixabay(query, limit);
            } else {
              console.log('Pixabay API key not configured, skipping...');
              continue;
            }
            break;
        }

        if (result && result.photos.length > 0) {
          console.log(`Found ${result.photos.length} photos from ${provider}`);
          
          // Cache the result
          this.cache[cacheKey] = {
            ...result,
            cachedAt: new Date().toISOString()
          };
          await this.saveCache();
          
          return result;
        }
      } catch (error) {
        console.warn(`Failed to search ${provider}:`, error.message);
        // Continue to next provider
      }
    }

    return null;
  }

  /**
   * Search Unsplash for photos
   */
  private async searchUnsplash(query: string, limit: number): Promise<StockPhotoSearchResult> {
    const apiKey = this.config.providers.stock.apiKeys.unsplash;
    if (!apiKey) {
      throw new Error('Unsplash API key not configured');
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}`,
        {
          headers: {
            'Authorization': `Client-ID ${apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();

      const photos: StockPhoto[] = data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        downloadUrl: photo.urls.full,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        source: 'unsplash',
        description: photo.description || photo.alt_description,
        altText: photo.alt_description || query,
        width: photo.width,
        height: photo.height,
        license: 'Unsplash License',
        attribution: `Photo by ${photo.user.name} on Unsplash`
      }));

      return {
        photos,
        totalResults: data.total,
        provider: 'unsplash'
      };
    } catch (error) {
      console.error('Unsplash search failed:', error);
      throw error;
    }
  }

  /**
   * Search Pexels for photos
   */
  private async searchPexels(query: string, limit: number): Promise<StockPhotoSearchResult> {
    const apiKey = this.config.providers.stock.apiKeys.pexels;
    if (!apiKey) {
      throw new Error('Pexels API key not configured');
    }

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}`,
        {
          headers: {
            'Authorization': apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();

      const photos: StockPhoto[] = data.photos.map((photo: any) => ({
        id: photo.id.toString(),
        url: photo.src.large,
        downloadUrl: photo.src.original,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        source: 'pexels',
        description: photo.alt,
        altText: photo.alt || query,
        width: photo.width,
        height: photo.height,
        license: 'Pexels License',
        attribution: `Photo by ${photo.photographer} from Pexels`
      }));

      return {
        photos,
        totalResults: data.total_results,
        provider: 'pexels'
      };
    } catch (error) {
      console.error('Pexels search failed:', error);
      throw error;
    }
  }

  /**
   * Search Pixabay for photos
   */
  private async searchPixabay(query: string, limit: number): Promise<StockPhotoSearchResult> {
    const apiKey = this.config.providers.stock.apiKeys.pixabay;
    if (!apiKey) {
      throw new Error('Pixabay API key not configured');
    }

    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=${limit}&image_type=photo`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.status}`);
      }

      const data = await response.json();

      const photos: StockPhoto[] = data.hits.map((photo: any) => ({
        id: photo.id.toString(),
        url: photo.largeImageURL,
        downloadUrl: photo.largeImageURL,
        photographer: photo.user,
        photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
        source: 'pixabay',
        description: photo.tags,
        altText: photo.tags || query,
        width: photo.imageWidth,
        height: photo.imageHeight,
        license: 'Pixabay License',
        attribution: `Image by ${photo.user} from Pixabay`
      }));

      return {
        photos,
        totalResults: data.totalHits,
        provider: 'pixabay'
      };
    } catch (error) {
      console.error('Pixabay search failed:', error);
      throw error;
    }
  }

  /**
   * Download a stock photo to local storage
   */
  async downloadPhoto(photo: StockPhoto, destinationPath: string): Promise<string> {
    try {
      const response = await fetch(photo.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const fileName = `${photo.source}-${photo.id}.jpg`;
      const filePath = path.join(destinationPath, fileName);

      // Ensure directory exists
      await fs.mkdir(destinationPath, { recursive: true });

      // Save the image
      await fs.writeFile(filePath, Buffer.from(buffer));

      // Save attribution file
      const attributionPath = path.join(destinationPath, `${photo.source}-${photo.id}-attribution.txt`);
      await fs.writeFile(
        attributionPath,
        `${photo.attribution}\n\nPhotographer: ${photo.photographer}\nSource: ${photo.source}\nLicense: ${photo.license}`
      );

      console.log(`Downloaded ${fileName} from ${photo.source}`);
      return filePath;
    } catch (error) {
      console.error(`Failed to download photo:`, error);
      throw error;
    }
  }

  /**
   * Search and download best matching photo for a context
   */
  async fetchBestMatch(context: string, destinationPath: string): Promise<string | null> {
    // Ensure service is initialized
    await this.ensureInitialized();
    
    // Generate search query from context
    const query = this.generateSearchQuery(context);
    
    // Search for photos
    const results = await this.searchPhotos(query, 5);
    
    if (!results || results.photos.length === 0) {
      console.log(`No stock photos found for: ${query}`);
      return null;
    }

    // Download the first (best) match
    const bestPhoto = results.photos[0];
    const localPath = await this.downloadPhoto(bestPhoto, destinationPath);
    
    return localPath;
  }

  /**
   * Generate search query from context
   */
  private generateSearchQuery(context: string): string {
    const businessQuery = this.config.providers.stock.defaultQuery || 'professional service';
    
    // Extract key terms from context
    const keywords = context.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');
    
    return keywords || businessQuery;
  }
}

// Export singleton instance
export const stockPhotoService = new StockPhotoService();