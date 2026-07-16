export function Logo({ size = 40, imageUrl }: { size?: number; imageUrl?: string | null }) {
  return (
    <img
      src={imageUrl || '/logo_png.png'}
      alt="PLAY TENNIS HOUSE"
      style={{ width: size, height: size }}
      className="object-contain"
    />
  );
}
