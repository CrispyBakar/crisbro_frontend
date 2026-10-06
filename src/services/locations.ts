export interface Location {
  location_id: string;
  runchise_id: number;
  name: string;
  shipping_address: string;
  city: string;
  postal_code: string;
  province: string;
  country: string;
  contact_number: string;
  status: string;
  branch_type: string;
  gmap_address: string;
  longitude: string;
  latitude: string;
  sub_brands: {
    sub_brand_id: string;
    runchise_id: number;
    name: string;
    image_url: string;
    location_type: string | null;
    is_select_all_location: boolean;
    enable_online_order: boolean;
  }[];
  created_at: string;
  updated_at: string;
}

export interface ParamsLocation {
  take?: number;
  skip?: number;
  query?: string;
  city?: string;
  status?: string;
  branch_type?: string;
}

export interface LocationsResponse {
  total: number;
  total_page: number;
  locations: Location[];
}

export interface ParamDeleteLocation {
  location_id: string;
}

export interface GenerateLocationResponse {
  total_from_runchise: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  unmapped_sub_brand_ids?: [];
}

export const getLocations = async ({
  take,
  skip,
  query,
  city,
  status,
  branch_type,
}: ParamsLocation): Promise<LocationsResponse> => {
  const params = new URLSearchParams({
    ...(take ? { take: String(take) } : {}),
    ...(skip ? { skip: String(skip) } : {}),
    ...(query ? { query: String(query) } : {}),
    ...(city ? { city: String(city) } : {}),
    ...(status ? { status: String(status) } : {}),
    ...(branch_type ? { branch_type } : {}),
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/locations?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat lokasi");
  }

  const data = await res.json();

  const locations = data.data;

  return locations;
};

// Backend membatasi 100 lokasi per permintaan
const LOCATIONS_PAGE_SIZE = 100;

// Seluruh outlet untuk halaman customer; central kitchen tidak ikut
export const getAllOutlets = async (): Promise<Location[]> => {
  const outlets: Location[] = [];
  let total = Infinity;

  while (outlets.length < total) {
    const page = await getLocations({
      take: LOCATIONS_PAGE_SIZE,
      skip: outlets.length,
      branch_type: "outlet",
    });
    total = page.total;
    if (page.locations.length === 0) break;
    outlets.push(...page.locations);
  }

  return outlets;
};

export const deleteLocation = async ({
  location_id,
}: ParamDeleteLocation): Promise<Location> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/locations/${location_id}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "x-csrf-protection": "1",
      },
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal delete lokasi");
  }

  const data = await res.json();

  return data.data;
};

export const generateLocations =
  async (): Promise<GenerateLocationResponse> => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/locations/generate`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "x-csrf-protection": "1",
        },
      },
    );

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message ?? "Gagal generate lokasi");
    }

    const data = await res.json();

    return data.data;
  };
