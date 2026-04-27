import { useSearchParams } from 'react-router-dom'
import { Suspense } from 'react'
import '../three-rooms/setup'
import MeetingRoom from '../three-rooms/MeetingRoom'
import LargeMeetingRoom from '../three-rooms/LargeMeetingRoom'
import MediumMeetingRoom from '../three-rooms/MediumMeetingRoom'
import { CabinRoom } from '../three-rooms/CabinRoom'
import ManagerCabinRoom from '../three-rooms/ManagerCabinRoom'
import ChessRoom from '../three-rooms/ChessRoom'
import FoosballRoom from '../three-rooms/FoosballRoom'
import ParkingLotRoom from '../three-rooms/ParkingLotRoom'

/**
 * Fullscreen 3D scene viewer — designed to be embedded via <iframe>.
 * URL: /room3d?type=normal|large|medium|cabin|manager|chess|foosball|parking
 */
export default function Room3DViewer() {
  const [sp] = useSearchParams()
  const type = (sp.get('type') || 'normal').toLowerCase()

  const renderScene = () => {
    switch (type) {
      case 'large': return <LargeMeetingRoom />
      case 'medium': return <MediumMeetingRoom />
      case 'cabin': return <CabinRoom />
      case 'manager': return <ManagerCabinRoom />
      case 'chess': return <ChessRoom />
      case 'foosball': return <FoosballRoom />
      case 'parking': return <ParkingLotRoom />
      case 'normal':
      default: return <MeetingRoom />
    }
  }

  return (
    <div
      data-testid="room-3d-viewer"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#06090f',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      <Suspense
        fallback={
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6fa8ff', fontFamily: 'system-ui',
          }}>
            Loading 3D scene…
          </div>
        }
      >
        {renderScene()}
      </Suspense>
    </div>
  )
}
