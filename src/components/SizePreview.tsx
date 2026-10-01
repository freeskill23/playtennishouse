import { useMemo } from "react";

interface SizePreviewProps {
  width: number;
  depth: number;
  height: number;
  maxW?: number;
  maxD?: number;
  maxH?: number;
}

export function SizePreview({
  width,
  depth,
  height,
  maxW = 1200,
  maxD = 900,
  maxH = 1000,
}: SizePreviewProps) {
  const { wScale, dScale, hScale } = useMemo(() => {
    return {
      wScale: width / maxW,
      dScale: depth / maxD,
      hScale: height / maxH,
    };
  }, [width, depth, height, maxW, maxD, maxH]);

  const maxBoxW = 220;
  const maxBoxH = 180;
  const boxW = Math.max(30, maxBoxW * wScale);
  const boxH = Math.max(30, maxBoxH * hScale);
  const depthOffset = 40 * dScale;

  const svgW = 320;
  const svgH = 240;
  const cx = svgW / 2;
  const groundY = svgH - 30;

  return (
    <div className="flex w-full flex-col items-center overflow-hidden">
      <svg width="100%" height="auto" viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-[280px]" preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1={groundY} x2={svgW - 20} y2={groundY} stroke="#E0D0BA" strokeWidth="1.5" />

        {/* Back face */}
        <polygon
          points={`${cx - boxW / 2 + depthOffset / 2},${groundY - boxH} ${cx + boxW / 2 + depthOffset / 2},${groundY - boxH} ${cx + boxW / 2 + depthOffset / 2},${groundY} ${cx - boxW / 2 + depthOffset / 2},${groundY}`}
          fill="#F5EFE6"
          stroke="#CDB99E"
          strokeWidth="1.5"
          style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        {/* Right face (depth) */}
        <polygon
          points={`${cx + boxW / 2},${groundY - boxH} ${cx + boxW / 2 + depthOffset / 2},${groundY - boxH} ${cx + boxW / 2 + depthOffset / 2},${groundY} ${cx + boxW / 2},${groundY}`}
          fill="#EDE3D3"
          stroke="#CDB99E"
          strokeWidth="1.5"
          style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        {/* Front face */}
        <rect
          x={cx - boxW / 2}
          y={groundY - boxH}
          width={boxW}
          height={boxH}
          fill="#FBF8F3"
          stroke="#B8A07E"
          strokeWidth="2"
          style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        {/* Door opening */}
        <rect
          x={cx - Math.min(boxW * 0.28, 45)}
          y={groundY - Math.min(boxH * 0.6, 100)}
          width={Math.min(boxW * 0.56, 90)}
          height={Math.min(boxH * 0.6, 100)}
          fill="#EDE3D3"
          stroke="#CDB99E"
          strokeWidth="1.5"
          rx="4"
          style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        {/* Top face (depth perspective) */}
        <polygon
          points={`${cx - boxW / 2},${groundY - boxH} ${cx + boxW / 2},${groundY - boxH} ${cx + boxW / 2 + depthOffset / 2},${groundY - boxH} ${cx - boxW / 2 + depthOffset / 2},${groundY - boxH}`}
          fill="#E0D0BA"
          stroke="#CDB99E"
          strokeWidth="1.5"
          style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Dimension labels */}
        <text x={cx} y={groundY + 18} textAnchor="middle" className="fill-charcoal text-[11px] font-medium" style={{ transition: "all 0.3s ease" }}>
          가로 {width}mm
        </text>
        <text x={cx + boxW / 2 + depthOffset / 2 + 8} y={groundY - boxH / 2} textAnchor="start" className="fill-charcoal-muted text-[10px]" style={{ transition: "all 0.3s ease" }}>
          높이 {height}mm
        </text>
        <text x={cx + boxW / 2 + depthOffset / 4} y={groundY - boxH - 8} textAnchor="middle" className="fill-charcoal-muted text-[10px]" style={{ transition: "all 0.3s ease" }}>
          세로 {depth}mm
        </text>
      </svg>
    </div>
  );
}
