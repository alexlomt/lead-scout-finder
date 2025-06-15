
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
      'restaurants-food': [
        'amenity=restaurant',
        'amenity=fast_food',
        'amenity=cafe',
        'amenity=bar',
        'amenity=pub',
        'amenity=food_court',
        'amenity=ice_cream',
        'shop=bakery',
        'shop=confectionery',
        'shop=deli',
        'shop=beverages'
      ],
      'retail-shopping': [
        'shop=clothes',
        'shop=shoes',
        'shop=jewelry',
        'shop=books',
        'shop=electronics',
        'shop=furniture',
        'shop=department_store',
        'shop=mall',
        'shop=supermarket',
        'shop=convenience',
        'shop=general',
        'shop=variety_store',
        'shop=gift',
        'shop=toys',
        'shop=sports',
        'shop=outdoor'
      ],
      'health-medical': [
        'amenity=hospital',
        'amenity=clinic',
        'amenity=doctors',
        'amenity=dentist',
        'amenity=pharmacy',
        'amenity=veterinary',
        'healthcare=doctor',
        'healthcare=dentist',
        'healthcare=physiotherapist',
        'healthcare=optometrist'
      ],
      'professional-services': [
        'office=lawyer',
        'office=accountant',
        'office=company',
        'office=employment_agency',
        'office=estate_agent',
        'office=insurance',
        'office=financial',
        'amenity=bank',
        'amenity=post_office',
        'office=consulting'
      ],
      'home-services': [
        'craft=carpenter',
        'craft=electrician',
        'craft=plumber',
        'craft=painter',
        'craft=roofer',
        'shop=hardware',
        'shop=doityourself',
        'shop=garden_centre',
        'shop=locksmith',
        'office=contractor'
      ],
      'beauty-wellness': [
        'shop=beauty',
        'shop=hairdresser',
        'shop=cosmetics',
        'amenity=spa',
        'leisure=fitness_centre',
        'shop=massage',
        'amenity=nail_salon',
        'shop=tattoo'
      ],
      'automotive': [
        'shop=car_repair',
        'shop=car',
        'shop=car_parts',
        'shop=tyres',
        'amenity=fuel',
        'shop=motorcycle',
        'amenity=car_wash',
        'amenity=charging_station'
      ],
      'real-estate': [
        'office=estate_agent',
        'office=property_management'
      ],
      'construction': [
        'craft=carpenter',
        'craft=electrician',
        'craft=plumber',
        'craft=roofer',
        'craft=painter',
        'craft=mason',
        'office=contractor',
        'industrial=construction'
      ],
      'education': [
        'amenity=school',
        'amenity=university',
        'amenity=college',
        'amenity=kindergarten',
        'amenity=driving_school',
        'amenity=language_school',
        'office=educational_institution'
      ],
      'entertainment': [
        'amenity=cinema',
        'amenity=theatre',
        'leisure=bowling_alley',
        'leisure=amusement_arcade',
        'leisure=miniature_golf',
        'amenity=nightclub',
        'tourism=attraction'
      ],
      'non-profit': [
        'amenity=social_facility',
        'amenity=community_centre',
        'office=ngo',
        'office=charity'
      ]
    };

    return industryTagMap[industry] || [];
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
    
    if (industryTags.length === 0) {
      throw new Error('No valid tags found for the selected industry');
    }
    
    // Build query parts for each specific tag
    const queryParts = industryTags.map(tag => {
      return `
        node["${tag.split('=')[0]}"="${tag.split('=')[1]}"](around:${radiusMeters},${lat},${lon});
        way["${tag.split('=')[0]}"="${tag.split('=')[1]}"](around:${radiusMeters},${lat},${lon});`;
    }).join('');
    
    return `[out:json][timeout:30];
(${queryParts}
);
out center meta;`;
  }

  private matchesIndustryFilter(tags: Record<string, string>, industryFilter: string): boolean {
    const industryTags = this.getIndustryTags(industryFilter);
    
    // Check if any of the business tags match our industry filter
    for (const tag of industryTags) {
      const [key, value] = tag.split('=');
      if (tags[key] === value) {
        return true;
      }
    }
    
    return false;
  }

  private parseBusinessData(element: any, industryFilter: string): BusinessData | null {
    const tags = element.tags || {};
    const name = tags.name || tags['name:en'] || tags.brand;
    
    if (!name || name.trim() === '') return null;

    // Strict industry filtering - only include if it matches our filter
    if (industryFilter !== 'all' && !this.matchesIndustryFilter(tags, industryFilter)) {
      return null;
    }

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

    // Determine industry based on tags with more specific mapping
    let industry = 'Other';
    
    // Check amenity tags
    if (tags.amenity) {
      const amenityMap: Record<string, string> = {
        'restaurant': 'Restaurants & Food',
        'fast_food': 'Restaurants & Food',
        'cafe': 'Restaurants & Food',
        'bar': 'Restaurants & Food',
        'pub': 'Restaurants & Food',
        'food_court': 'Restaurants & Food',
        'ice_cream': 'Restaurants & Food',
        'hospital': 'Health & Medical',
        'clinic': 'Health & Medical',
        'doctors': 'Health & Medical',
        'dentist': 'Health & Medical',
        'pharmacy': 'Health & Medical',
        'veterinary': 'Health & Medical',
        'bank': 'Professional Services',
        'post_office': 'Professional Services',
        'fuel': 'Automotive',
        'car_wash': 'Automotive',
        'school': 'Education',
        'university': 'Education',
        'college': 'Education',
        'kindergarten': 'Education',
        'cinema': 'Entertainment',
        'theatre': 'Entertainment',
        'nightclub': 'Entertainment',
        'spa': 'Beauty & Wellness'
      };
      industry = amenityMap[tags.amenity] || 'Other';
    }
    
    // Check shop tags
    else if (tags.shop) {
      const shopMap: Record<string, string> = {
        'beauty': 'Beauty & Wellness',
        'hairdresser': 'Beauty & Wellness',
        'cosmetics': 'Beauty & Wellness',
        'massage': 'Beauty & Wellness',
        'tattoo': 'Beauty & Wellness',
        'car_repair': 'Automotive',
        'car': 'Automotive',
        'car_parts': 'Automotive',
        'tyres': 'Automotive',
        'motorcycle': 'Automotive',
        'hardware': 'Home Services',
        'doityourself': 'Home Services',
        'garden_centre': 'Home Services',
        'locksmith': 'Home Services',
        'bakery': 'Restaurants & Food',
        'confectionery': 'Restaurants & Food',
        'deli': 'Restaurants & Food',
        'beverages': 'Restaurants & Food'
      };
      industry = shopMap[tags.shop] || 'Retail & Shopping';
    }
    
    // Check office tags
    else if (tags.office) {
      const officeMap: Record<string, string> = {
        'lawyer': 'Professional Services',
        'accountant': 'Professional Services',
        'company': 'Professional Services',
        'employment_agency': 'Professional Services',
        'estate_agent': 'Real Estate',
        'property_management': 'Real Estate',
        'insurance': 'Professional Services',
        'financial': 'Professional Services',
        'consulting': 'Professional Services',
        'contractor': 'Construction',
        'educational_institution': 'Education',
        'ngo': 'Non-Profit',
        'charity': 'Non-Profit'
      };
      industry = officeMap[tags.office] || 'Professional Services';
    }
    
    // Check craft tags
    else if (tags.craft) {
      industry = 'Home Services';
    }
    
    // Check healthcare tags
    else if (tags.healthcare) {
      industry = 'Health & Medical';
    }
    
    // Check leisure tags
    else if (tags.leisure) {
      const leisureMap: Record<string, string> = {
        'fitness_centre': 'Beauty & Wellness',
        'bowling_alley': 'Entertainment',
        'amusement_arcade': 'Entertainment',
        'miniature_golf': 'Entertainment'
      };
      industry = leisureMap[tags.leisure] || 'Entertainment';
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
      if (industryTags.length === 0 && params.industry !== 'all') {
        throw new Error('Selected industry category is not supported. Please choose a different industry.');
      }

      console.log('Industry tags:', industryTags);
      
      // For 'all' industries, we'll search broadly but still filter results
      const searchTags = params.industry === 'all' ? 
        ['amenity', 'shop', 'office', 'craft', 'healthcare', 'leisure'] : 
        industryTags;
      
      // Build and execute Overpass query
      let query: string;
      if (params.industry === 'all') {
        // For 'all', search for common business tags
        const radiusMeters = Math.round(params.radius * 1609.34);
        query = `[out:json][timeout:30];
(
  node["amenity"](around:${radiusMeters},${locationData.lat},${locationData.lon});
  way["amenity"](around:${radiusMeters},${locationData.lat},${locationData.lon});
  node["shop"](around:${radiusMeters},${locationData.lat},${locationData.lon});
  way["shop"](around:${radiusMeters},${locationData.lat},${locationData.lon});
  node["office"](around:${radiusMeters},${locationData.lat},${locationData.lon});
  way["office"](around:${radiusMeters},${locationData.lat},${locationData.lon});
);
out center meta;`;
      } else {
        query = this.buildOverpassQuery(
          locationData.lat,
          locationData.lon,
          params.radius,
          industryTags
        );
      }

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

      // Parse and filter business data with strict industry filtering
      const businesses = data.elements
        .map((element: any) => this.parseBusinessData(element, params.industry))
        .filter((business: BusinessData | null): business is BusinessData => business !== null)
        .slice(0, 100); // Limit to 100 results to avoid overwhelming the user

      console.log(`Found ${businesses.length} businesses after filtering for industry: ${params.industry}`);
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
