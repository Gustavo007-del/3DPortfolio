import CastleCanvas from './CastleCanvas'

export default function Page() {
  return (
    <main>
      {/* Fixed, full-screen 3D canvas - sits behind the scroll content */}
      <CastleCanvas />

      {/*
        This is what actually creates the scrollbar. The canvas above is
        `position: fixed`, so it doesn't take up document height on its own -
        you need real scrollable content over/around it. Swap this out for
        your actual page sections; just keep enough total height that
        window.scrollY has real room to move (a few viewport-heights at least).
      */}
      <div style={{ position: 'relative', height: '400vh' }}>
        {/* your text / sections / overlays go here */}
      </div>
    </main>
  )
}
