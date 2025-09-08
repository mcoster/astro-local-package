/**
 * Image System Configuration
 * 
 * Central configuration for the Intelligent Image Injection System
 */

export interface ImageQualityPreset {
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'jpg' | 'png' | 'avif';
}

export interface ImageConfig {
  // API Configuration
  providers: {
    vision: {
      chain: ('openai' | 'anthropic' | 'mock')[];
      apiKeys: {
        openai?: string;
        anthropic?: string;
      };
      models: {
        openai?: string;
        anthropic?: string;
      };
    };
    stock: {
      chain: ('unsplash' | 'pexels' | 'pixabay')[];
      apiKeys: {
        unsplash?: string;
        pexels?: string;
        pixabay?: string;
      };
      defaultQuery?: string;
    };
  };

  // Fallback Configuration
  fallback: {
    chain: ('user' | 'stock' | 'placeholder')[];
    minRelevanceScore: number;
    placeholderStyle: 'gradient' | 'pattern' | 'blur' | 'placeholder';
    placeholderColors: {
      primary: string;
      secondary: string;
    };
  };

  // Image Processing
  processing: {
    formats: string[];
    maxFileSize: number; // in bytes
    autoOptimize: boolean;
    generateWebP: boolean;
    generateAVIF: boolean;
  };

  // Quality Presets by Component
  qualityPresets: {
    hero: ImageQualityPreset;
    content: ImageQualityPreset;
    thumbnail: ImageQualityPreset;
    gallery: ImageQualityPreset;
    team: ImageQualityPreset;
    service: ImageQualityPreset;
  };

  // Matching Algorithm
  matching: {
    weights: {
      subjectMatch: number;
      tagMatch: number;
      descriptionMatch: number;
      businessRelevance: number;
      quality: number;
    };
    boosts: {
      exactFilenameMatch: number;
      componentNameMatch: number;
      recentImage: number;
    };
  };

  // Development Settings
  development: {
    showDebugInfo: boolean;
    showImageSource: boolean;
    logMatching: boolean;
    mockAnalysis: boolean;
  };
}

/**
 * Default configuration
 */
export const defaultImageConfig: ImageConfig = {
  providers: {
    vision: {
      chain: ['openai', 'anthropic', 'mock'], // Try OpenAI first, then Anthropic, then mock
      apiKeys: {
        openai: process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY
      },
      models: {
        openai: process.env.VISION_MODEL_OPENAI || 'gpt-4-vision-preview',
        anthropic: process.env.VISION_MODEL_ANTHROPIC || 'claude-3-opus-20240229'
      }
    },
    stock: {
      chain: ['unsplash', 'pexels', 'pixabay'], // Try in this order
      apiKeys: {
        unsplash: process.env.UNSPLASH_ACCESS_KEY,
        pexels: process.env.PEXELS_API_KEY,
        pixabay: process.env.PIXABAY_API_KEY
      },
      defaultQuery: 'professional business service'
    }
  },

  fallback: {
    chain: ['user', 'stock', 'placeholder'], // Try user images, then stock, then placeholder
    minRelevanceScore: 70,
    placeholderStyle: 'gradient',
    placeholderColors: {
      primary: '#4f46e5',
      secondary: '#7c3aed'
    }
  },

  processing: {
    formats: ['webp', 'jpg', 'png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    autoOptimize: true,
    generateWebP: true,
    generateAVIF: false // Disabled by default for faster builds
  },

  qualityPresets: {
    hero: {
      width: 1920,
      height: 1080,
      quality: 85,
      format: 'webp'
    },
    content: {
      width: 1200,
      height: 800,
      quality: 80,
      format: 'webp'
    },
    thumbnail: {
      width: 400,
      height: 300,
      quality: 75,
      format: 'webp'
    },
    gallery: {
      width: 800,
      height: 600,
      quality: 80,
      format: 'webp'
    },
    team: {
      width: 600,
      height: 600,
      quality: 80,
      format: 'webp'
    },
    service: {
      width: 800,
      height: 600,
      quality: 80,
      format: 'webp'
    }
  },

  matching: {
    weights: {
      subjectMatch: 20,
      tagMatch: 15,
      descriptionMatch: 10,
      businessRelevance: 30,
      quality: 25
    },
    boosts: {
      exactFilenameMatch: 50,
      componentNameMatch: 20,
      recentImage: 5
    }
  },

  development: {
    showDebugInfo: process.env.NODE_ENV === 'development',
    showImageSource: process.env.SHOW_IMAGE_SOURCE === 'true',
    logMatching: process.env.LOG_IMAGE_MATCHING === 'true',
    mockAnalysis: true // Always use mock for now
  }
};

/**
 * Load configuration from file or environment
 */
export async function loadImageConfig(): Promise<ImageConfig> {
  try {
    // Try to load custom config from business-images
    const customConfigPath = 'business-images/image-config.json';
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const fullPath = path.join(process.cwd(), customConfigPath);
    const customConfig = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
    
    // Merge with defaults
    return {
      ...defaultImageConfig,
      ...customConfig,
      providers: {
        ...defaultImageConfig.providers,
        ...customConfig.providers
      },
      fallback: {
        ...defaultImageConfig.fallback,
        ...customConfig.fallback
      },
      processing: {
        ...defaultImageConfig.processing,
        ...customConfig.processing
      },
      qualityPresets: {
        ...defaultImageConfig.qualityPresets,
        ...customConfig.qualityPresets
      },
      matching: {
        ...defaultImageConfig.matching,
        ...customConfig.matching
      },
      development: {
        ...defaultImageConfig.development,
        ...customConfig.development
      }
    };
  } catch {
    // Return defaults if no custom config
    return defaultImageConfig;
  }
}

/**
 * Get quality preset for a component type
 */
export function getQualityPreset(
  component: string,
  config: ImageConfig = defaultImageConfig
): ImageQualityPreset {
  const presetKey = component.toLowerCase() as keyof typeof config.qualityPresets;
  return config.qualityPresets[presetKey] || config.qualityPresets.content;
}

/**
 * Check if a file format is supported
 */
export function isSupportedFormat(
  filename: string,
  config: ImageConfig = defaultImageConfig
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? config.processing.formats.includes(ext) : false;
}

/**
 * Get environment-based API configuration
 */
export function getAPIConfig() {
  return {
    vision: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY
    },
    stock: {
      unsplash: process.env.UNSPLASH_ACCESS_KEY,
      pexels: process.env.PEXELS_API_KEY,
      pixabay: process.env.PIXABAY_API_KEY
    }
  };
}