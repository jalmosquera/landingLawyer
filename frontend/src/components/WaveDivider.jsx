function WaveDivider({ position = 'bottom', color = '#f9fafb' }) {
  return (
    <div
      className={`absolute ${position === 'bottom' ? 'bottom-0' : 'top-0'} left-0 w-full overflow-hidden`}
      style={{
        lineHeight: 0,
        transform: position === 'bottom' ? 'translateY(1px)' : 'translateY(-1px)'
      }}
    >
      <svg
        className="relative block w-full"
        style={{ height: '80px', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,80 C240,100 360,110 720,60 C1080,10 1200,40 1440,60 L1440,120 L0,120 Z"
          style={{ fill: color }}
        ></path>
      </svg>
    </div>
  )
}

export default WaveDivider
