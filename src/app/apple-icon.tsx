import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1F6FEB',
          borderRadius: '32px',
          fontSize: '100px',
          fontWeight: 700,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        EJ
      </div>
    ),
    { ...size },
  );
}
