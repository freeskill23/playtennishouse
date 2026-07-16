export function Logo({ size = 40, imageUrl }: { size?: number; imageUrl?: string | null }) {
  return (
    <img
      src={imageUrl || `${import.meta.env.BASE_URL}logo_png.png`}
      alt="PLAY TENNIS HOUSE"
      style={{ width: size, height: size }}
      className="object-contain"
    />
  );
}
