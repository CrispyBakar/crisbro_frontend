import productImageFallback from "@/assets/ProductImageFallback.png";

type VoucherMenuImageProps = {
  src: string | null;
  className: string;
};

// Foto menu yang ditukar; memakai gambar pengganti bila foto kosong atau gagal dimuat
const VoucherMenuImage = ({ src, className }: VoucherMenuImageProps) => {
  return (
    <img
      src={src ?? productImageFallback}
      alt=""
      loading="lazy"
      decoding="async"
      onError={(event) => {
        // Lepas handler dulu supaya tidak berulang kalau fallback ikut gagal
        event.currentTarget.onerror = null;
        event.currentTarget.src = productImageFallback;
      }}
      className={className}
    />
  );
};

export default VoucherMenuImage;
