export class ComplianceValidators {
  
    static validateMSNCompliance(article: any): { passed: boolean; errors: string[]; warnings: string[] } {
      const errors: string[] = [];
      const warnings: string[] = [];
  
      // MSN specific validations
      if (article.title.length > 100) {
        errors.push('MSN title cannot exceed 100 characters');
      }
  
      if (article.body.length < 300) {
        errors.push('MSN articles must be at least 300 characters');
      }
  
      if (article.body.length > 5000) {
        warnings.push('MSN prefers articles under 5000 characters');
      }
  
      if (!article.thumbnail) {
        errors.push('MSN requires a thumbnail image');
      }
  
      // Check for prohibited content
      const prohibitedKeywords = ['gambling', 'adult content', 'violence'];
      const content = (article.title + ' ' + article.body).toLowerCase();
      
      prohibitedKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          errors.push(`Article contains prohibited content: ${keyword}`);
        }
      });
  
      // Check required metadata
      const requiredFields = ['author', 'category'];
      requiredFields.forEach(field => {
        if (!article[field] || article[field].trim() === '') {
          errors.push(`Required field missing: ${field}`);
        }
      });
  
      return {
        passed: errors.length === 0,
        errors,
        warnings
      };
    }
  
    static validateGoogleNewsCompliance(article: any): { passed: boolean; errors: string[]; warnings: string[] } {
      const errors: string[] = [];
      const warnings: string[] = [];
  
      // Google News specific validations
      if (article.title.length > 110) {
        errors.push('Google News title cannot exceed 110 characters');
      }
  
      if (article.body.length < 200) {
        errors.push('Google News articles must be at least 200 characters');
      }
  
      if (!article.author) {
        errors.push('Google News requires author attribution');
      }
  
      // Check for clickbait patterns
      const clickbaitPatterns = [
        /you won't believe/i,
        /shocking/i,
        /this will blow your mind/i
      ];
  
      clickbaitPatterns.forEach(pattern => {
        if (pattern.test(article.title)) {
          warnings.push('Title may be considered clickbait by Google News');
        }
      });
  
      return {
        passed: errors.length === 0,
        errors,
        warnings
      };
    }
  
    static validateAppleNewsCompliance(article: any): { passed: boolean; errors: string[]; warnings: string[] } {
      const errors: string[] = [];
      const warnings: string[] = [];
  
      // Apple News specific validations
      if (article.title.length > 120) {
        errors.push('Apple News title cannot exceed 120 characters');
      }
  
      if (!article.thumbnail) {
        errors.push('Apple News requires high-quality images');
      }
  
      if (article.body.length < 250) {
        errors.push('Apple News articles should be at least 250 characters');
      }
  
      // Check for Apple News preferred categories
      const preferredCategories = ['technology', 'business', 'entertainment', 'sports', 'health'];
      if (!preferredCategories.includes(article.category?.toLowerCase())) {
        warnings.push('Category may not be optimal for Apple News distribution');
      }
  
      return {
        passed: errors.length === 0,
        errors,
        warnings
      };
    }
  
    static getValidatorForFeed(feedType: string) {
      switch (feedType.toLowerCase()) {
        case 'msn':
          return this.validateMSNCompliance;
        case 'google news':
          return this.validateGoogleNewsCompliance;
        case 'apple news':
          return this.validateAppleNewsCompliance;
        default:
          return (article: any) => ({ passed: true, errors: [], warnings: [] });
      }
    }
  }