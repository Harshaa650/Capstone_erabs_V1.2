import Shell from '../components/Shell'
import AIAssistant from '../components/AIAssistant'

export default function AssistantPage() {
  return (
    <Shell>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-1">AI Assistant</h1>
        <p className="text-gray-400 text-sm">
          Ask anything about rooms, bookings, analytics and approvals. Use natural language.
        </p>
      </div>
      <div style={{ height: 'calc(100vh - 220px)', minHeight: 540 }}>
        <AIAssistant variant="fullscreen" />
      </div>
    </Shell>
  )
}
