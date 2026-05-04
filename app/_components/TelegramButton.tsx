'use client'; 

const TelegramButton = () => {
  return (
    <a
      href="https://t.me/premierlounge1" 
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#1A1A1A', // 👈 Change this to match your theme (e.g., your brand's primary color)
        color: '#FFFFFF', // 👈 Text & Icon color (White or Gold works well for lounges)
        borderRadius: '30px', // Makes it a pill shape instead of a circle
        padding: '10px 20px', // Gives the text room to breathe
        display: 'flex',
        alignItems: 'center',
        gap: '12px', // Space between the icon and the text
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: 9999, 
        transition: 'all 0.2s ease-in-out',
        textDecoration: 'none', // Removes default link underline
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'; // Cool lift effect on hover
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      }}
    >
      {/* Telegram SVG Icon */}
      <svg 
        width="28" 
        height="28" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.015-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.448z" 
          fill="currentColor"
        />
      </svg>

      {/* English & Khmer Text Container */}
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
        <span style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2' }}>
          Send Inquiry
        </span>
        <span style={{ fontSize: '13px', opacity: 0.8, marginTop: '2px' }}>
          ផ្ញើសារ
        </span>
      </div>
    </a>
  );
};

export default TelegramButton;