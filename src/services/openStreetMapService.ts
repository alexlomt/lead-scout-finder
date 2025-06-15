
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
      'restaurants-food': ['amenity=restaurant', 'amenity=fast_food', 'amenity=cafe', 'amenity=bar', 'amenity=pub'],
      'retail-shopping': ['shop=*', 'amenity=marketplace'],
      'health-medical': ['amenity=hospital', 'amenity=clinic', 'amenity=doctors', 'amenity=dentist', 'amenity=pharmacy'],
      'professional-services': ['office=*', 'amenity=bank', 'amenity=post_office'],
      'home-services': ['craft=*', 'shop=hardware', 'shop=doityourself'],
      'beauty-wellness': ['shop=beauty', 'shop=hairdresser', 'amenity=spa', 'leisure=fitness_centre'],
      'automotive': ['shop=car_repair', 'shop=car', 'amenity=fuel', 'shop=car_parts'],
      'real-estate': ['office=estate_agent'],
      'construction': ['craft=carpenter', 'craft=electrician', 'craft=plumber'],
      'education': ['amenity=school', 'amenity=university', 'amenity=college', 'amenity=kindergarten'],
      'entertainment': ['amenity=cinema', 'amenity=theatre', 'leisure=*'],
      'non-profit': ['amenity=social_facility', 'amenity=community_centre'],
      'all': ['shop=*', 'amenity=*', 'office=*', 'craft=*', 'leisure=*']
    };

    return industryTagMap[industry] || industryTagMap['all'];
  }

  private async geocodeLocation(location: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_API}?format=json&q=${encodeURIComponent(location)}&limit=1&addressdetails=1`
      );
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
    const radiusMeters = radius * 1609.34; // Convert miles to meters
    
    const tagQueries = industryTags.map(tag => `node[${tag}](around:${radiusMeters},${lat},${lon});`).join('\n');
    const wayQueries = industryTags.map(tag => `way[${tag}](around:${radiusMeters},${lat},${lon});`).join('\n');
    
    return `
      [out:json][timeout:25];
      (
        ${tagQueries}
        ${wayQueries}
      );
      out center meta;
    `;
  }

  private parseBusinessData(element: any): BusinessData | null {
    const tags = element.tags || {};
    const name = tags.name || tags['name:en'] || tags.brand || 'Unnamed Business';
    
    if (!name || name === 'Unnamed Business') return null;

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
      name,
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
        throw new Error('Could not find the specified location');
      }

      console.log('Geocoded location:', locationData);

      // Get industry tags
      const industryTags = this.getIndustryTags(params.industry);
      
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
        throw new Error(`Overpass API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Overpass API response:', data);

      if (!data.elements) {
        return [];
      }

      // Parse and filter business data
      const businesses = data.elements
        .map((element: any) => this.parseBusinessData(element))
        .filter((business: BusinessData | null): business is BusinessData => business !== null)
        .filter((business: BusinessData) => business.name !== 'Unnamed Business');

      console.log(`Found ${businesses.length} businesses`);
      return businesses;

    } catch (error) {
      console.error('Business search failed:', error);
      throw error;
    }
  }
}

export const openStreetMapService = new OpenStreetMapService();
