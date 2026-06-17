import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f1c43e',
          borderRadius: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'serif',
            fontWeight: 900,
            fontSize: 120,
            color: '#15130e',
            lineHeight: 1,
            marginTop: '-8px',
          }}
        >
          t
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
