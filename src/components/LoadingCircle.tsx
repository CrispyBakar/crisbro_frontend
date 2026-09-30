type LoadingCircleProps = {
  // Tinggi/jarak container; default memenuhi layar untuk loading halaman.
  className?: string;
};

const LoadingCircle = ({ className = "h-dvh" }: LoadingCircleProps) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${className}`}
    >
      <span className="animate-spin size-8 rounded-full border-2 border-gray-300 border-t-berry-red" />
    </div>
  );
};

export default LoadingCircle;
