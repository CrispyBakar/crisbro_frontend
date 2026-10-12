export interface CustomerAcquisition {
  customer_acquisition_id: string;
  customer_id: string;
  // Dari mana customer mengenal Crisbar
  source: string;
  // Lewat mana jawaban itu dicatat
  captured_via: string;
  created_at: string;
}

export interface CreateMyCustomerAcquisitionPayload {
  source: string;
  captured_via: string;
}

// Khusus role customer; customer diambil backend dari sesi login. Satu customer
// hanya punya satu data akuisisi: null berarti datanya sudah pernah tercatat
// (backend menjawab 409).
export const createMyCustomerAcquisition = async (
  payload: CreateMyCustomerAcquisitionPayload,
): Promise<CustomerAcquisition | null> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customer-acquisitions/me`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-protection": "1",
      },
      body: JSON.stringify(payload),
    },
  );

  if (res.status === 409) return null;

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    // Error validasi zod dikirim sebagai objek (fieldErrors), bukan teks
    throw new Error(
      typeof error?.message === "string"
        ? error.message
        : "Gagal menyimpan jawaban, coba lagi nanti",
    );
  }

  const result = await res.json();

  return result.data;
};
