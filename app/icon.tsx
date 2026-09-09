import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0EA5E9',
          borderRadius: '50%',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 34,
          color: 'white',
          letterSpacing: '-1px',
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
