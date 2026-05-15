'use client';

export default function ScrollToBookingButton() {
  return (
    <button
      onClick={() => document.getElementById('etape-2')?.scrollIntoView({ behavior: 'smooth' })}
      className="inline-flex items-center justify-center rounded-[5px] transition-colors"
      style={{
        backgroundColor: '#E6007E', color: 'white',
        fontWeight: 700, fontSize: '1.125rem',
        padding: '14px 28px', border: 'none', cursor: 'pointer',
        alignSelf: 'flex-start',
      }}
    >
      Réserver votre vol →
    </button>
  );
}
