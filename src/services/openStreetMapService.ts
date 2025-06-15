
export interface BusinessData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  industry: string;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
}

export interface SearchParams {
  location: string;
  industry: string;
  radius: number;
}

class OpenStreetMapService {
  private readonly OVERPASS_API = 'https://overpass-api.de/api/interpreter';
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

  private getIndustryTags(industry: string): string[] {
    const industryTagMap: Record<string, string[]> = {
      'restaurants-food': ['amenity~"^(restaurant|fast_food|cafe|bar|pub)$"'],
      'retail-shopping': ['shop', 'amenity~"^marketplace$"'],
      'health-medical': ['amenity~"^(hospital|clinic|doctors|dentist|pharmacy)$"'],
      'professional-services': ['office', 'amenity~"^(bank|post_office)$"'],
      'home-services': ['craft', 'shop~"^(hardware|doityourself)$"'],
      'beauty-wellness': ['shop~"^(beauty|hairdresser)$"', 'amenity~"^spa$"', 'leisure~"^fitness_centre$"'],
      'automotive': ['shop~"^(car_repair|car|car_parts)$"', 'amenity~"^fuel$"'],
      'real-estate': ['office~"^estate_agent$"'],
      'construction': ['craft~"^(carpenter|electrician|plumber)$"'],
      'education': ['amenity~"^(school|university|college|kindergarten)$"'],
      'entertainment': ['amenity~"^(cinema|theatre)$"', 'leisure'],
      'non-profit': ['amenity~"^(social_facility|community_centre)$"'],
      'all': ['shop', 'amenity', 'office', 'craft', 'leisure']
    };

    return industryTagMap[industry] || industryTagMap['all'];
  }

  private async geocodeLocation(location: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_API}?format=json&q=${encodeURIComponent(location)}&limit=1&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`Nominatim API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          displayName: result.display_name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  }

  private buildOverpassQuery(lat: number, lon: number, radius: number, industryTags: string[]): string {
    const radiusMeters = Math.round(radius * 1609.34); // Convert miles to meters
    
    // Build query parts for each tag
    const queryParts = industryTags.map(tag => {
      if (tag.includes('~')) {
        // For regex tags
        return `
          node[${tag}](around:${radiusMeters},${lat},${lon});
          way[${tag}](around:${radiusMeters},${lat},${lon});`;
      } else {
        // For simple tags
        return `
          node["${tag}"](around:${radiusMeters},${lat},${lon});
          way["${tag}"](around:${radiusMeters},${lat},${lon});`;
      }
    }).join('');
    
    return `[out:json][timeout:30];
(${queryParts}
);
out center meta;`;
  }

  private parseBusinessData(element: any): BusinessData | null {
    const tags = element.tags || {};
    const name = tags.name || tags['name:en'] || tags.brand;
    
    if (!name || name.trim() === '') return null;

    // Get coordinates
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    
    if (!lat || !lon) return null;

    // Extract address information
    const streetNumber = tags['addr:housenumber'] || '';
    const streetName = tags['addr:street'] || '';
    const address = [streetNumber, streetName].filter(Boolean).join(' ') || 'Address not available';
    const city = tags['addr:city'] || '';
    const state = tags['addr:state'] || '';
    const zipCode = tags['addr:postcode'] || '';

    // Determine industry based on tags
    let industry = 'Other';
    if (tags.amenity) {
      switch (tags.amenity) {
        case 'restaurant':
        case 'fast_food':
        case 'cafe':
        case 'bar':
        case 'pub':
          industry = 'Restaurants & Food';
          break;
        case 'hospital':
        case 'clinic':
        case 'doctors':
        case 'dentist':
        case 'pharmacy':
          industry = 'Health & Medical';
          break;
        case 'bank':
        case 'post_office':
          industry = 'Professional Services';
          break;
        case 'fuel':
          industry = 'Automotive';
          break;
        case 'school':
        case 'university':
        case 'college':
          industry = 'Education';
          break;
        default:
          industry = 'Other';
      }
    } else if (tags.shop) {
      switch (tags.shop) {
        case 'beauty':
        case 'hairdresser':
          industry = 'Beauty & Wellness';
          break;
        case 'car_repair':
        case 'car':
        case 'car_parts':
          industry = 'Automotive';
          break;
        case 'hardware':
        case 'doityourself':
          industry = 'Home Services';
          break;
        default:
          industry = 'Retail & Shopping';
      }
    } else if (tags.office) {
      industry = 'Professional Services';
    } else if (tags.craft) {
      industry = 'Home Services';
    }

    return {
      id: `osm_${element.type}_${element.id}`,
      name: name.trim(),
      address,
      city,
      state,
      zipCode,
      phone: tags.phone || tags['contact:phone'],
      email: tags.email || tags['contact:email'],
      website: tags.website || tags['contact:website'],
      industry,
      latitude: lat,
      longitude: lon,
      tags
    };
  }

  async searchBusinesses(params: SearchParams): Promise<BusinessData[]> {
    try {
      console.log('Searching businesses with params:', params);
      
      // First, geocode the location
      const locationData = await this.geocodeLocation(params.location);
      if (!locationData) {
        throw new Error('Could not find the specified location. Please try a different location or be more specific.');
      }

      console.log('Geocoded location:', locationData);

      // Get industry tags
      const industryTags = this.getIndustryTags(params.industry);
      console.log('Industry tags:', industryTags);
      
      // Build and execute Overpass query
      const query = this.buildOverpassQuery(
        locationData.lat,
        locationData.lon,
        params.radius,
        industryTags
      );

      console.log('Overpass query:', query);

      const response = await fetch(this.OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Overpass API error response:', errorText);
        throw new Error(`Failed to search businesses. The search service is temporarily unavailable. Please try again in a moment.`);
      }

      const data = await response.json();
      console.log('Overpass API response elements count:', data.elements?.length || 0);

      if (!data.elements || data.elements.length === 0) {
        return [];
      }

      // Parse and filter business data
      const businesses = data.elements
        .map((element: any) => this.parseBusinessData(element))
        .filter((business: BusinessData | null): business is BusinessData => business !== null)
        .slice(0, 100); // Limit to 100 results to avoid overwhelming the user

      console.log(`Found ${businesses.length} businesses after filtering`);
      return businesses;

    } catch (error) {
      console.error('Business search failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while searching for businesses. Please try again.');
    }
  }
}

export const openStreetMapService = new OpenStreetMapService();
