import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#f1c43e',
          borderRadius: '112px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'serif',
            fontWeight: 900,
            fontSize: 320,
            color: '#15130e',
            lineHeight: 1,
            marginTop: '-20px',
          }}
        >
          t
        </span>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
