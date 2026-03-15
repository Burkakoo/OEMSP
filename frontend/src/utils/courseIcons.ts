/**
 * Course icon utilities
 * Maps course categories to appropriate background icons
 */

// Category to icon mapping
export const getCourseIcon = (category: string): string => {
  const categoryLower = category.toLowerCase();

  // Technology & Programming
  if (categoryLower.includes('programming') || categoryLower.includes('computer science')) {
    return '💻';
  }
  if (categoryLower.includes('web development')) {
    return '🌐';
  }
  if (categoryLower.includes('mobile development')) {
    return '📱';
  }
  if (categoryLower.includes('data science') || categoryLower.includes('python')) {
    return '📊';
  }
  if (categoryLower.includes('database')) {
    return '🗄️';
  }
  if (categoryLower.includes('devops') || categoryLower.includes('cloud')) {
    return '☁️';
  }
  if (categoryLower.includes('game development')) {
    return '🎮';
  }
  if (categoryLower.includes('security') || categoryLower.includes('cybersecurity')) {
    return '🔒';
  }

  // Business & Professional
  if (categoryLower.includes('business') || categoryLower.includes('management')) {
    return '💼';
  }
  if (categoryLower.includes('finance') || categoryLower.includes('accounting')) {
    return '💰';
  }
  if (categoryLower.includes('marketing')) {
    return '📈';
  }

  // Design & Creative
  if (categoryLower.includes('design')) {
    return '🎨';
  }
  if (categoryLower.includes('photography')) {
    return '📷';
  }
  if (categoryLower.includes('music') || categoryLower.includes('audio')) {
    return '🎵';
  }

  // Language & Education
  if (categoryLower.includes('language')) {
    return '🗣️';
  }
  if (categoryLower.includes('math') || categoryLower.includes('mathematics')) {
    return '🔢';
  }
  if (categoryLower.includes('science')) {
    return '🔬';
  }

  // Health & Wellness
  if (categoryLower.includes('health') || categoryLower.includes('fitness')) {
    return '🏥';
  }
  if (categoryLower.includes('psychology') || categoryLower.includes('mental')) {
    return '🧠';
  }

  // Arts & Humanities
  if (categoryLower.includes('art') || categoryLower.includes('drawing')) {
    return '🎨';
  }
  if (categoryLower.includes('history')) {
    return '📚';
  }
  if (categoryLower.includes('literature') || categoryLower.includes('writing')) {
    return '✍️';
  }

  // Default icon
  return '📚';
};

// Get background color based on category
export const getCourseBackgroundColor = (category: string): string => {
  const categoryLower = category.toLowerCase();

  // Technology categories - blue tones
  if (categoryLower.includes('programming') || categoryLower.includes('computer science') ||
      categoryLower.includes('web development') || categoryLower.includes('mobile development')) {
    return 'rgba(25, 118, 210, 0.1)'; // Blue
  }

  // Data & Analytics - green tones
  if (categoryLower.includes('data science') || categoryLower.includes('database') ||
      categoryLower.includes('analytics')) {
    return 'rgba(76, 175, 80, 0.1)'; // Green
  }

  // Cloud & DevOps - purple tones
  if (categoryLower.includes('devops') || categoryLower.includes('cloud')) {
    return 'rgba(156, 39, 176, 0.1)'; // Purple
  }

  // Security - red tones
  if (categoryLower.includes('security') || categoryLower.includes('cybersecurity')) {
    return 'rgba(244, 67, 54, 0.1)'; // Red
  }

  // Business - orange tones
  if (categoryLower.includes('business') || categoryLower.includes('finance') ||
      categoryLower.includes('marketing')) {
    return 'rgba(255, 152, 0, 0.1)'; // Orange
  }

  // Design & Creative - pink tones
  if (categoryLower.includes('design') || categoryLower.includes('photography') ||
      categoryLower.includes('art')) {
    return 'rgba(233, 30, 99, 0.1)'; // Pink
  }

  // Education - teal tones
  if (categoryLower.includes('language') || categoryLower.includes('math') ||
      categoryLower.includes('science')) {
    return 'rgba(0, 150, 136, 0.1)'; // Teal
  }

  // Default - gray tones
  return 'rgba(96, 96, 96, 0.1)'; // Gray
};